import crypto from "node:crypto";
import path from "node:path";
import { stat } from "node:fs/promises";
import type {
  CreateDownloadUrlInput,
  CreateUploadUrlInput,
  CreateUploadUrlResult,
  StorageAdapter,
  StoredObjectMetadata
} from "@/lib/storage/storage-adapter";
import { StorageObjectNotFoundError } from "@/lib/storage/storage-adapter";

const DEFAULT_LOCAL_UPLOAD_DIR = ".local-print-file-storage";

function getLocalStorageSecret() {
  return (
    process.env.UPLOAD_LOCAL_STORAGE_SECRET?.trim() ||
    process.env.SITE_ACCESS_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "perpackage-local-print-file-storage"
  );
}

export function getLocalPrintFileStorageDir() {
  return path.resolve(process.cwd(), process.env.UPLOAD_LOCAL_STORAGE_DIR?.trim() || DEFAULT_LOCAL_UPLOAD_DIR);
}

export function assertSafePrintFileStorageKey(key: string) {
  if (!key || key.includes("\\") || key.includes("..") || key.startsWith("/") || !key.startsWith("print-files/")) {
    throw new Error("Invalid print-file storage key.");
  }
}

export function resolveLocalPrintFilePath(key: string) {
  assertSafePrintFileStorageKey(key);
  const root = getLocalPrintFileStorageDir();
  const target = path.resolve(root, key);

  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Print-file storage path must stay inside local storage directory.");
  }

  return target;
}

function signLocalUrl({ method, key, expires, filename }: { method: string; key: string; expires: number; filename?: string }) {
  const payload = [method.toUpperCase(), key, String(expires), filename ?? ""].join("\n");
  return crypto.createHmac("sha256", getLocalStorageSecret()).update(payload).digest("hex");
}

export function createLocalPrintFileToken(input: { method: string; key: string; expires: number; filename?: string }) {
  return signLocalUrl(input);
}

export function verifyLocalPrintFileToken(input: {
  method: string;
  key: string;
  expires: number;
  filename?: string;
  token: string;
}) {
  if (!Number.isFinite(input.expires) || input.expires < Math.floor(Date.now() / 1000)) return false;
  const expected = signLocalUrl(input);
  const left = Buffer.from(input.token);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function buildLocalObjectUrl({ method, key, expiresInSeconds, filename }: {
  method: "PUT" | "GET";
  key: string;
  expiresInSeconds: number;
  filename?: string;
}) {
  assertSafePrintFileStorageKey(key);
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const token = createLocalPrintFileToken({ method, key, expires, filename });
  const params = new URLSearchParams({
    key,
    expires: String(expires),
    token
  });

  if (filename) params.set("filename", filename);

  return `/api/uploads/local-object?${params.toString()}`;
}

export function createLocalPrintFileStorageAdapter(): StorageAdapter {
  return {
    bucket: "local-private-print-files",
    async createUploadUrl({ key, contentType, expiresInSeconds }: CreateUploadUrlInput): Promise<CreateUploadUrlResult> {
      return {
        uploadUrl: buildLocalObjectUrl({ method: "PUT", key, expiresInSeconds }),
        method: "PUT",
        headers: {
          "Content-Type": contentType || "application/octet-stream"
        }
      };
    },
    async createDownloadUrl({ key, filename, expiresInSeconds }: CreateDownloadUrlInput): Promise<string> {
      return buildLocalObjectUrl({ method: "GET", key, filename, expiresInSeconds });
    },
    async headObject(key: string): Promise<StoredObjectMetadata> {
      const target = resolveLocalPrintFilePath(key);

      try {
        const fileStat = await stat(target);
        if (!fileStat.isFile() || fileStat.size <= 0) {
          throw new StorageObjectNotFoundError("업로드된 파일을 확인할 수 없습니다.");
        }

        return {
          contentLength: fileStat.size
        };
      } catch (error) {
        if (error instanceof StorageObjectNotFoundError) throw error;
        throw new StorageObjectNotFoundError("업로드된 파일을 찾을 수 없습니다.");
      }
    }
  };
}
