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

type LeadCommunicationEditorProps = {
  communicationId: string;
  initialChannel: string;
  initialDirection: string;
  initialSummary: string;
  initialDetail: string;
  initialContactedAt: string;
  initialNextFollowUpAt: string;
};

export function LeadCommunicationEditor(props: LeadCommunicationEditorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [channel, setChannel] = useState<LeadCommunicationChannel>(props.initialChannel as LeadCommunicationChannel);
  const [direction, setDirection] = useState<LeadCommunicationDirection>(props.initialDirection as LeadCommunicationDirection);
  const [summary, setSummary] = useState(props.initialSummary);
  const [detail, setDetail] = useState(props.initialDetail);
  const [contactedAt, setContactedAt] = useState(props.initialContactedAt);
  const [nextFollowUpAt, setNextFollowUpAt] = useState(props.initialNextFollowUpAt);
  const [fieldErrors, setFieldErrors] = useState<LeadCommunicationFieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setFieldErrors({});

    try {
      const response = await fetch(`/api/admin/lead-communications/${props.communicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          direction,
          summary,
          detail,
          contactedAt,
          nextFollowUpAt
        })
      });
      const data = (await response.json()) as { message?: string; fieldErrors?: LeadCommunicationFieldErrors };

      if (!response.ok) {
        setMessage(data.message ?? "상담 이력 수정에 실패했습니다.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setMessage("상담 이력 수정 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="focus-ring rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink hover:border-ink"
      >
        수정
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-md border border-line bg-ivory p-3">
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
        </label>
        <label className="block">
          <span className="label-base">상담 일시</span>
          <input type="datetime-local" value={contactedAt} onChange={(event) => setContactedAt(event.target.value)} className="input-base mt-2" />
        </label>
        <label className="block">
          <span className="label-base">다음 연락 예정일</span>
          <input type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} className="input-base mt-2" />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="label-base">요약</span>
        <input value={summary} onChange={(event) => setSummary(event.target.value)} className="input-base mt-2" />
        {fieldErrors.summary ? <p className="mt-1 text-xs text-red-700">{fieldErrors.summary}</p> : null}
      </label>
      <label className="mt-3 block">
        <span className="label-base">상세 내용</span>
        <textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={4} className="input-base mt-2" />
      </label>
      {message ? <p className="mt-3 text-xs text-red-700">{message}</p> : null}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={isSaving} className="focus-ring rounded-md bg-ink px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
          {isSaving ? "저장 중..." : "저장"}
        </button>
        <button type="button" onClick={() => setIsOpen(false)} className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-ink">
          취소
        </button>
      </div>
    </form>
  );
}
