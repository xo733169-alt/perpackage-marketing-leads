import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  resolveLocalPrintFilePath,
  verifyLocalPrintFileToken
} from "@/lib/storage/local-print-file-storage";

export const runtime = "nodejs";

function isLocalPrintFileStorageEnabled() {
  return (process.env.PRINT_FILE_STORAGE_PROVIDER || "").trim().toLowerCase() === "local";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function readSignedParams(request: Request, method: "GET" | "PUT") {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const expires = Number(url.searchParams.get("expires") ?? "");
  const token = url.searchParams.get("token") ?? "";
  const filename = url.searchParams.get("filename") ?? undefined;

  if (!key || !token || !verifyLocalPrintFileToken({ method, key, expires, filename, token })) {
    return null;
  }

  return { key, filename };
}

function encodeContentDispositionFilename(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function PUT(request: Request) {
  if (!isLocalPrintFileStorageEnabled()) {
    return jsonError("로컬 파일 저장소가 활성화되어 있지 않습니다.", 404);
  }

  const signed = readSignedParams(request, "PUT");
  if (!signed) {
    return jsonError("업로드 주소가 만료되었거나 올바르지 않습니다.", 403);
  }

  try {
    const target = resolveLocalPrintFilePath(signed.key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await request.arrayBuffer()));

    return new NextResponse(null, { status: 204 });
  } catch {
    return jsonError("파일을 저장하는 중 문제가 발생했습니다.", 500);
  }
}

export async function GET(request: Request) {
  if (!isLocalPrintFileStorageEnabled()) {
    return jsonError("로컬 파일 저장소가 활성화되어 있지 않습니다.", 404);
  }

  const signed = readSignedParams(request, "GET");
  if (!signed) {
    return jsonError("다운로드 주소가 만료되었거나 올바르지 않습니다.", 403);
  }

  try {
    const target = resolveLocalPrintFilePath(signed.key);
    const file = await readFile(target);
    const filename = signed.filename || path.basename(target);

    return new NextResponse(new Blob([file]), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": encodeContentDispositionFilename(filename),
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return jsonError("저장된 파일을 찾을 수 없습니다.", 404);
  }
}
