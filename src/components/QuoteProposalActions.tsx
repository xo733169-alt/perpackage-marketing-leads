"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  QUOTE_PROPOSAL_STATUS_LABELS,
  type QuoteProposalStatus
} from "@/lib/quote-proposal-schema";

const actions: { status: QuoteProposalStatus; label: string }[] = [
  { status: "SENT", label: "발송완료 처리" },
  { status: "ACCEPTED", label: "수락 처리" },
  { status: "REJECTED", label: "거절 처리" },
  { status: "EXPIRED", label: "만료 처리" },
  { status: "CANCELLED", label: "취소 처리" }
];

export function QuoteProposalActions({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus(status: QuoteProposalStatus) {
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/quote-proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "상태 변경에 실패했습니다.");
        return;
      }

      setMessage(`${QUOTE_PROPOSAL_STATUS_LABELS[status]} 상태로 변경했습니다.`);
      router.refresh();
    } catch {
      setMessage("상태 변경 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-lg font-bold text-ink">상태 변경</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={isSaving}
            onClick={() => updateStatus(action.status)}
            className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {action.label}
          </button>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
    </div>
  );
}
