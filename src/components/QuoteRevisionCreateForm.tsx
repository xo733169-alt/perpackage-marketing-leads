"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuoteRevisionCreateForm({
  proposalId,
  initialReason = ""
}: {
  proposalId: string;
  initialReason?: string;
}) {
  const router = useRouter();
  const [revisionReason, setRevisionReason] = useState(initialReason);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/quote-proposals/${proposalId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionReason })
      });
      const data = (await response.json()) as { message?: string; quoteProposal?: { id: string } };

      if (!response.ok || !data.quoteProposal?.id) {
        setMessage(data.message ?? "수정 견적안 생성에 실패했습니다.");
        return;
      }

      router.push(`/admin/quote-proposals/${data.quoteProposal.id}/edit`);
      router.refresh();
    } catch {
      setMessage("수정 견적안 생성 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-5">
      <label className="block">
        <span className="label-base">수정 사유</span>
        <textarea
          value={revisionReason}
          onChange={(event) => setRevisionReason(event.target.value)}
          rows={5}
          maxLength={500}
          placeholder="예: 고객 요청으로 수량 변경 / 후가공 옵션 변경 / 납기 조건 조정"
          className="input-base mt-2"
        />
      </label>
      <p className="mt-2 text-xs leading-5 text-neutral-500">
        기존 견적안은 덮어쓰지 않고 새 수정안으로 복제됩니다. 고객에게 공유하려면 수정안을 검토한 뒤 새 공유 링크를 생성해 주세요.
      </p>
      {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "수정안 생성 중..." : "수정안 작성 시작"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="focus-ring inline-flex justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-ink"
        >
          취소
        </button>
      </div>
    </form>
  );
}
