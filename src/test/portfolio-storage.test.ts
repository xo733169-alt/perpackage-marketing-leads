import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";

const putMock = vi.hoisted(() => vi.fn());
const s3SendMock = vi.hoisted(() => vi.fn());
const s3ClientMock = vi.hoisted(() => vi.fn(() => ({ send: s3SendMock })));
const putObjectCommandMock = vi.hoisted(() => vi.fn((input) => ({ input })));

vi.mock("@vercel/blob", () => ({
  put: putMock
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: s3ClientMock,
  PutObjectCommand: putObjectCommandMock
}));

import {
  buildPortfolioBlobPathname,
  buildPortfolioObjectStorageKey,
  createLocalPortfolioImageStorage,
  getPortfolioImageStorage,
  localPortfolioImageStorage,
  naverObjectPortfolioImageStorage,
  PortfolioStorageConfigurationError,
  UnsupportedPortfolioStorageProviderError,
  vercelBlobPortfolioImageStorage
} from "@/lib/storage/portfolio-storage";

const tempDirs: string[] = [];
const originalProvider = process.env.PORTFOLIO_STORAGE_PROVIDER;
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalNaverAccessKey = process.env.NAVER_OBJECT_STORAGE_ACCESS_KEY;
const originalNaverSecretKey = process.env.NAVER_OBJECT_STORAGE_SECRET_KEY;
const originalNaverBucket = process.env.NAVER_OBJECT_STORAGE_BUCKET;
const originalNaverEndpoint = process.env.NAVER_OBJECT_STORAGE_ENDPOINT;
const originalNaverRegion = process.env.NAVER_OBJECT_STORAGE_REGION;
const originalNaverPublicBaseUrl = process.env.NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL;

async function createTempUploadDir() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "portfolio-storage-test-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  if (originalProvider === undefined) {
    delete process.env.PORTFOLIO_STORAGE_PROVIDER;
  } else {
    process.env.PORTFOLIO_STORAGE_PROVIDER = originalProvider;
  }

  if (originalBlobToken === undefined) {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  } else {
    process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
  }

  const naverEnv = {
    NAVER_OBJECT_STORAGE_ACCESS_KEY: originalNaverAccessKey,
    NAVER_OBJECT_STORAGE_SECRET_KEY: originalNaverSecretKey,
    NAVER_OBJECT_STORAGE_BUCKET: originalNaverBucket,
    NAVER_OBJECT_STORAGE_ENDPOINT: originalNaverEndpoint,
    NAVER_OBJECT_STORAGE_REGION: originalNaverRegion,
    NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL: originalNaverPublicBaseUrl
  };

  Object.entries(naverEnv).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });

  putMock.mockReset();
  s3SendMock.mockReset();
  s3ClientMock.mockClear();
  putObjectCommandMock.mockClear();

  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function configureNaverObjectStorageEnv() {
  process.env.NAVER_OBJECT_STORAGE_ACCESS_KEY = "test-access-key";
  process.env.NAVER_OBJECT_STORAGE_SECRET_KEY = "test-secret-key";
  process.env.NAVER_OBJECT_STORAGE_BUCKET = "perpackage-test";
  process.env.NAVER_OBJECT_STORAGE_ENDPOINT = "https://kr.object.ncloudstorage.com";
  process.env.NAVER_OBJECT_STORAGE_REGION = "kr-standard";
  process.env.NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL = "https://cdn.example.com/perpackage-test";
}

describe("portfolio image storage", () => {
  it("stores files through the local adapter and returns a public URL", async () => {
    const uploadDir = await createTempUploadDir();
    const storage = createLocalPortfolioImageStorage({ uploadDir });
    const buffer = Buffer.from("optimized-image");

    const result = await storage.save({
      filename: "portfolio-20260621-test.webp",
      buffer
    });

    expect(result).toEqual({
      url: "/uploads/portfolio/portfolio-20260621-test.webp",
      filename: "portfolio-20260621-test.webp",
      sizeBytes: buffer.byteLength
    });
    await expect(readFile(path.join(uploadDir, "portfolio-20260621-test.webp"))).resolves.toEqual(buffer);
  });

  it("rejects path traversal filenames", async () => {
    const uploadDir = await createTempUploadDir();
    const storage = createLocalPortfolioImageStorage({ uploadDir });

    await expect(
      storage.save({
        filename: "../secret.webp",
        buffer: Buffer.from("bad")
      })
    ).rejects.toThrow("Invalid portfolio image filename.");
  });

  it("selects local storage when provider is empty or local", () => {
    delete process.env.PORTFOLIO_STORAGE_PROVIDER;
    expect(getPortfolioImageStorage()).toBe(localPortfolioImageStorage);

    process.env.PORTFOLIO_STORAGE_PROVIDER = "local";
    expect(getPortfolioImageStorage()).toBe(localPortfolioImageStorage);
  });

  it("fails clearly for unsupported storage providers", () => {
    process.env.PORTFOLIO_STORAGE_PROVIDER = "s3";

    expect(() => getPortfolioImageStorage()).toThrow(UnsupportedPortfolioStorageProviderError);
  });

  it("selects Vercel Blob storage when provider is vercel-blob", () => {
    process.env.PORTFOLIO_STORAGE_PROVIDER = "vercel-blob";

    expect(getPortfolioImageStorage()).toBe(vercelBlobPortfolioImageStorage);
  });

  it("selects Naver Object Storage when provider is naver-object-storage or naver", () => {
    process.env.PORTFOLIO_STORAGE_PROVIDER = "naver-object-storage";
    expect(getPortfolioImageStorage()).toBe(naverObjectPortfolioImageStorage);

    process.env.PORTFOLIO_STORAGE_PROVIDER = "naver";
    expect(getPortfolioImageStorage()).toBe(naverObjectPortfolioImageStorage);
  });

  it("requires BLOB_READ_WRITE_TOKEN for Vercel Blob storage", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    await expect(
      vercelBlobPortfolioImageStorage.save({
        filename: "portfolio-20260621-test.webp",
        buffer: Buffer.from("optimized-image")
      })
    ).rejects.toThrow(PortfolioStorageConfigurationError);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejects path traversal filenames before Vercel Blob upload", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    await expect(
      vercelBlobPortfolioImageStorage.save({
        filename: "../secret.webp",
        buffer: Buffer.from("bad")
      })
    ).rejects.toThrow("Invalid portfolio image filename.");
    expect(putMock).not.toHaveBeenCalled();
  });

  it("builds Vercel Blob pathnames under the portfolio prefix", () => {
    expect(buildPortfolioBlobPathname("portfolio-20260621-test.webp")).toBe(
      "portfolio/portfolio-20260621-test.webp"
    );
  });

  it("uploads optimized images to Vercel Blob through the shared storage interface", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    const buffer = Buffer.from("optimized-image");
    putMock.mockResolvedValue({
      url: "https://blob.example.com/portfolio/portfolio-20260621-test.webp"
    });

    const result = await vercelBlobPortfolioImageStorage.save({
      filename: "portfolio-20260621-test.webp",
      buffer
    });

    expect(putMock).toHaveBeenCalledWith("portfolio/portfolio-20260621-test.webp", buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
      token: "test-token"
    });
    expect(result).toEqual({
      url: "https://blob.example.com/portfolio/portfolio-20260621-test.webp",
      filename: "portfolio-20260621-test.webp",
      sizeBytes: buffer.byteLength
    });
  });

  it("builds Naver Object Storage keys under the portfolio prefix", () => {
    expect(buildPortfolioObjectStorageKey("portfolio-20260621-test.webp")).toBe(
      "portfolio/portfolio-20260621-test.webp"
    );
  });

  it("requires Naver Object Storage configuration before upload", async () => {
    await expect(
      naverObjectPortfolioImageStorage.save({
        filename: "portfolio-20260621-test.webp",
        buffer: Buffer.from("optimized-image")
      })
    ).rejects.toThrow(PortfolioStorageConfigurationError);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("rejects path traversal filenames before Naver Object Storage upload", async () => {
    configureNaverObjectStorageEnv();

    await expect(
      naverObjectPortfolioImageStorage.save({
        filename: "../secret.webp",
        buffer: Buffer.from("bad")
      })
    ).rejects.toThrow("Invalid portfolio image filename.");
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("uploads optimized images to Naver Object Storage through the shared storage interface", async () => {
    configureNaverObjectStorageEnv();
    const buffer = Buffer.from("optimized-image");
    s3SendMock.mockResolvedValue({});

    const result = await naverObjectPortfolioImageStorage.save({
      filename: "portfolio-20260621-test.webp",
      buffer
    });

    expect(s3ClientMock).toHaveBeenCalledWith({
      region: "kr-standard",
      endpoint: "https://kr.object.ncloudstorage.com",
      forcePathStyle: true,
      credentials: {
        accessKeyId: "test-access-key",
        secretAccessKey: "test-secret-key"
      }
    });
    expect(putObjectCommandMock).toHaveBeenCalledWith({
      Bucket: "perpackage-test",
      Key: "portfolio/portfolio-20260621-test.webp",
      Body: buffer,
      ContentType: "image/webp"
    });
    expect(s3SendMock).toHaveBeenCalledWith({
      input: {
        Bucket: "perpackage-test",
        Key: "portfolio/portfolio-20260621-test.webp",
        Body: buffer,
        ContentType: "image/webp"
      }
    });
    expect(result).toEqual({
      url: "https://cdn.example.com/perpackage-test/portfolio/portfolio-20260621-test.webp",
      filename: "portfolio-20260621-test.webp",
      sizeBytes: buffer.byteLength
    });
  });
});
