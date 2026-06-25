import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { optimizePortfolioImage, PortfolioImageOptimizationError } from "@/lib/portfolio-image-optimizer";
import {
  getPortfolioImageStorage,
  PortfolioStorageConfigurationError,
  PortfolioStorageUploadError,
  UnsupportedPortfolioStorageProviderError
} from "@/lib/storage/portfolio-storage";
import {
  createPortfolioOptimizedImageFilename,
  createPortfolioThumbnailFilename,
  getPortfolioImageValidationError,
  MAX_PORTFOLIO_IMAGE_SIZE_BYTES
} from "@/lib/upload-utils";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return jsonError("인증이 필요합니다.", 401);
  }

  if (!isAllowedMutationOrigin(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return jsonError("업로드할 이미지 파일을 선택해 주세요.", 400);
  }

  const validationError = getPortfolioImageValidationError(file);
  if (validationError) {
    return jsonError(validationError, 400);
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  if (originalBuffer.byteLength > MAX_PORTFOLIO_IMAGE_SIZE_BYTES) {
    return jsonError("대표 이미지는 5MB 이하 파일만 업로드할 수 있습니다.", 400);
  }

  const filename = createPortfolioOptimizedImageFilename();
  const thumbnailFilename = createPortfolioThumbnailFilename(filename);

  try {
    const storage = getPortfolioImageStorage();
    const optimizedImage = await optimizePortfolioImage(originalBuffer);
    const storedImage = await storage.save({
      filename,
      buffer: optimizedImage.mainBuffer
    });
    const storedThumbnail = await storage.save({
      filename: thumbnailFilename,
      buffer: optimizedImage.thumbnailBuffer
    });

    return NextResponse.json({
      url: storedImage.url,
      thumbnailUrl: storedThumbnail.url,
      width: optimizedImage.width,
      height: optimizedImage.height,
      format: optimizedImage.format,
      originalSizeBytes: originalBuffer.byteLength,
      optimizedSizeBytes: storedImage.sizeBytes
    });
  } catch (error) {
    if (error instanceof PortfolioImageOptimizationError) {
      return jsonError("이미지를 읽거나 최적화할 수 없습니다. JPG, PNG, WebP 파일인지 확인해 주세요.", 400);
    }

    if (error instanceof PortfolioStorageConfigurationError) {
      return jsonError("이미지 저장소 설정이 올바르지 않습니다. 관리자에게 문의해 주세요.", 500);
    }

    if (error instanceof PortfolioStorageUploadError) {
      return jsonError("이미지 저장소 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
    }

    if (error instanceof UnsupportedPortfolioStorageProviderError) {
      return jsonError("지원하지 않는 제작 사례 이미지 저장소 설정입니다. PORTFOLIO_STORAGE_PROVIDER 값을 확인해 주세요.", 500);
    }

    return jsonError("대표 이미지 업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
}
