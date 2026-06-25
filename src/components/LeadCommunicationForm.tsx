"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LEAD_COMMUNICATION_CHANNEL_LABELS,
  LEAD_COMMUNICATION_CHANNELS,
  LEAD_COMMUNICATION_DIRECTION_LABELS,
  LEAD_COMMUNICATION_DIRECTIONS,
  type LeadCommunicationChannel,
  type LeadCommunicationDirection,
  type LeadCommunicationFieldErrors
} from "@/lib/lead-communication-schema";

function getDateTimeLocalNow() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

export function LeadCommunicationForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [channel, setChannel] = useState<LeadCommunicationChannel>("PHONE");
  const [direction, setDirection] = useState<LeadCommunicationDirection>("OUTBOUND");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [contactedAt, setContactedAt] = useState(getDateTimeLocalNow());
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LeadCommunicationFieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/leads/${leadId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          direction,
          summary,
          detail: detail || undefined,
          contactedAt,
          nextFollowUpAt: nextFollowUpAt || undefined
        })
      });
      const data = (await response.json()) as {
        message?: string;
        fieldErrors?: LeadCommunicationFieldErrors;
      };

      if (!response.ok) {
        setMessage(data.message ?? "상담 이력 저장에 실패했습니다.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      setSummary("");
      setDetail("");
      setNextFollowUpAt("");
      setMessage("상담 이력이 저장되었습니다.");
      router.refresh();
    } catch {
      setMessage("상담 이력 저장 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line bg-ivory p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="label-base">상담 채널</span>
          <select value={channel} onChange={(event) => setChannel(event.target.value as LeadCommunicationChannel)} className="input-base mt-2">
            {LEAD_COMMUNICATION_CHANNELS.map((option) => (
              <option key={option} value={option}>
                {LEAD_COMMUNICATION_CHANNEL_LABELS[option]}
              </option>
            ))}
          </select>
          {fieldErrors.channel ? <p className="mt-1 text-xs text-red-700">{fieldErrors.channel}</p> : null}
        </label>
        <label className="block">
          <span className="label-base">방향</span>
          <select value={direction} onChange={(event) => setDirection(event.target.value as LeadCommunicationDirection)} className="input-base mt-2">
            {LEAD_COMMUNICATION_DIRECTIONS.map((option) => (
              <option key={option} value={option}>
                {LEAD_COMMUNICATION_DIRECTION_LABELS[option]}
              </option>
            ))}
          </select>
          {fieldErrors.direction ? <p className="mt-1 text-xs text-red-700">{fieldErrors.direction}</p> : null}
        </label>
        <label className="block">
          <span className="label-base">상담 일시</span>
          <input type="datetime-local" value={contactedAt} onChange={(event) => setContactedAt(event.target.value)} className="input-base mt-2" />
          {fieldErrors.contactedAt ? <p className="mt-1 text-xs text-red-700">{fieldErrors.contactedAt}</p> : null}
        </label>
        <label className="block">
          <span className="label-base">다음 연락 예정일</span>
          <input type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} className="input-base mt-2" />
          {fieldErrors.nextFollowUpAt ? <p className="mt-1 text-xs text-red-700">{fieldErrors.nextFollowUpAt}</p> : null}
        </label>
      </div>
      <label className="mt-3 block">
        <span className="label-base">요약</span>
        <input value={summary} onChange={(event) => setSummary(event.target.value)} className="input-base mt-2" placeholder="예: 수량 변경 가능 여부 상담" />
        {fieldErrors.summary ? <p className="mt-1 text-xs text-red-700">{fieldErrors.summary}</p> : null}
      </label>
      <label className="mt-3 block">
        <span className="label-base">상세 내용</span>
        <textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={4} className="input-base mt-2" />
        {fieldErrors.detail ? <p className="mt-1 text-xs text-red-700">{fieldErrors.detail}</p> : null}
      </label>
      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
      <button
        type="submit"
        disabled={isSaving}
        className="focus-ring mt-4 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "상담 이력 저장 중..." : "상담 이력 추가"}
      </button>
    </form>
  );
}
