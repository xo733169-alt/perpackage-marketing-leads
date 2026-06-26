import path from "node:path";
import { nanoid } from "nanoid";
import { getFileExtension } from "@/lib/print-file-upload-schema";

function normalizeFilenameStem(filename: string): string {
  const extension = path.extname(filename);
  const stem = path.basename(filename, extension);
  return (
    stem
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "print-file"
  );
}

export function createSafeStoredFilename(originalFilename: string): string {
  const extension = getFileExtension(originalFilename);
  if (!extension) {
    throw new Error("File extension is required.");
  }

  return `${normalizeFilenameStem(originalFilename)}-${nanoid(10)}.${extension}`;
}

export function buildPrintFileStorageKey({
  projectId,
  version,
  storedFilename
}: {
  projectId: string;
  version: number;
  storedFilename: string;
}): string {
  if (!projectId || projectId.includes("/") || projectId.includes("..")) {
    throw new Error("Invalid upload project id.");
  }

  if (!Number.isInteger(version) || version <= 0) {
    throw new Error("Invalid upload file version.");
  }

  if (!storedFilename || storedFilename !== path.basename(storedFilename) || storedFilename.includes("..")) {
    throw new Error("Invalid stored filename.");
  }

  return `print-files/${projectId}/${version}/${storedFilename}`;
}
