import path from "node:path";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { put } from "@vercel/blob";
import { buildPortfolioImagePublicUrl, PORTFOLIO_UPLOAD_DIR } from "@/lib/upload-utils";

export type StoredPortfolioImage = {
  url: string;
  filename: string;
  sizeBytes: number;
};

export type StorePortfolioImageInput = {
  filename: string;
  buffer: Buffer;
};

export type PortfolioImageStorage = {
  save(input: StorePortfolioImageInput): Promise<StoredPortfolioImage>;
};

export class UnsupportedPortfolioStorageProviderError extends Error {
  constructor(provider: string) {
    super(`Unsupported portfolio image storage provider: ${provider}`);
    this.name = "UnsupportedPortfolioStorageProviderError";
  }
}

export class PortfolioStorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioStorageConfigurationError";
  }
}

export class PortfolioStorageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioStorageUploadError";
  }
}

export type LocalPortfolioImageStorageOptions = {
  uploadDir?: string;
};

type NaverObjectStorageConfig = {
  accessKey: string;
  secretKey: string;
  bucket: string;
  endpoint: string;
  region: string;
  publicBaseUrl: string;
};

function assertSafePortfolioFilename(filename: string) {
  if (!filename || filename !== path.basename(filename) || filename.includes("..")) {
    throw new Error("Invalid portfolio image filename.");
  }
}

function assertInsideUploadDir(uploadDir: string, targetPath: string) {
  if (!targetPath.startsWith(`${uploadDir}${path.sep}`)) {
    throw new Error("Portfolio image path must stay inside upload directory.");
  }
}

export function buildPortfolioBlobPathname(filename: string) {
  assertSafePortfolioFilename(filename);
  return `portfolio/${filename}`;
}

export function buildPortfolioObjectStorageKey(filename: string) {
  assertSafePortfolioFilename(filename);
  return `portfolio/${filename}`;
}

function appendObjectKeyToPublicBaseUrl(publicBaseUrl: string, objectKey: string) {
  const normalizedBaseUrl = publicBaseUrl.replace(/\/+$/, "");
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${normalizedBaseUrl}/${encodedKey}`;
}

function getRequiredBlobReadWriteToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!token) {
    throw new PortfolioStorageConfigurationError(
      "BLOB_READ_WRITE_TOKEN is required when PORTFOLIO_STORAGE_PROVIDER is vercel-blob."
    );
  }

  return token;
}

export function createLocalPortfolioImageStorage(
  options: LocalPortfolioImageStorageOptions = {}
): PortfolioImageStorage {
  return {
    async save({ filename, buffer }) {
      assertSafePortfolioFilename(filename);

      const uploadDir = path.resolve(process.cwd(), options.uploadDir ?? PORTFOLIO_UPLOAD_DIR);
      const targetPath = path.resolve(uploadDir, filename);

      assertInsideUploadDir(uploadDir, targetPath);

      await mkdir(uploadDir, { recursive: true });
      await writeFile(targetPath, buffer);

      const storedFile = await stat(targetPath);

      return {
        url: buildPortfolioImagePublicUrl(filename),
        filename,
        sizeBytes: storedFile.size
      };
    }
  };
}

// Local storage is intentionally simple for development and private preview.
// It is not durable on serverless platforms; replace this adapter with Blob/S3/R2 before real production use.
export const localPortfolioImageStorage = createLocalPortfolioImageStorage();

export const vercelBlobPortfolioImageStorage: PortfolioImageStorage = {
  async save({ filename, buffer }) {
    const pathname = buildPortfolioBlobPathname(filename);
    const token = getRequiredBlobReadWriteToken();

    try {
      const blob = await put(pathname, buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/webp",
        token
      });

      return {
        url: blob.url,
        filename,
        sizeBytes: buffer.byteLength
      };
    } catch {
      throw new PortfolioStorageUploadError("Failed to upload portfolio image to Vercel Blob.");
    }
  }
};

function readNaverObjectStorageConfig(env: NodeJS.ProcessEnv = process.env): NaverObjectStorageConfig {
  const config = {
    accessKey: env.NAVER_OBJECT_STORAGE_ACCESS_KEY?.trim() ?? "",
    secretKey: env.NAVER_OBJECT_STORAGE_SECRET_KEY?.trim() ?? "",
    bucket: env.NAVER_OBJECT_STORAGE_BUCKET?.trim() ?? "",
    endpoint: env.NAVER_OBJECT_STORAGE_ENDPOINT?.trim() ?? "",
    region: env.NAVER_OBJECT_STORAGE_REGION?.trim() ?? "",
    publicBaseUrl: env.NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL?.trim() ?? ""
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new PortfolioStorageConfigurationError(
      `Missing Naver Object Storage configuration: ${missing.join(", ")}.`
    );
  }

  return config;
}

function createNaverObjectStorageClient(config: NaverObjectStorageConfig) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey
    }
  });
}

export const naverObjectPortfolioImageStorage: PortfolioImageStorage = {
  async save({ filename, buffer }) {
    const config = readNaverObjectStorageConfig();
    const objectKey = buildPortfolioObjectStorageKey(filename);
    const client = createNaverObjectStorageClient(config);

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
          Body: buffer,
          ContentType: "image/webp"
        })
      );

      return {
        url: appendObjectKeyToPublicBaseUrl(config.publicBaseUrl, objectKey),
        filename,
        sizeBytes: buffer.byteLength
      };
    } catch {
      throw new PortfolioStorageUploadError("Failed to upload portfolio image to Naver Object Storage.");
    }
  }
};

export function getPortfolioImageStorage(): PortfolioImageStorage {
  const provider = (process.env.PORTFOLIO_STORAGE_PROVIDER || "local").trim().toLowerCase();

  if (!provider || provider === "local") {
    return localPortfolioImageStorage;
  }

  if (provider === "vercel-blob") {
    return vercelBlobPortfolioImageStorage;
  }

  if (provider === "naver-object-storage" || provider === "naver") {
    return naverObjectPortfolioImageStorage;
  }

  throw new UnsupportedPortfolioStorageProviderError(provider);
}
