import crypto from "node:crypto";
import path from "node:path";

export const PORTFOLIO_UPLOAD_DIR = "public/uploads/portfolio";
export const PORTFOLIO_UPLOAD_PUBLIC_PATH = "/uploads/portfolio";
export const MAX_PORTFOLIO_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const PORTFOLIO_MAIN_IMAGE_MAX_WIDTH = 1600;
export const PORTFOLIO_MAIN_IMAGE_MAX_HEIGHT = 1600;
export const PORTFOLIO_MAIN_IMAGE_WEBP_QUALITY = 82;
export const PORTFOLIO_THUMBNAIL_MAX_WIDTH = 600;
export const PORTFOLIO_THUMBNAIL_MAX_HEIGHT = 600;
export const PORTFOLIO_THUMBNAIL_WEBP_QUALITY = 78;

const MIME_TYPE_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

const MIME_TYPE_TO_ALLOWED_ORIGINAL_EXTENSIONS: Record<keyof typeof MIME_TYPE_TO_EXTENSION, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"]
};

export type PortfolioImageMimeType = keyof typeof MIME_TYPE_TO_EXTENSION;

export type PortfolioImageUploadResponse = {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  originalSizeBytes?: number;
  optimizedSizeBytes?: number;
};

export function isAllowedPortfolioImageMimeType(mimeType: string): mimeType is PortfolioImageMimeType {
  return Object.prototype.hasOwnProperty.call(MIME_TYPE_TO_EXTENSION, mimeType);
}

export function getPortfolioImageExtension(mimeType: string): "jpg" | "png" | "webp" | null {
  return isAllowedPortfolioImageMimeType(mimeType) ? MIME_TYPE_TO_EXTENSION[mimeType] : null;
}

export function hasAllowedPortfolioImageExtension(filename: string, mimeType: string): boolean {
  if (!isAllowedPortfolioImageMimeType(mimeType)) return false;

  const extension = path.extname(filename).replace(".", "").toLowerCase();
  if (!extension) return false;

  return MIME_TYPE_TO_ALLOWED_ORIGINAL_EXTENSIONS[mimeType].includes(extension);
}

function formatDateStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function createSafePortfolioImageId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) || crypto.randomUUID();
}

export function createSafePortfolioImageFilename(
  mimeType: string,
  id: string = crypto.randomUUID(),
  date = new Date()
): string {
  const extension = getPortfolioImageExtension(mimeType);
  if (!extension) {
    throw new Error("Unsupported portfolio image MIME type.");
  }

  const safeId = createSafePortfolioImageId(id);

  return `portfolio-${formatDateStamp(date)}-${safeId}.${extension}`;
}

export function createPortfolioOptimizedImageFilename(
  id: string = crypto.randomUUID(),
  date = new Date()
): string {
  const safeId = createSafePortfolioImageId(id);

  return `portfolio-${formatDateStamp(date)}-${safeId}.webp`;
}

export function createPortfolioThumbnailFilename(baseFilename: string): string {
  if (!baseFilename || baseFilename !== path.basename(baseFilename) || baseFilename.includes("..")) {
    throw new Error("Invalid portfolio image filename.");
  }

  const extension = path.extname(baseFilename);
  const filenameWithoutExtension = baseFilename.slice(0, baseFilename.length - extension.length);

  return `${filenameWithoutExtension}-thumb.webp`;
}

export function buildPortfolioImagePublicUrl(filename: string): string {
  if (!filename || filename !== path.basename(filename) || filename.includes("..")) {
    throw new Error("Invalid portfolio image filename.");
  }

  return `${PORTFOLIO_UPLOAD_PUBLIC_PATH}/${filename}`;
}

export function getPortfolioImageValidationError(file: Pick<File, "name" | "size" | "type">): string | null {
  if (!file.name || file.size <= 0) {
    return "업로드할 이미지 파일을 선택해 주세요.";
  }

  if (file.size > MAX_PORTFOLIO_IMAGE_SIZE_BYTES) {
    return "대표 이미지는 5MB 이하 파일만 업로드할 수 있습니다.";
  }

  if (!isAllowedPortfolioImageMimeType(file.type)) {
    return "JPG, PNG, WebP 이미지만 업로드할 수 있습니다.";
  }

  if (!hasAllowedPortfolioImageExtension(file.name, file.type)) {
    return "파일 확장자와 이미지 형식을 확인해 주세요. JPG, PNG, WebP만 지원합니다.";
  }

  return null;
}
