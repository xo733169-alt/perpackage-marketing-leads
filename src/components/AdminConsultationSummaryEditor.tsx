"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatConsultationSummaryListForTextarea,
  splitConsultationTextareaLines,
  type LeadConsultationSummary
} from "@/lib/admin-leads";

type SummarySource = "manual" | "auto";

export function AdminConsultationSummaryEditor({
  leadId,
  source,
  displaySummary,
  autoSummary
}: {
  leadId: string;
  source: SummarySource;
  displaySummary: LeadConsultationSummary;
  autoSummary: LeadConsultationSummary;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(displaySummary.title);
  const [overview, setOverview] = useState(displaySummary.overview);
  const [priorityNotes, setPriorityNotes] = useState(formatConsultationSummaryListForTextarea(displaySummary.priorityNotes));
  const [missingItems, setMissingItems] = useState(formatConsultationSummaryListForTextarea(displaySummary.missingItems));
  const [riskNotes, setRiskNotes] = useState(formatConsultationSummaryListForTextarea(displaySummary.riskNotes));
  const [nextActions, setNextActions] = useState(formatConsultationSummaryListForTextarea(displaySummary.suggestedNextActions));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function fillWithAutoSummary() {
    setTitle(autoSummary.title);
    setOverview(autoSummary.overview);
    setPriorityNotes(formatConsultationSummaryListForTextarea(autoSummary.priorityNotes));
    setMissingItems(formatConsultationSummaryListForTextarea(autoSummary.missingItems));
    setRiskNotes(formatConsultationSummaryListForTextarea(autoSummary.riskNotes));
    setNextActions(formatConsultationSummaryListForTextarea(autoSummary.suggestedNextActions));
    setMessage("자동 정리 요약을 편집란에 채웠습니다. 저장해야 반영됩니다.");
  }

  async function saveSummary(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationSummaryTitle: title,
          consultationSummaryOverview: overview,
          consultationPriorityNotes: splitConsultationTextareaLines(priorityNotes),
          consultationMissingItems: splitConsultationTextareaLines(missingItems),
          consultationRiskNotes: splitConsultationTextareaLines(riskNotes),
          consultationNextActions: splitConsultationTextareaLines(nextActions)
        })
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "상담 정리 저장에 실패했습니다.");
        return;
      }

      setMessage("상담 정리가 저장되었습니다.");
      router.refresh();
    } catch {
      setMessage("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetSummary() {
    if (!window.confirm("수동 저장 요약을 초기화하고 자동 정리 요약으로 되돌릴까요?")) return;

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetConsultationSummary: true })
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "수동 요약 초기화에 실패했습니다.");
        return;
      }

      fillWithAutoSummary();
      setMessage("수동 요약을 초기화했습니다.");
      router.refresh();
    } catch {
      setMessage("초기화 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={saveSummary} className="mt-5 rounded-md border border-line bg-paper p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">상담 정리 수정</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            각 메모 영역은 줄 단위로 저장됩니다. 고객에게 노출되지 않는 관리자 내부 기록입니다.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-neutral-600">
          현재 기준: {source === "manual" ? "수동 저장 요약" : "자동 정리 요약"}
        </span>
      </div>

      <label className="mt-4 block">
        <span className="label-base">요약 제목</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="input-base mt-2"
          placeholder="예: 급건 일정 우선 확인 필요"
        />
      </label>

      <label className="mt-4 block">
        <span className="label-base">요약 문장</span>
        <textarea
          value={overview}
          onChange={(event) => setOverview(event.target.value)}
          rows={4}
          className="input-base mt-2"
          placeholder="문의 상황을 상담자가 빠르게 이해할 수 있도록 정리하세요."
        />
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="label-base">우선 확인 메모</span>
          <textarea
            value={priorityNotes}
            onChange={(event) => setPriorityNotes(event.target.value)}
            rows={5}
            className="input-base mt-2"
            placeholder="한 줄에 하나씩 입력"
          />
        </label>
        <label className="block">
          <span className="label-base">부족한 정보</span>
          <textarea
            value={missingItems}
            onChange={(event) => setMissingItems(event.target.value)}
            rows={5}
            className="input-base mt-2"
            placeholder="한 줄에 하나씩 입력"
          />
        </label>
        <label className="block">
          <span className="label-base">제작 주의사항</span>
          <textarea
            value={riskNotes}
            onChange={(event) => setRiskNotes(event.target.value)}
            rows={5}
            className="input-base mt-2"
            placeholder="한 줄에 하나씩 입력"
          />
        </label>
        <label className="block">
          <span className="label-base">다음 상담 액션</span>
          <textarea
            value={nextActions}
            onChange={(event) => setNextActions(event.target.value)}
            rows={5}
            className="input-base mt-2"
            placeholder="한 줄에 하나씩 입력"
          />
        </label>
      </div>

      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "상담 정리 저장"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={fillWithAutoSummary}
          className="focus-ring inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          자동 요약으로 채우기
        </button>
        {source === "manual" ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={resetSummary}
            className="focus-ring inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            수동 요약 초기화
          </button>
        ) : null}
      </div>
    </form>
  );
}
