"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QUOTE_PROPOSAL_STATUSES,
  QUOTE_PROPOSAL_STATUS_LABELS,
  type QuoteProposalFieldErrors,
  type QuoteProposalStatus
} from "@/lib/quote-proposal-schema";

export type QuoteProposalFormItem = {
  id?: string;
  sortOrder: number;
  itemName: string;
  description: string;
  quantity: string;
  unitPriceKrw: string;
};

export type QuoteProposalFormValue = {
  leadId: string;
  status: QuoteProposalStatus;
  title: string;
  customerNameSnapshot: string;
  companyNameSnapshot: string;
  phoneSnapshot: string;
  emailSnapshot: string;
  kakaoIdSnapshot: string;
  boxType: string;
  industry: string;
  quantityLabel: string;
  quantityCount: string;
  specificationSummary: string;
  productionNotes: string;
  deliveryEstimateText: string;
  paymentTerms: string;
  validUntil: string;
  vatIncluded: boolean;
  customerMessage: string;
  internalMemo: string;
  basedOnEstimateLabel: string;
  basedOnUnitPriceMinKrw: string;
  basedOnUnitPriceMaxKrw: string;
  basedOnTotalPriceMinKrw: string;
  basedOnTotalPriceMaxKrw: string;
  items: QuoteProposalFormItem[];
};

function formatKrw(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="input-base mt-2"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="input-base mt-2"
      />
    </label>
  );
}

function normalizePayload(form: QuoteProposalFormValue, statusOverride?: QuoteProposalStatus) {
  return {
    ...form,
    status: statusOverride ?? form.status,
    leadId: form.leadId || undefined,
    quantityCount: form.quantityCount || undefined,
    validUntil: form.validUntil || undefined,
    basedOnUnitPriceMinKrw: form.basedOnUnitPriceMinKrw || undefined,
    basedOnUnitPriceMaxKrw: form.basedOnUnitPriceMaxKrw || undefined,
    basedOnTotalPriceMinKrw: form.basedOnTotalPriceMinKrw || undefined,
    basedOnTotalPriceMaxKrw: form.basedOnTotalPriceMaxKrw || undefined,
    items: form.items.map((item, index) => ({
      id: item.id,
      sortOrder: index,
      itemName: item.itemName,
      description: item.description || undefined,
      quantity: item.quantity,
      unitPriceKrw: item.unitPriceKrw
    }))
  };
}

export function QuoteProposalForm({
  mode,
  proposalId,
  initialValue
}: {
  mode: "create" | "edit";
  proposalId?: string;
  initialValue: QuoteProposalFormValue;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialValue);
  const [fieldErrors, setFieldErrors] = useState<QuoteProposalFieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Math.max(1, toNumber(item.quantity)) * Math.max(0, toNumber(item.unitPriceKrw)), 0);
    const vat = Math.round(subtotal * 0.1);
    return { subtotal, vat, total: subtotal + vat };
  }, [form.items]);

  function update<K extends keyof QuoteProposalFormValue>(key: K, value: QuoteProposalFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<QuoteProposalFormItem>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          sortOrder: current.items.length,
          itemName: "추가 항목",
          description: "",
          quantity: "1",
          unitPriceKrw: "0"
        }
      ]
    }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function save(statusOverride?: QuoteProposalStatus) {
    setMessage("");
    setFieldErrors({});
    setIsSaving(true);

    try {
      const response = await fetch(mode === "create" ? "/api/admin/quote-proposals" : `/api/admin/quote-proposals/${proposalId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(form, statusOverride))
      });
      const data = (await response.json()) as {
        message?: string;
        fieldErrors?: QuoteProposalFieldErrors;
        quoteProposal?: { id: string };
      };

      if (!response.ok) {
        setMessage(data.message ?? "저장에 실패했습니다.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      router.push(data.quoteProposal?.id ? `/admin/quote-proposals/${data.quoteProposal.id}` : "/admin/quote-proposals");
      router.refresh();
    } catch {
      setMessage("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div> : null}

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">기본 정보</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="label-base">상태</span>
            <select value={form.status} onChange={(event) => update("status", event.target.value as QuoteProposalStatus)} className="input-base mt-2">
              {QUOTE_PROPOSAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {QUOTE_PROPOSAL_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <InputField label="견적안 제목" value={form.title} onChange={(value) => update("title", value)} />
          <FieldError message={fieldErrors.title} />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">고객 스냅샷</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InputField label="고객명" value={form.customerNameSnapshot} onChange={(value) => update("customerNameSnapshot", value)} />
          <InputField label="회사명" value={form.companyNameSnapshot} onChange={(value) => update("companyNameSnapshot", value)} />
          <InputField label="연락처" value={form.phoneSnapshot} onChange={(value) => update("phoneSnapshot", value)} />
          <InputField label="이메일" value={form.emailSnapshot} onChange={(value) => update("emailSnapshot", value)} />
          <InputField label="카카오톡 ID" value={form.kakaoIdSnapshot} onChange={(value) => update("kakaoIdSnapshot", value)} />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">제작 사양</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InputField label="박스 종류" value={form.boxType} onChange={(value) => update("boxType", value)} />
          <InputField label="업종" value={form.industry} onChange={(value) => update("industry", value)} />
          <InputField label="수량 표시" value={form.quantityLabel} onChange={(value) => update("quantityLabel", value)} />
          <InputField label="수량" type="number" value={form.quantityCount} onChange={(value) => update("quantityCount", value)} />
        </div>
        <div className="mt-4 grid gap-4">
          <TextareaField label="사양 요약" value={form.specificationSummary} onChange={(value) => update("specificationSummary", value)} rows={6} />
          <TextareaField label="제작 메모" value={form.productionNotes} onChange={(value) => update("productionNotes", value)} rows={4} />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">견적 항목</h2>
            <p className="mt-1 text-xs text-neutral-500">저장 시 서버에서 수량 x 단가 기준으로 다시 계산합니다.</p>
          </div>
          <button type="button" onClick={addItem} className="focus-ring w-fit rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ink">
            항목 추가
          </button>
        </div>
        <FieldError message={fieldErrors.items} />
        <div className="mt-5 space-y-4">
          {form.items.map((item, index) => {
            const amount = Math.max(1, toNumber(item.quantity)) * Math.max(0, toNumber(item.unitPriceKrw));

            return (
              <div key={`${item.id ?? "new"}-${index}`} className="rounded-md border border-line bg-ivory p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_120px_160px_140px_auto]">
                  <InputField label="항목명" value={item.itemName} onChange={(value) => updateItem(index, { itemName: value })} />
                  <InputField label="수량" type="number" value={item.quantity} onChange={(value) => updateItem(index, { quantity: value })} />
                  <InputField label="단가" type="number" value={item.unitPriceKrw} onChange={(value) => updateItem(index, { unitPriceKrw: value })} />
                  <div>
                    <span className="label-base">금액</span>
                    <p className="mt-3 text-sm font-black text-ink">{formatKrw(amount)}</p>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="focus-ring rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <TextareaField label="설명" value={item.description} onChange={(value) => updateItem(index, { description: value })} rows={3} />
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-3 rounded-md border border-line bg-white p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-neutral-500">공급가</p>
            <p className="mt-1 font-black text-ink">{formatKrw(totals.subtotal)}</p>
          </div>
          <div>
            <p className="text-neutral-500">부가세</p>
            <p className="mt-1 font-black text-ink">{formatKrw(totals.vat)}</p>
          </div>
          <div>
            <p className="text-neutral-500">합계</p>
            <p className="mt-1 font-black text-ink">{formatKrw(totals.total)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">안내 문구</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InputField label="유효일" type="date" value={form.validUntil} onChange={(value) => update("validUntil", value)} />
          <InputField label="납기 안내" value={form.deliveryEstimateText} onChange={(value) => update("deliveryEstimateText", value)} />
          <InputField label="결제 조건" value={form.paymentTerms} onChange={(value) => update("paymentTerms", value)} />
          <label className="flex items-center gap-3 rounded-md border border-line bg-ivory px-4 py-3 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={form.vatIncluded}
              onChange={(event) => update("vatIncluded", event.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            부가세 포함 표시
          </label>
        </div>
        <div className="mt-4 grid gap-4">
          <TextareaField label="고객 안내 문구" value={form.customerMessage} onChange={(value) => update("customerMessage", value)} rows={5} />
          <TextareaField label="내부 메모" value={form.internalMemo} onChange={(value) => update("internalMemo", value)} rows={5} />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">기준 참고 견적</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          리드 접수 당시 저장된 참고 예상 범위입니다. 실제 견적안 금액은 관리자 검토 후 달라질 수 있습니다.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InputField label="기준 예상 문구" value={form.basedOnEstimateLabel} onChange={(value) => update("basedOnEstimateLabel", value)} />
          <InputField label="개당 최소" type="number" value={form.basedOnUnitPriceMinKrw} onChange={(value) => update("basedOnUnitPriceMinKrw", value)} />
          <InputField label="개당 최대" type="number" value={form.basedOnUnitPriceMaxKrw} onChange={(value) => update("basedOnUnitPriceMaxKrw", value)} />
          <InputField label="총 최소" type="number" value={form.basedOnTotalPriceMinKrw} onChange={(value) => update("basedOnTotalPriceMinKrw", value)} />
          <InputField label="총 최대" type="number" value={form.basedOnTotalPriceMaxKrw} onChange={(value) => update("basedOnTotalPriceMaxKrw", value)} />
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => save("DRAFT")}
          className="focus-ring inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          임시저장
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => save("READY_TO_SEND")}
          className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          발송준비로 저장
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex items-center justify-center rounded-md border border-ink bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
        <Link
          href={form.leadId ? `/admin/leads/${form.leadId}` : "/admin/quote-proposals"}
          className="focus-ring inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ink"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
