import { NextResponse } from "next/server";
import { isAllowedMutationOrigin } from "@/lib/auth";
import { CAFE24_ORDER_LINK_PENDING_STATUS } from "@/lib/cafe24";
import { prisma } from "@/lib/prisma";
import {
  completeUploadFileSchema,
  getFileExtension,
  getPrintFileValidationError,
  getProjectTotalLimitError,
  getUploadLimitConfig,
  prepareUploadFileSchema,
  PRINT_FILE_UPLOAD_STATUS_LABELS,
  UPLOADED_FILE_STATUS_PREPARED,
  UPLOADED_FILE_STATUS_UPLOADED
} from "@/lib/print-file-upload-schema";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StorageOperationError
} from "@/lib/storage/storage-adapter";
import { getPrintFileStorageAdapter } from "@/lib/storage/naver-object-storage";
import { buildPrintFileStorageKey, createSafeStoredFilename } from "@/lib/storage/upload-path";

export const runtime = "nodejs";

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

function normalizeOptionalText(value: string | undefined) {
  return value?.trim() || null;
}

function getSafeStorageError(error: unknown) {
  if (error instanceof StorageConfigurationError) {
    return {
      status: 500,
      message: "파일 저장소 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요."
    };
  }

  if (error instanceof StorageObjectNotFoundError) {
    return {
      status: 400,
      message: "업로드된 파일을 아직 확인할 수 없습니다. 파일 전송이 끝난 뒤 다시 시도해 주세요."
    };
  }

  if (error instanceof StorageOperationError) {
    return {
      status: 500,
      message: error.message
    };
  }

  return {
    status: 500,
    message: "파일 저장소 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
  };
}

async function handlePrepare(body: unknown) {
  const parsed = prepareUploadFileSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "파일 정보를 확인해 주세요.", 400);
  }

  const input = parsed.data;
  const limits = getUploadLimitConfig();
  const validationError = getPrintFileValidationError(
    {
      name: input.originalFilename,
      size: input.fileSize,
      type: input.fileType ?? ""
    },
    limits
  );

  if (validationError) {
    return jsonError(validationError, 400);
  }

  const project = await prisma.uploadProject.findUnique({
    where: { id: input.projectId },
    select: { id: true }
  });

  if (!project) {
    return jsonError("업로드 프로젝트를 찾을 수 없습니다.", 404);
  }

  const currentTotal = await prisma.uploadedFile.aggregate({
    where: {
      projectId: input.projectId,
      uploadStatus: UPLOADED_FILE_STATUS_UPLOADED
    },
    _sum: { fileSize: true },
  });
  const latestVersion = await prisma.uploadedFile.aggregate({
    where: {
      projectId: input.projectId
    },
    _max: { version: true }
  });
  const totalLimitError = getProjectTotalLimitError(currentTotal._sum.fileSize ?? 0, input.fileSize, limits);

  if (totalLimitError) {
    return jsonError(totalLimitError, 400);
  }

  const storage = getPrintFileStorageAdapter();
  const version = (latestVersion._max.version ?? 0) + 1;
  const storedFilename = createSafeStoredFilename(input.originalFilename);
  const storageKey = buildPrintFileStorageKey({
    projectId: input.projectId,
    version,
    storedFilename
  });
  const upload = await storage.createUploadUrl({
    key: storageKey,
    contentType: input.fileType || "application/octet-stream",
    expiresInSeconds: limits.signedUrlExpiresSeconds
  });
  const file = await prisma.uploadedFile.create({
    data: {
      projectId: input.projectId,
      originalFilename: input.originalFilename,
      storedFilename,
      storageBucket: storage.bucket,
      storageKey,
      fileSize: input.fileSize,
      fileType: normalizeOptionalText(input.fileType),
      fileExtension: getFileExtension(input.originalFilename),
      version,
      uploadStatus: UPLOADED_FILE_STATUS_PREPARED,
      reviewStatus: "upload_waiting"
    },
    select: {
      id: true,
      originalFilename: true,
      storedFilename: true,
      fileSize: true,
      fileType: true,
      fileExtension: true,
      version: true,
      reviewStatus: true
    }
  });

  return NextResponse.json({
    file,
    upload
  });
}

async function handleComplete(body: unknown) {
  const parsed = completeUploadFileSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "업로드 파일을 확인해 주세요.", 400);
  }

  const input = parsed.data;
  const file = await prisma.uploadedFile.findFirst({
    where: {
      id: input.fileId,
      projectId: input.projectId
    },
    select: {
      id: true,
      projectId: true,
      originalFilename: true,
      storageKey: true,
      fileSize: true,
      fileType: true,
      uploadStatus: true
    }
  });

  if (!file) {
    return jsonError("업로드 파일 정보를 찾을 수 없습니다.", 404);
  }

  const storage = getPrintFileStorageAdapter();
  const objectMetadata = await storage.headObject(file.storageKey);
  const limits = getUploadLimitConfig();
  const validationError = getPrintFileValidationError(
    {
      name: file.originalFilename,
      size: objectMetadata.contentLength,
      type: objectMetadata.contentType ?? file.fileType ?? ""
    },
    limits
  );

  if (validationError) {
    return jsonError(validationError, 400);
  }

  const currentTotal = await prisma.uploadedFile.aggregate({
    where: {
      projectId: file.projectId,
      uploadStatus: UPLOADED_FILE_STATUS_UPLOADED,
      NOT: { id: file.id }
    },
    _sum: { fileSize: true }
  });
  const totalLimitError = getProjectTotalLimitError(
    currentTotal._sum.fileSize ?? 0,
    objectMetadata.contentLength,
    limits
  );

  if (totalLimitError) {
    return jsonError(totalLimitError, 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const uploadedFile = await tx.uploadedFile.update({
      where: { id: file.id },
      data: {
        fileSize: objectMetadata.contentLength,
        fileType: objectMetadata.contentType ?? file.fileType,
        uploadStatus: UPLOADED_FILE_STATUS_UPLOADED,
        reviewStatus: "uploaded",
        uploadedAt: new Date()
      },
      select: {
        id: true,
        originalFilename: true,
        fileSize: true,
        fileType: true,
        fileExtension: true,
        version: true,
        reviewStatus: true,
        uploadedAt: true
      }
    });

    const currentProject = await tx.uploadProject.findUnique({
      where: { id: file.projectId },
      select: {
        cafe24OrderNumber: true,
        status: true
      }
    });
    const nextProjectStatus = currentProject?.cafe24OrderNumber?.trim()
      ? "uploaded"
      : CAFE24_ORDER_LINK_PENDING_STATUS;
    const project = await tx.uploadProject.update({
      where: { id: file.projectId },
      data: {
        status: nextProjectStatus,
        reviewStatus: "uploaded"
      },
      select: {
        id: true,
        cafe24OrderNumber: true,
        customerName: true,
        productName: true,
        status: true,
        reviewStatus: true
      }
    });

    await tx.fileReviewLog.create({
      data: {
        projectId: file.projectId,
        fileId: file.id,
        status: "uploaded",
        message: `${uploadedFile.originalFilename} 파일 업로드가 완료되었습니다.`,
        createdBy: "customer"
      }
    });

    return { file: uploadedFile, project };
  });

  return NextResponse.json({
    ...updated,
    statusLabel: PRINT_FILE_UPLOAD_STATUS_LABELS.uploaded
  });
}

export async function POST(request: Request) {
  if (!isAllowedMutationOrigin(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  try {
    const body = (await request.json().catch(() => null)) as { intent?: string } | null;

    if (!body || typeof body !== "object") {
      return jsonError("파일 업로드 요청을 확인해 주세요.", 400);
    }

    if (body.intent === "prepare") {
      return await handlePrepare(body);
    }

    if (body.intent === "complete") {
      return await handleComplete(body);
    }

    return jsonError("파일 업로드 처리 단계를 확인해 주세요.", 400);
  } catch (error) {
    console.error("[api/uploads/files] upload failed", error);
    const safeError = getSafeStorageError(error);
    return jsonError(safeError.message, safeError.status);
  }
}
