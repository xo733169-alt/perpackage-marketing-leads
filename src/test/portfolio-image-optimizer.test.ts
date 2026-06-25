import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { optimizePortfolioImage, PortfolioImageOptimizationError } from "@/lib/portfolio-image-optimizer";

describe("portfolio image optimizer", () => {
  it("converts uploaded images to optimized WebP buffers", async () => {
    const inputBuffer = await sharp({
      create: {
        width: 2400,
        height: 1200,
        channels: 3,
        background: "#f2f0ea"
      }
    })
      .jpeg()
      .toBuffer();

    const result = await optimizePortfolioImage(inputBuffer);
    const mainMetadata = await sharp(result.mainBuffer).metadata();
    const thumbnailMetadata = await sharp(result.thumbnailBuffer).metadata();

    expect(result.format).toBe("webp");
    expect(result.width).toBeLessThanOrEqual(1600);
    expect(result.height).toBeLessThanOrEqual(1600);
    expect(mainMetadata.format).toBe("webp");
    expect(thumbnailMetadata.format).toBe("webp");
    expect(thumbnailMetadata.width).toBeLessThanOrEqual(600);
    expect(thumbnailMetadata.height).toBeLessThanOrEqual(600);
  });

  it("rejects unreadable image buffers", async () => {
    await expect(optimizePortfolioImage(Buffer.from("not-an-image"))).rejects.toBeInstanceOf(
      PortfolioImageOptimizationError
    );
  });
});
