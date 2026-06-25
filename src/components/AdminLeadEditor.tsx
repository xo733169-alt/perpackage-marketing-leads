"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUSES, LeadStatus, STATUS_LABELS } from "@/lib/lead-options";

export function AdminLeadEditor({
  leadId,
  initialStatus,
  initialMemo,
  initialSalesNote,
  initialNextFollowUpAt,
  initialLastContactedAt,
  initialQuotedAt,
  initialOrderConfirmedAt,
  initialClosedAt,
  initialConfirmedOrderAmountKrw,
  initialLostReason
}: {
  leadId: string;
  initialStatus: LeadStatus;
  initialMemo: string;
  initialSalesNote: string;
  initialNextFollowUpAt: string;
  initialLastContactedAt: string;
  initialQuotedAt: string;
  initialOrderConfirmedAt: string;
  initialClosedAt: string;
  initialConfirmedOrderAmountKrw: string;
  initialLostReason: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(initialStatus);
  const [adminMemo, setAdminMemo] = useState(initialMemo);
  const [salesNote, setSalesNote] = useState(initialSalesNote);
  const [nextFollowUpAt, setNextFollowUpAt] = useState(initialNextFollowUpAt);
  const [lastContactedAt, setLastContactedAt] = useState(initialLastContactedAt);
  const [quotedAt, setQuotedAt] = useState(initialQuotedAt);
  const [orderConfirmedAt, setOrderConfirmedAt] = useState(initialOrderConfirmedAt);
  const [closedAt, setClosedAt] = useState(initialClosedAt);
  const [confirmedOrderAmountKrw, setConfirmedOrderAmountKrw] = useState(initialConfirmedOrderAmountKrw);
  const [lostReason, setLostReason] = useState(initialLostReason);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveLead(markContactedToday = false) {
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminMemo,
          salesNote,
          nextFollowUpAt,
          lastContactedAt,
          quotedAt,
          orderConfirmedAt,
          closedAt,
          confirmedOrderAmountKrw,
          lostReason,
          markContactedToday
        })
      });
      const data = (await response.json()) as {
        message?: string;
        lead?: {
          status: LeadStatus;
          lastContactedAt: string | null;
          quotedAt: string | null;
          orderConfirmedAt: string | null;
          closedAt: string | null;
        };
      };

      if (!response.ok) {
        setMessage(data.message ?? "저장에 실패했습니다.");
        return;
      }

      if (data.lead?.status) {
        setStatus(data.lead.status);
      }

      if (data.lead?.lastContactedAt) {
        setLastContactedAt(data.lead.lastContactedAt.slice(0, 16));
      }

      if (data.lead?.quotedAt) {
        setQuotedAt(data.lead.quotedAt.slice(0, 16));
      }

      if (data.lead?.orderConfirmedAt) {
        setOrderConfirmedAt(data.lead.orderConfirmedAt.slice(0, 16));
      }

      if (data.lead?.closedAt) {
        setClosedAt(data.lead.closedAt.slice(0, 16));
      }

      setMessage(markContactedToday ? "오늘 연락 완료로 저장되었습니다." : "저장되었습니다.");
      router.refresh();
    } catch {
      setMessage("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveLead(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-paper p-5">
      <h2 className="text-lg font-bold text-ink">상담 관리</h2>
      <label className="mt-5 block">
        <span className="label-base">상담 상태</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as LeadStatus)}
          className="input-base mt-2"
        >
          {LEAD_STATUSES.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label-base">다음 후속 연락일</span>
          <input
            type="datetime-local"
            value={nextFollowUpAt}
            onChange={(event) => setNextFollowUpAt(event.target.value)}
            className="input-base mt-2"
          />
        </label>
        <label className="block">
          <span className="label-base">마지막 연락일</span>
          <input
            type="datetime-local"
            value={lastContactedAt}
            onChange={(event) => setLastContactedAt(event.target.value)}
            className="input-base mt-2"
          />
        </label>
      </div>

      <section className="mt-6 border-t border-line pt-5">
        <h3 className="text-base font-bold text-ink">전환 정보</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-base">견적 발송일</span>
            <input
              type="datetime-local"
              value={quotedAt}
              onChange={(event) => setQuotedAt(event.target.value)}
              className="input-base mt-2"
            />
          </label>
          <label className="block">
            <span className="label-base">주문 확정일</span>
            <input
              type="datetime-local"
              value={orderConfirmedAt}
              onChange={(event) => setOrderConfirmedAt(event.target.value)}
              className="input-base mt-2"
            />
          </label>
          <label className="block">
            <span className="label-base">종료일</span>
            <input
              type="datetime-local"
              value={closedAt}
              onChange={(event) => setClosedAt(event.target.value)}
              className="input-base mt-2"
            />
          </label>
          <label className="block">
            <span className="label-base">확정 주문 금액</span>
            <input
              type="number"
              min="0"
              step="1"
              value={confirmedOrderAmountKrw}
              onChange={(event) => setConfirmedOrderAmountKrw(event.target.value)}
              className="input-base mt-2"
              placeholder="예: 2500000"
            />
            <span className="mt-2 block text-xs leading-5 text-neutral-500">
              관리자 내부 기록용 금액입니다. 고객에게 자동 견적으로 표시되지 않습니다.
            </span>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="label-base">종료/실패 사유</span>
          <textarea
            value={lostReason}
            onChange={(event) => setLostReason(event.target.value)}
            rows={3}
            className="input-base mt-2"
            placeholder="예: 예산 불일치, 납기 일정 불가, 고객 재검토"
          />
        </label>
      </section>

      <label className="mt-5 block">
        <span className="label-base">영업 메모</span>
        <textarea
          value={salesNote}
          onChange={(event) => setSalesNote(event.target.value)}
          rows={5}
          className="input-base mt-2 min-h-32"
          placeholder="후속 연락 일정, 누락 사양, 견적 우선순위 등을 빠르게 기록하세요."
        />
      </label>

      <label className="mt-5 block">
        <span className="label-base">관리자 메모</span>
        <textarea
          value={adminMemo}
          onChange={(event) => setAdminMemo(event.target.value)}
          rows={7}
          className="input-base mt-2 min-h-40"
          placeholder="상담 내용, 견적 메모, 내부 확인 사항을 기록하세요."
        />
      </label>
      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "상태 및 메모 저장"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => saveLead(true)}
          className="focus-ring inline-flex items-center justify-center rounded-md border border-ink bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          오늘 연락 완료
        </button>
      </div>
    </form>
  );
}
