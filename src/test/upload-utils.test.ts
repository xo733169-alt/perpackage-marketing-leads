import { describe, expect, it } from "vitest";
import {
  buildPortfolioImagePublicUrl,
  createPortfolioOptimizedImageFilename,
  createSafePortfolioImageFilename,
  createPortfolioThumbnailFilename,
  getPortfolioImageExtension,
  getPortfolioImageValidationError,
  hasAllowedPortfolioImageExtension,
  isAllowedPortfolioImageMimeType,
  MAX_PORTFOLIO_IMAGE_SIZE_BYTES,
  PORTFOLIO_MAIN_IMAGE_MAX_HEIGHT,
  PORTFOLIO_MAIN_IMAGE_MAX_WIDTH,
  PORTFOLIO_MAIN_IMAGE_WEBP_QUALITY,
  PORTFOLIO_THUMBNAIL_MAX_HEIGHT,
  PORTFOLIO_THUMBNAIL_MAX_WIDTH,
  PORTFOLIO_THUMBNAIL_WEBP_QUALITY
} from "@/lib/upload-utils";

describe("portfolio upload utils", () => {
  it("accepts only supported portfolio image MIME types", () => {
    expect(isAllowedPortfolioImageMimeType("image/jpeg")).toBe(true);
    expect(isAllowedPortfolioImageMimeType("image/png")).toBe(true);
    expect(isAllowedPortfolioImageMimeType("image/webp")).toBe(true);
    expect(isAllowedPortfolioImageMimeType("image/svg+xml")).toBe(false);
    expect(isAllowedPortfolioImageMimeType("application/pdf")).toBe(false);
  });

  it("maps supported MIME types to storage extensions", () => {
    expect(getPortfolioImageExtension("image/jpeg")).toBe("jpg");
    expect(getPortfolioImageExtension("image/png")).toBe("png");
    expect(getPortfolioImageExtension("image/webp")).toBe("webp");
    expect(getPortfolioImageExtension("application/zip")).toBeNull();
  });

  it("checks original file extensions against MIME type", () => {
    expect(hasAllowedPortfolioImageExtension("sample.jpg", "image/jpeg")).toBe(true);
    expect(hasAllowedPortfolioImageExtension("sample.jpeg", "image/jpeg")).toBe(true);
    expect(hasAllowedPortfolioImageExtension("sample.png", "image/png")).toBe(true);
    expect(hasAllowedPortfolioImageExtension("sample.svg", "image/svg+xml")).toBe(false);
    expect(hasAllowedPortfolioImageExtension("sample.pdf", "image/jpeg")).toBe(false);
  });

  it("creates safe generated filenames without original user text", () => {
    const filename = createSafePortfolioImageFilename(
      "image/webp",
      "한글 file name ### 123",
      new Date("2026-06-21T00:00:00.000Z")
    );

    expect(filename).toMatch(/^portfolio-20260621-[a-z0-9-]+\.webp$/);
    expect(filename).not.toContain("한글");
    expect(filename).not.toContain(" ");
  });

  it("creates optimized WebP filenames without user-provided text", () => {
    const filename = createPortfolioOptimizedImageFilename(
      "한글 file name ### 123",
      new Date("2026-06-21T00:00:00.000Z")
    );

    expect(filename).toMatch(/^portfolio-20260621-[a-z0-9-]+\.webp$/);
    expect(filename).not.toContain("한글");
    expect(filename).not.toContain(" ");
  });

  it("creates thumbnail filenames from optimized WebP filenames", () => {
    expect(createPortfolioThumbnailFilename("portfolio-20260621-test.webp")).toBe(
      "portfolio-20260621-test-thumb.webp"
    );
    expect(() => createPortfolioThumbnailFilename("../portfolio-20260621-test.webp")).toThrow();
  });

  it("builds safe public upload URLs and rejects traversal", () => {
    expect(buildPortfolioImagePublicUrl("portfolio-20260621-test.jpg")).toBe(
      "/uploads/portfolio/portfolio-20260621-test.jpg"
    );
    expect(() => buildPortfolioImagePublicUrl("../secret.jpg")).toThrow();
  });

  it("keeps expected portfolio image optimization settings", () => {
    expect(PORTFOLIO_MAIN_IMAGE_MAX_WIDTH).toBe(1600);
    expect(PORTFOLIO_MAIN_IMAGE_MAX_HEIGHT).toBe(1600);
    expect(PORTFOLIO_MAIN_IMAGE_WEBP_QUALITY).toBe(82);
    expect(PORTFOLIO_THUMBNAIL_MAX_WIDTH).toBe(600);
    expect(PORTFOLIO_THUMBNAIL_MAX_HEIGHT).toBe(600);
    expect(PORTFOLIO_THUMBNAIL_WEBP_QUALITY).toBe(78);
  });

  it("returns Korean validation messages for invalid files", () => {
    expect(
      getPortfolioImageValidationError({
        name: "large.jpg",
        size: MAX_PORTFOLIO_IMAGE_SIZE_BYTES + 1,
        type: "image/jpeg"
      })
    ).toContain("5MB");
    expect(getPortfolioImageValidationError({ name: "vector.svg", size: 100, type: "image/svg+xml" })).toContain(
      "JPG, PNG, WebP"
    );
    expect(getPortfolioImageValidationError({ name: "image.pdf", size: 100, type: "image/jpeg" })).toContain(
      "확장자"
    );
    expect(getPortfolioImageValidationError({ name: "image.webp", size: 100, type: "image/webp" })).toBeNull();
  });
});
