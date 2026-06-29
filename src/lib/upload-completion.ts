import { CAFE24_ORDER_LINK_PENDING_STATUS } from "@/lib/cafe24";
import { prisma } from "@/lib/prisma";
import {
  getPrintFileValidationError,
  getUploadLimitConfig,
  UPLOADED_FILE_STATUS_PREPARED,
  UPLOADED_FILE_STATUS_UPLOADED
} from "@/lib/print-file-upload-schema";
import { getPrintFileStorageAdapter } from "@/lib/storage/naver-object-storage";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StorageOperationError
} from "@/lib/storage/storage-adapter";

type SyncPreparedUploadInput = {
  projectId?: string;
  take?: number;
};

type SyncPreparedUploadResult = {
  checked: number;
  completed: number;
};

export async function syncPreparedUploadedFiles({
  projectId,
  take = 30
}: SyncPreparedUploadInput = {}): Promise<SyncPreparedUploadResult> {
  let storage: ReturnType<typeof getPrintFileStorageAdapter>;

  try {
    storage = getPrintFileStorageAdapter();
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      return { checked: 0, completed: 0 };
    }

    throw error;
  }

  const files = await prisma.uploadedFile.findMany({
    where: {
      uploadStatus: UPLOADED_FILE_STATUS_PREPARED,
      ...(projectId ? { projectId } : {})
    },
    orderBy: [{ createdAt: "desc" }],
    take,
    select: {
      id: true,
      projectId: true,
      originalFilename: true,
      fileSize: true,
      fileType: true,
      storageKey: true,
      project: {
        select: {
          cafe24OrderNumber: true
        }
      }
    }
  });
  let completed = 0;
  const limits = getUploadLimitConfig();

  for (const file of files) {
    try {
      const objectMetadata = await storage.headObject(file.storageKey);
      const validationError = getPrintFileValidationError(
        {
          name: file.originalFilename,
          size: objectMetadata.contentLength,
          type: objectMetadata.contentType ?? file.fileType ?? ""
        },
        limits
      );

      if (validationError) continue;

      const completedAt = new Date();
      const nextProjectStatus = file.project.cafe24OrderNumber?.trim()
        ? UPLOADED_FILE_STATUS_UPLOADED
        : CAFE24_ORDER_LINK_PENDING_STATUS;

      await prisma.$transaction(async (tx) => {
        const updatedFile = await tx.uploadedFile.updateMany({
          where: {
            id: file.id,
            uploadStatus: UPLOADED_FILE_STATUS_PREPARED
          },
          data: {
            fileSize: objectMetadata.contentLength,
            fileType: objectMetadata.contentType ?? file.fileType,
            uploadStatus: UPLOADED_FILE_STATUS_UPLOADED,
            reviewStatus: UPLOADED_FILE_STATUS_UPLOADED,
            uploadedAt: completedAt
          }
        });

        if (updatedFile.count === 0) return;

        await tx.uploadProject.update({
          where: { id: file.projectId },
          data: {
            status: nextProjectStatus,
            reviewStatus: UPLOADED_FILE_STATUS_UPLOADED
          }
        });

        const existingLog = await tx.fileReviewLog.findFirst({
          where: {
            fileId: file.id,
            status: UPLOADED_FILE_STATUS_UPLOADED,
            createdBy: "customer"
          },
          select: { id: true }
        });

        if (!existingLog) {
          await tx.fileReviewLog.create({
            data: {
              projectId: file.projectId,
              fileId: file.id,
              status: UPLOADED_FILE_STATUS_UPLOADED,
              message: `${file.originalFilename} 파일 업로드가 완료되었습니다.`,
              createdBy: "customer"
            }
          });
        }

        completed += 1;
      });
    } catch (error) {
      if (
        error instanceof StorageObjectNotFoundError ||
        error instanceof StorageConfigurationError ||
        error instanceof StorageOperationError
      ) {
        continue;
      }

      throw error;
    }
  }

  return { checked: files.length, completed };
}
