import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUploadLimitConfig, UPLOADED_FILE_STATUS_UPLOADED } from "@/lib/print-file-upload-schema";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StorageOperationError
} from "@/lib/storage/storage-adapter";
import { getPrintFileStorageAdapter } from "@/lib/storage/naver-object-storage";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function GET(request: Request, { params }: { params: { id: string; fileId: string } }) {
  if (!isAdminAuthenticated()) {
    return jsonError("인증이 필요합니다.", 401);
  }

  const file = await prisma.uploadedFile.findFirst({
    where: {
      id: params.fileId,
      projectId: params.id,
      uploadStatus: UPLOADED_FILE_STATUS_UPLOADED
    },
    select: {
      originalFilename: true,
      storageKey: true
    }
  });

  if (!file) {
    return jsonError("다운로드할 파일을 찾을 수 없습니다.", 404);
  }

  try {
    const storage = getPrintFileStorageAdapter();
    const downloadUrl = await storage.createDownloadUrl({
      key: file.storageKey,
      filename: file.originalFilename,
      expiresInSeconds: getUploadLimitConfig().signedUrlExpiresSeconds
    });

    return NextResponse.redirect(downloadUrl.startsWith("/") ? new URL(downloadUrl, request.url) : downloadUrl);
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      return jsonError("파일 저장소 설정이 완료되지 않았습니다.", 500);
    }

    if (error instanceof StorageObjectNotFoundError) {
      return jsonError("저장소에서 파일을 찾을 수 없습니다.", 404);
    }

    if (error instanceof StorageOperationError) {
      return jsonError(error.message, 500);
    }

    return jsonError("다운로드 주소를 만드는 중 문제가 발생했습니다.", 500);
  }
}
