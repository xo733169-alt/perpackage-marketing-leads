import sharp from "sharp";
import {
  PORTFOLIO_MAIN_IMAGE_MAX_HEIGHT,
  PORTFOLIO_MAIN_IMAGE_MAX_WIDTH,
  PORTFOLIO_MAIN_IMAGE_WEBP_QUALITY,
  PORTFOLIO_THUMBNAIL_MAX_HEIGHT,
  PORTFOLIO_THUMBNAIL_MAX_WIDTH,
  PORTFOLIO_THUMBNAIL_WEBP_QUALITY
} from "@/lib/upload-utils";

export type OptimizedPortfolioImage = {
  mainBuffer: Buffer;
  thumbnailBuffer: Buffer;
  width: number;
  height: number;
  format: "webp";
};

export class PortfolioImageOptimizationError extends Error {
  constructor(message = "Invalid portfolio image.") {
    super(message);
    this.name = "PortfolioImageOptimizationError";
  }
}

async function assertReadableImage(buffer: Buffer) {
  const metadata = await sharp(buffer, { failOn: "error" }).metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new PortfolioImageOptimizationError();
  }
}

export async function optimizePortfolioImage(buffer: Buffer): Promise<OptimizedPortfolioImage> {
  try {
    await assertReadableImage(buffer);

    const mainBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: PORTFOLIO_MAIN_IMAGE_MAX_WIDTH,
        height: PORTFOLIO_MAIN_IMAGE_MAX_HEIGHT,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: PORTFOLIO_MAIN_IMAGE_WEBP_QUALITY })
      .toBuffer();

    const mainMetadata = await sharp(mainBuffer).metadata();

    if (!mainMetadata.width || !mainMetadata.height) {
      throw new PortfolioImageOptimizationError();
    }

    const thumbnailBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: PORTFOLIO_THUMBNAIL_MAX_WIDTH,
        height: PORTFOLIO_THUMBNAIL_MAX_HEIGHT,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: PORTFOLIO_THUMBNAIL_WEBP_QUALITY })
      .toBuffer();

    return {
      mainBuffer,
      thumbnailBuffer,
      width: mainMetadata.width,
      height: mainMetadata.height,
      format: "webp"
    };
  } catch (error) {
    if (error instanceof PortfolioImageOptimizationError) {
      throw error;
    }

    throw new PortfolioImageOptimizationError();
  }
}
