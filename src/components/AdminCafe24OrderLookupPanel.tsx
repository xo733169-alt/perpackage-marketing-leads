"use client";

import { useMemo, useState } from "react";

type LookupResponseShape = {
  topLevelKeys: string[];
  hasOrderObject: boolean;
  hasOrdersArray: boolean;
  hasItems: boolean;
  hasOrderItems: boolean;
  hasProducts: boolean;
  firstItemKeys: string[];
  paymentKeys: string[];
  shippingKeys: string[];
  memoKeys: string[];
  adminMemoKeys: string[];
  customerMemoKeys: string[];
};

type LookupProject = {
  id: string;
  uploadCode: string | null;
  companyName: string | null;
  customerName: string | null;
  matchType?: string | null;
};

type LookupOrder = {
  orderId?: string | null;
  orderNo?: string | null;
  buyerName?: string | null;
  productName?: string | null;
  paymentStatusSource?: string | null;
  paymentStatus?: string | null;
  orderedAt?: string | null;
  shippingStatusSource?: string | null;
  shippingStatus?: string | null;
  totalPaidAmount?: string | null;
  uploadCode?: string | null;
  hasUploadCode?: boolean;
  responseShape?: LookupResponseShape;
  matchedProject?: LookupProject | null;
};

type LookupResult = {
  status: string;
  message: string;
  projectId?: string;
};

type LookupResponse = {
  ok: boolean;
  tokenLookupMallId?: string | null;
  orderId?: string | null;
  order?: LookupOrder;
  linkedProject?: LookupProject | null;
  result?: LookupResult;
  message?: string;
};

function display(value: string | number | boolean | null | undefined) {
  if (typeof value === "boolean") return value ? "예" : "아니오";
  const text = String(value ?? "").trim();
  return text || "-";
}

function joinList(values: string[] | null | undefined) {
  return values?.length ? values.join(", ") : "-";
}

function ResultRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  return (
    <div className="rounded-md border border-line bg-ivory px-3 py-2">
      <dt className="text-xs font-bold text-neutral-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-ink">{display(value)}</dd>
    </div>
  );
}

export function AdminCafe24OrderLookupPanel({ mallId }: { mallId: string | null }) {
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedOrderId = orderId.trim();
  const project = response?.linkedProject ?? response?.order?.matchedProject ?? null;
  const projectLabel = useMemo(() => {
    if (!project) return "-";
    return project.uploadCode ?? project.companyName ?? project.customerName ?? project.id;
  }, [project]);
  const responseShape = response?.order?.responseShape;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedOrderId) {
      setError("Cafe24 주문번호를 입력해 주세요.");
      setResponse(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await fetch(`/api/admin/cafe24/orders/${encodeURIComponent(trimmedOrderId)}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mallId })
      });
      const data = await result.json().catch(() => ({})) as LookupResponse;

      setResponse(data);
      if (!result.ok || data.ok === false) {
        setError(data.message ?? "조회 실패");
      }
    } catch {
      setError("조회 실패");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setOrderId("");
    setResponse(null);
    setError(null);
  }

  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink">Cafe24 주문번호 직접 조회</h2>
        <p className="max-w-3xl text-sm leading-6 text-neutral-600">
          실시간 Webhook 수신 전에도 Cafe24 주문번호로 주문 상세 정보를 직접 조회하고 업로드 접수번호 연결을 확인할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <label className="flex flex-col gap-2 text-sm font-bold text-neutral-700">
          Cafe24 주문번호 입력
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="예: 20260627-0000032"
            className="min-h-11 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-ink"
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "조회 중" : "주문 조회"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ivory"
        >
          초기화
        </button>
      </form>

      <div className="mt-3 text-xs leading-5 text-neutral-500">
        테스트 후보 주문번호: 20260627-0000032, 20260627-0000015, 20260627-0000021
      </div>

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-black">조회 실패</div>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <ResultRow label="실패 사유" value={error} />
            <ResultRow label="tokenLookupMallId" value={response?.tokenLookupMallId ?? mallId} />
            <ResultRow label="orderId" value={response?.orderId ?? trimmedOrderId} />
          </dl>
        </div>
      ) : null}

      {response?.ok && response.order ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-black text-emerald-800">조회 성공</div>
          <dl className="mt-3 grid gap-2 md:grid-cols-3">
            <ResultRow label="order_id" value={response.order.orderId} />
            <ResultRow label="order_no" value={response.order.orderNo} />
            <ResultRow label="주문자명" value={response.order.buyerName} />
            <ResultRow label="상품명" value={response.order.productName} />
            <ResultRow label="결제상태" value={response.order.paymentStatus} />
            <ResultRow label="결제상태 원본 후보" value={response.order.paymentStatusSource} />
            <ResultRow label="주문일" value={response.order.orderedAt} />
            <ResultRow label="배송상태" value={response.order.shippingStatus} />
            <ResultRow label="배송상태 원본 코드" value={response.order.shippingStatusSource} />
            <ResultRow label="총 결제금액" value={response.order.totalPaidAmount} />
            <ResultRow label="업로드 접수번호 추출 여부" value={response.order.hasUploadCode ?? false} />
            <ResultRow label="업로드 접수번호" value={response.order.uploadCode} />
            <ResultRow label="연결 프로젝트 여부" value={Boolean(project)} />
            <ResultRow label="연결 프로젝트" value={projectLabel} />
            <ResultRow label="연결 기준" value={project?.matchType} />
            <ResultRow label="tokenLookupMallId" value={response.tokenLookupMallId} />
            <ResultRow label="연결 처리 결과" value={response.result?.status} />
            <ResultRow label="연결 메시지" value={response.result?.message} />
          </dl>

          {responseShape ? (
            <div className="mt-4 rounded-md border border-emerald-100 bg-white p-3">
              <div className="text-xs font-black uppercase tracking-wide text-neutral-500">응답 구조 요약</div>
              <dl className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultRow label="topLevelKeys" value={joinList(responseShape.topLevelKeys)} />
                <ResultRow label="order 객체" value={responseShape.hasOrderObject} />
                <ResultRow label="orders 배열" value={responseShape.hasOrdersArray} />
                <ResultRow label="items 배열" value={responseShape.hasItems} />
                <ResultRow label="첫 번째 item key" value={joinList(responseShape.firstItemKeys)} />
                <ResultRow label="order_items 배열" value={responseShape.hasOrderItems} />
                <ResultRow label="products 배열" value={responseShape.hasProducts} />
                <ResultRow label="payment 관련 key" value={joinList(responseShape.paymentKeys)} />
                <ResultRow label="shipping 관련 key" value={joinList(responseShape.shippingKeys)} />
                <ResultRow label="memo 관련 key" value={joinList(responseShape.memoKeys)} />
                <ResultRow label="admin memo key" value={joinList(responseShape.adminMemoKeys)} />
                <ResultRow label="customer memo key" value={joinList(responseShape.customerMemoKeys)} />
              </dl>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
