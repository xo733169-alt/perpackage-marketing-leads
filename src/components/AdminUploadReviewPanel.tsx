"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PRINT_FILE_REVIEW_STATUSES,
  PRINT_FILE_REVIEW_STATUS_LABELS,
  type PrintFileReviewStatus
} from "@/lib/print-file-upload-schema";

type UploadFileOption = {
  id: string;
  originalFilename: string;
  version: number;
};

const REVIEW_ACTIONS: PrintFileReviewStatus[] = [
  "reviewing",
  "revision_requested",
  "file_confirmed",
  "ready_for_production",
  "on_hold"
];

export function AdminUploadReviewPanel({
  projectId,
  initialReviewStatus,
  initialAdminMemo,
  files
}: {
  projectId: string;
  initialReviewStatus: PrintFileReviewStatus;
  initialAdminMemo: string;
  files: UploadFileOption[];
}) {
  const router = useRouter();
  const [reviewStatus, setReviewStatus] = useState<PrintFileReviewStatus>(initialReviewStatus);
  const [adminMemo, setAdminMemo] = useState(initialAdminMemo);
  const [logStatus, setLogStatus] = useState<PrintFileReviewStatus>("revision_requested");
  const [logFileId, setLogFileId] = useState("");
  const [message, setMessage] = useState("");
  const [logMessage, setLogMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  async function saveStatus(nextStatus = reviewStatus) {
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/uploads/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: nextStatus,
          adminMemo
        })
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string; project?: { reviewStatus: PrintFileReviewStatus } };

      if (!response.ok) {
        setMessage(data.message ?? "상태 저장에 실패했습니다.");
        return;
      }

      setReviewStatus(data.project?.reviewStatus ?? nextStatus);
      setMessage("검수 상태가 저장되었습니다.");
      router.refresh();
    } catch {
      setMessage("상태 저장 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLogging(true);

    try {
      const response = await fetch(`/api/admin/uploads/${projectId}/review-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: logFileId || undefined,
          status: logStatus,
          message: logMessage
        })
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "검수 메모 저장에 실패했습니다.");
        return;
      }

      setLogMessage("");
      setMessage("검수 메모가 저장되었습니다.");
      router.refresh();
    } catch {
      setMessage("검수 메모 저장 중 문제가 발생했습니다.");
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-lg font-bold text-ink">파일 검수 관리</h2>
      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="label-base">검수 상태</span>
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value as PrintFileReviewStatus)}
            className="input-base mt-2"
          >
            {PRINT_FILE_REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PRINT_FILE_REVIEW_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          {REVIEW_ACTIONS.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isSaving}
              onClick={() => void saveStatus(status)}
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PRINT_FILE_REVIEW_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="label-base">관리자 메모</span>
          <textarea
            value={adminMemo}
            onChange={(event) => setAdminMemo(event.target.value)}
            rows={6}
            className="input-base mt-2 min-h-32"
          />
        </label>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void saveStatus()}
          className="focus-ring inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "상태 및 메모 저장"}
        </button>
      </div>

      <form onSubmit={submitLog} className="mt-6 border-t border-line pt-5">
        <h3 className="text-base font-bold text-ink">수정 요청 및 검수 메모</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-base">대상 파일</span>
            <select value={logFileId} onChange={(event) => setLogFileId(event.target.value)} className="input-base mt-2">
              <option value="">프로젝트 전체</option>
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  v{file.version} · {file.originalFilename}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">기록 상태</span>
            <select value={logStatus} onChange={(event) => setLogStatus(event.target.value as PrintFileReviewStatus)} className="input-base mt-2">
              {REVIEW_ACTIONS.map((status) => (
                <option key={status} value={status}>
                  {PRINT_FILE_REVIEW_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="label-base">메시지</span>
          <textarea
            value={logMessage}
            onChange={(event) => setLogMessage(event.target.value)}
            rows={5}
            required
            className="input-base mt-2 min-h-28"
          />
        </label>
        <button
          type="submit"
          disabled={isLogging}
          className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-ink bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLogging ? "저장 중..." : "검수 메모 저장"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-neutral-700">{message}</p> : null}
    </section>
  );
}
