"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type QuoteShareLinkSummary = {
  id: string;
  statusLabel: string;
  expiresAt: string;
  createdAt: string;
  firstViewedAt: string;
  lastViewedAt: string;
  viewCount: number;
  tokenPreview: string;
};

type CreateShareLinkResponse = {
  message?: string;
  shareUrl?: string;
};

export function QuoteShareLinkManager({
  proposalId,
  activeShareLink
}: {
  proposalId: string;
  activeShareLink: QuoteShareLinkSummary | null;
}) {
  const router = useRouter();
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [generatedShareUrl, setGeneratedShareUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  async function createShareLink(regenerate: boolean) {
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/quote-proposals/${proposalId}/share-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresInDays: Number(expiresInDays),
          regenerate
        })
      });
      const data = (await response.json()) as CreateShareLinkResponse;

      if (!response.ok || !data.shareUrl) {
        setMessage(data.message ?? "공유 링크 생성에 실패했습니다.");
        return;
      }

      setGeneratedShareUrl(data.shareUrl);
      setMessage("공유 링크가 생성되었습니다. 이 링크는 지금만 확인할 수 있습니다.");
      router.refresh();
    } catch {
      setMessage("공유 링크 생성 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeShareLink() {
    if (!activeShareLink) return;
    if (!window.confirm("공유 링크를 폐기하면 해당 링크로 견적안을 볼 수 없습니다. 폐기하시겠습니까?")) return;

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/quote-share-links/${activeShareLink.id}`, {
        method: "DELETE"
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "공유 링크 폐기에 실패했습니다.");
        return;
      }

      setGeneratedShareUrl("");
      setMessage("공유 링크가 폐기되었습니다.");
      router.refresh();
    } catch {
      setMessage("공유 링크 폐기 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyGeneratedShareUrl() {
    if (!generatedShareUrl) return;
    await navigator.clipboard.writeText(generatedShareUrl);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-lg font-bold text-ink">공유 링크</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        공유 링크는 고객에게 직접 전달하는 제한 링크입니다. 링크를 아는 사람은 견적안을 볼 수 있으므로 외부에 공개하지 마세요.
      </p>

      <div className="mt-4 rounded-md border border-line bg-ivory p-4 text-sm">
        {activeShareLink ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-bold text-neutral-500">상태</dt>
              <dd>{activeShareLink.statusLabel}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-500">토큰 미리보기</dt>
              <dd>...{activeShareLink.tokenPreview}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-500">만료일</dt>
              <dd>{activeShareLink.expiresAt}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-500">생성일</dt>
              <dd>{activeShareLink.createdAt}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-500">조회 수</dt>
              <dd>{activeShareLink.viewCount.toLocaleString("ko-KR")}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-500">최초 확인</dt>
              <dd>{activeShareLink.firstViewedAt}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-500">마지막 확인</dt>
              <dd>{activeShareLink.lastViewedAt}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-neutral-600">현재 활성 공유 링크가 없습니다.</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm font-bold text-ink">
          링크 만료 기간
          <select
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="7">7일</option>
            <option value="14">14일</option>
            <option value="30">30일</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => createShareLink(false)}
            className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            공유 링크 생성
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => createShareLink(true)}
            className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            새 링크 재생성
          </button>
          {activeShareLink ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={revokeShareLink}
              className="focus-ring rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              공유 링크 폐기
            </button>
          ) : null}
        </div>
      </div>

      {generatedShareUrl ? (
        <div className="mt-4 rounded-md border border-line bg-white p-3">
          <p className="text-xs font-bold text-neutral-500">생성된 공유 URL</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={generatedShareUrl}
              className="focus-ring w-full rounded-md border border-line bg-ivory px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={copyGeneratedShareUrl}
              className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink"
            >
              {isCopied ? "복사됨" : "공유 링크 복사"}
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            보안상 원문 링크는 저장하지 않습니다. 화면을 새로고침한 뒤 다시 필요하면 새 링크를 재생성하세요.
          </p>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
    </section>
  );
}
