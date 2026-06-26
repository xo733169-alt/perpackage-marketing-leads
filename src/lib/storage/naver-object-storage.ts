import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createLocalPrintFileStorageAdapter } from "@/lib/storage/local-print-file-storage";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StorageOperationError,
  type CreateDownloadUrlInput,
  type CreateUploadUrlInput,
  type CreateUploadUrlResult,
  type StorageAdapter,
  type StoredObjectMetadata
} from "@/lib/storage/storage-adapter";

type NaverObjectStorageConfig = {
  accessKey: string;
  secretKey: string;
  bucket: string;
  endpoint: string;
  region: string;
};

function readRequiredConfig(env: NodeJS.ProcessEnv = process.env): NaverObjectStorageConfig {
  const config = {
    accessKey: env.NAVER_OBJECT_STORAGE_ACCESS_KEY?.trim() ?? "",
    secretKey: env.NAVER_OBJECT_STORAGE_SECRET_KEY?.trim() ?? "",
    bucket: env.NAVER_OBJECT_STORAGE_BUCKET?.trim() ?? "",
    endpoint: env.NAVER_OBJECT_STORAGE_ENDPOINT?.trim() ?? "",
    region: env.NAVER_OBJECT_STORAGE_REGION?.trim() ?? ""
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new StorageConfigurationError(`Missing Naver Object Storage configuration: ${missing.join(", ")}.`);
  }

  return config;
}

function createClient(config: NaverObjectStorageConfig) {
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

function encodeContentDispositionFilename(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function createNaverObjectStorageAdapter(env: NodeJS.ProcessEnv = process.env): StorageAdapter {
  const config = readRequiredConfig(env);
  const client = createClient(config);

  return {
    bucket: config.bucket,
    async createUploadUrl({ key, contentType, expiresInSeconds }: CreateUploadUrlInput): Promise<CreateUploadUrlResult> {
      try {
        const command = new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType || "application/octet-stream"
        });

        return {
          uploadUrl: await getSignedUrl(client, command, { expiresIn: expiresInSeconds }),
          method: "PUT",
          headers: {
            "Content-Type": contentType || "application/octet-stream"
          }
        };
      } catch {
        throw new StorageOperationError("인쇄파일 업로드 주소를 생성할 수 없습니다.");
      }
    },
    async createDownloadUrl({ key, filename, expiresInSeconds }: CreateDownloadUrlInput): Promise<string> {
      try {
        const command = new GetObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ResponseContentDisposition: encodeContentDispositionFilename(filename)
        });

        return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
      } catch {
        throw new StorageOperationError("인쇄파일 다운로드 주소를 생성할 수 없습니다.");
      }
    },
    async headObject(key: string): Promise<StoredObjectMetadata> {
      try {
        const result = await client.send(
          new HeadObjectCommand({
            Bucket: config.bucket,
            Key: key
          })
        );
        const contentLength = Number(result.ContentLength ?? 0);

        if (!Number.isFinite(contentLength) || contentLength <= 0) {
          throw new StorageObjectNotFoundError("업로드된 파일을 확인할 수 없습니다.");
        }

        return {
          contentLength,
          contentType: result.ContentType
        };
      } catch (error) {
        if (error instanceof StorageObjectNotFoundError) throw error;
        const statusCode = typeof error === "object" && error !== null && "$metadata" in error
          ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
          : undefined;

        if (statusCode === 404) {
          throw new StorageObjectNotFoundError("업로드된 파일을 찾을 수 없습니다.");
        }

        throw new StorageOperationError("업로드된 파일을 확인할 수 없습니다.");
      }
    }
  };
}

export function getPrintFileStorageAdapter(): StorageAdapter {
  const provider = (process.env.PRINT_FILE_STORAGE_PROVIDER || "naver-object-storage").trim().toLowerCase();

  if (provider === "local") {
    return createLocalPrintFileStorageAdapter();
  }

  return createNaverObjectStorageAdapter();
}
