"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/admin-uploads";
import { formatFileSize } from "@/lib/print-file-upload-schema";

type UploadSuccessFile = {
  name: string;
  size: number;
  extension: string;
  uploadedAt: string | null;
};

type UploadSuccessPayload = {
  uploadCode?: string;
  orderNumber?: string;
  receivedAt: string;
  files: UploadSuccessFile[];
};

function parseUploadResult(value: string | null): UploadSuccessPayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<UploadSuccessPayload>;
    if (!Array.isArray(parsed.files)) return null;

    return {
      uploadCode: parsed.uploadCode ? String(parsed.uploadCode) : undefined,
      orderNumber: parsed.orderNumber ? String(parsed.orderNumber) : undefined,
      receivedAt: parsed.receivedAt ? String(parsed.receivedAt) : new Date().toISOString(),
      files: parsed.files.map((file) => ({
        name: String(file.name ?? ""),
        size: Number(file.size ?? 0),
        extension: String(file.extension ?? ""),
        uploadedAt: file.uploadedAt ? String(file.uploadedAt) : null
      })).filter((file) => file.name)
    };
  } catch {
    return null;
  }
}

export function PrintFileUploadSuccessDetails({ orderNumber }: { orderNumber: string }) {
  const [uploadResult, setUploadResult] = useState<UploadSuccessPayload | null>(null);

  useEffect(() => {
    setUploadResult(parseUploadResult(window.sessionStorage.getItem("perpackage-print-upload-result")));
  }, []);

  const files = uploadResult?.files ?? [];
  const receivedAt = uploadResult?.receivedAt ?? null;
  const displayUploadCode = uploadResult?.uploadCode || "";
  const displayOrderNumber = orderNumber || uploadResult?.orderNumber || "";

  return (
    <div className="mt-5 space-y-4">
      {displayUploadCode ? (
        <p className="rounded-md border border-line bg-paper px-4 py-3 text-sm font-semibold text-ink">
          업로드 접수번호: {displayUploadCode}
        </p>
      ) : null}

      {displayOrderNumber ? (
        <p className="rounded-md border border-line bg-paper px-4 py-3 text-sm font-semibold text-ink">
          주문번호: {displayOrderNumber}
        </p>
      ) : null}

      {receivedAt ? (
        <p className="rounded-md border border-line bg-paper px-4 py-3 text-sm text-charcoal">
          접수 시간: <span className="font-semibold text-ink">{formatDateTime(receivedAt)}</span>
        </p>
      ) : null}

      {files.length ? (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="border-b border-line bg-ivory px-4 py-3 text-sm font-bold text-ink">
            업로드한 파일 {files.length}개
          </div>
          <ul className="divide-y divide-line">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="px-4 py-3 text-sm">
                <p className="break-words font-semibold text-ink">{file.name}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {file.extension ? `${file.extension.toUpperCase()} · ` : ""}
                  {formatFileSize(file.size)}
                  {file.uploadedAt ? ` · ${formatDateTime(file.uploadedAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
