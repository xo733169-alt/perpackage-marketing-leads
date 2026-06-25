"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOX_TYPE_OPTIONS, QUANTITY_RANGE_OPTIONS } from "@/lib/lead-options";
import { DEFAULT_QUOTE_RULES } from "@/lib/default-quote-rules";
import type { QuoteRuleFieldErrors } from "@/lib/quote-rule-schema";

export type QuoteRuleFormValue = {
  name: string;
  isActive: boolean;
  boxType: string;
  quantityRange: string;
  minQuantity: string;
  maxQuantity: string;
  baseUnitPriceMinKrw: string;
  baseUnitPriceMaxKrw: string;
  sizeSmallThreshold: string;
  sizeMediumThreshold: string;
  sizeLargeThreshold: string;
  smallSizeMultiplier: string;
  mediumSizeMultiplier: string;
  largeSizeMultiplier: string;
  extraLargeSizeMultiplier: string;
  printNoneMultiplier: string;
  printOneColorMultiplier: string;
  printFullColorMultiplier: string;
  printFoilEmbossMultiplier: string;
  finishingBaseAddMinKrw: string;
  finishingBaseAddMaxKrw: string;
  complexityLowMultiplier: string;
  complexityNormalMultiplier: string;
  complexityHighMultiplier: string;
  complexityVeryHighMultiplier: string;
  minOrderPriceKrw: string;
  notes: string;
  changeReason: string;
};

const defaultRule = DEFAULT_QUOTE_RULES[0];

const defaultValue: QuoteRuleFormValue = {
  name: defaultRule.name,
  isActive: true,
  boxType: defaultRule.boxType,
  quantityRange: defaultRule.quantityRange,
  minQuantity: defaultRule.minQuantity?.toString() ?? "",
  maxQuantity: defaultRule.maxQuantity?.toString() ?? "",
  baseUnitPriceMinKrw: defaultRule.baseUnitPriceMinKrw.toString(),
  baseUnitPriceMaxKrw: defaultRule.baseUnitPriceMaxKrw.toString(),
  sizeSmallThreshold: defaultRule.sizeSmallThreshold.toString(),
  sizeMediumThreshold: defaultRule.sizeMediumThreshold.toString(),
  sizeLargeThreshold: defaultRule.sizeLargeThreshold.toString(),
  smallSizeMultiplier: defaultRule.smallSizeMultiplier.toString(),
  mediumSizeMultiplier: defaultRule.mediumSizeMultiplier.toString(),
  largeSizeMultiplier: defaultRule.largeSizeMultiplier.toString(),
  extraLargeSizeMultiplier: defaultRule.extraLargeSizeMultiplier.toString(),
  printNoneMultiplier: defaultRule.printNoneMultiplier.toString(),
  printOneColorMultiplier: defaultRule.printOneColorMultiplier.toString(),
  printFullColorMultiplier: defaultRule.printFullColorMultiplier.toString(),
  printFoilEmbossMultiplier: defaultRule.printFoilEmbossMultiplier.toString(),
  finishingBaseAddMinKrw: defaultRule.finishingBaseAddMinKrw.toString(),
  finishingBaseAddMaxKrw: defaultRule.finishingBaseAddMaxKrw.toString(),
  complexityLowMultiplier: defaultRule.complexityLowMultiplier.toString(),
  complexityNormalMultiplier: defaultRule.complexityNormalMultiplier.toString(),
  complexityHighMultiplier: defaultRule.complexityHighMultiplier.toString(),
  complexityVeryHighMultiplier: defaultRule.complexityVeryHighMultiplier.toString(),
  minOrderPriceKrw: defaultRule.minOrderPriceKrw.toString(),
  notes: defaultRule.notes ?? "",
  changeReason: ""
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
}

function TextInput({
  label,
  value,
  error,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  error?: string;
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
      <FieldError message={error} />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function normalizePayload(form: QuoteRuleFormValue) {
  return {
    ...form,
    minQuantity: form.minQuantity || undefined,
    maxQuantity: form.maxQuantity || undefined,
    notes: form.notes || undefined,
    changeReason: form.changeReason || undefined
  };
}

export function QuoteRuleForm({
  mode,
  quoteRuleId,
  initialValue
}: {
  mode: "create" | "edit";
  quoteRuleId?: string;
  initialValue?: QuoteRuleFormValue;
}) {
  const router = useRouter();
  const [form, setForm] = useState<QuoteRuleFormValue>(initialValue ?? defaultValue);
  const [fieldErrors, setFieldErrors] = useState<QuoteRuleFieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function update<K extends keyof QuoteRuleFormValue>(key: K, value: QuoteRuleFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setIsSaving(true);

    try {
      const response = await fetch(mode === "create" ? "/api/admin/quote-rules" : `/api/admin/quote-rules/${quoteRuleId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(form))
      });
      const data = (await response.json()) as {
        message?: string;
        fieldErrors?: QuoteRuleFieldErrors;
      };

      if (!response.ok) {
        setMessage(data.message ?? "저장에 실패했습니다.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      router.push("/admin/quote-rules");
      router.refresh();
    } catch {
      setMessage("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!quoteRuleId) return;
    if (!window.confirm("이 견적 룰을 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?")) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/quote-rules/${quoteRuleId}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "삭제에 실패했습니다.");
        return;
      }

      router.push("/admin/quote-rules");
      router.refresh();
    } catch {
      setMessage("삭제 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {message ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div> : null}

      <Section title="기본 정보">
        <TextInput label="룰 이름" value={form.name} error={fieldErrors.name} onChange={(value) => update("name", value)} />
        <label className="block">
          <span className="label-base">박스 종류</span>
          <select value={form.boxType} onChange={(event) => update("boxType", event.target.value)} className="input-base mt-2">
            {BOX_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.boxType} />
        </label>
        <label className="block">
          <span className="label-base">수량 구간</span>
          <select
            value={form.quantityRange}
            onChange={(event) => update("quantityRange", event.target.value)}
            className="input-base mt-2"
          >
            {QUANTITY_RANGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.quantityRange} />
        </label>
        <label className="flex items-center gap-3 rounded-md border border-line bg-ivory px-4 py-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
            className="h-4 w-4 rounded border-line text-ink"
          />
          활성 룰로 사용
        </label>
        <TextInput label="최소 수량" type="number" value={form.minQuantity} error={fieldErrors.minQuantity} onChange={(value) => update("minQuantity", value)} />
        <TextInput label="최대 수량" type="number" value={form.maxQuantity} error={fieldErrors.maxQuantity} onChange={(value) => update("maxQuantity", value)} />
      </Section>

      <Section title="기본 단가와 사이즈 기준">
        <TextInput label="기본 개당 단가 최소" type="number" value={form.baseUnitPriceMinKrw} error={fieldErrors.baseUnitPriceMinKrw} onChange={(value) => update("baseUnitPriceMinKrw", value)} />
        <TextInput label="기본 개당 단가 최대" type="number" value={form.baseUnitPriceMaxKrw} error={fieldErrors.baseUnitPriceMaxKrw} onChange={(value) => update("baseUnitPriceMaxKrw", value)} />
        <TextInput label="최소 주문 금액" type="number" value={form.minOrderPriceKrw} error={fieldErrors.minOrderPriceKrw} onChange={(value) => update("minOrderPriceKrw", value)} />
        <TextInput label="소형 기준값" type="number" value={form.sizeSmallThreshold} error={fieldErrors.sizeSmallThreshold} onChange={(value) => update("sizeSmallThreshold", value)} />
        <TextInput label="중형 기준값" type="number" value={form.sizeMediumThreshold} error={fieldErrors.sizeMediumThreshold} onChange={(value) => update("sizeMediumThreshold", value)} />
        <TextInput label="대형 기준값" type="number" value={form.sizeLargeThreshold} error={fieldErrors.sizeLargeThreshold} onChange={(value) => update("sizeLargeThreshold", value)} />
        <TextInput label="소형 배율" type="number" value={form.smallSizeMultiplier} error={fieldErrors.smallSizeMultiplier} onChange={(value) => update("smallSizeMultiplier", value)} />
        <TextInput label="중형 배율" type="number" value={form.mediumSizeMultiplier} error={fieldErrors.mediumSizeMultiplier} onChange={(value) => update("mediumSizeMultiplier", value)} />
        <TextInput label="대형 배율" type="number" value={form.largeSizeMultiplier} error={fieldErrors.largeSizeMultiplier} onChange={(value) => update("largeSizeMultiplier", value)} />
        <TextInput label="초대형 배율" type="number" value={form.extraLargeSizeMultiplier} error={fieldErrors.extraLargeSizeMultiplier} onChange={(value) => update("extraLargeSizeMultiplier", value)} />
      </Section>

      <Section title="인쇄와 후가공">
        <TextInput label="무지 인쇄 배율" type="number" value={form.printNoneMultiplier} error={fieldErrors.printNoneMultiplier} onChange={(value) => update("printNoneMultiplier", value)} />
        <TextInput label="단색 인쇄 배율" type="number" value={form.printOneColorMultiplier} error={fieldErrors.printOneColorMultiplier} onChange={(value) => update("printOneColorMultiplier", value)} />
        <TextInput label="4도 인쇄 배율" type="number" value={form.printFullColorMultiplier} error={fieldErrors.printFullColorMultiplier} onChange={(value) => update("printFullColorMultiplier", value)} />
        <TextInput label="박/형압 포함 배율" type="number" value={form.printFoilEmbossMultiplier} error={fieldErrors.printFoilEmbossMultiplier} onChange={(value) => update("printFoilEmbossMultiplier", value)} />
        <TextInput label="후가공 추가 최소 금액" type="number" value={form.finishingBaseAddMinKrw} error={fieldErrors.finishingBaseAddMinKrw} onChange={(value) => update("finishingBaseAddMinKrw", value)} />
        <TextInput label="후가공 추가 최대 금액" type="number" value={form.finishingBaseAddMaxKrw} error={fieldErrors.finishingBaseAddMaxKrw} onChange={(value) => update("finishingBaseAddMaxKrw", value)} />
      </Section>

      <Section title="제작 난이도">
        <TextInput label="낮은 난이도 배율" type="number" value={form.complexityLowMultiplier} error={fieldErrors.complexityLowMultiplier} onChange={(value) => update("complexityLowMultiplier", value)} />
        <TextInput label="보통 난이도 배율" type="number" value={form.complexityNormalMultiplier} error={fieldErrors.complexityNormalMultiplier} onChange={(value) => update("complexityNormalMultiplier", value)} />
        <TextInput label="높은 난이도 배율" type="number" value={form.complexityHighMultiplier} error={fieldErrors.complexityHighMultiplier} onChange={(value) => update("complexityHighMultiplier", value)} />
        <TextInput label="매우 높은 난이도 배율" type="number" value={form.complexityVeryHighMultiplier} error={fieldErrors.complexityVeryHighMultiplier} onChange={(value) => update("complexityVeryHighMultiplier", value)} />
      </Section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">메모</h2>
        <label className="mt-5 block">
          <span className="label-base">메모</span>
          <textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            rows={5}
            className="input-base mt-2 min-h-32"
            placeholder="이 룰의 기준, 검토 필요 사항, 실제 단가 반영 여부를 적어두세요."
          />
          <FieldError message={fieldErrors.notes} />
        </label>
        <label className="mt-5 block">
          <span className="label-base">변경 사유</span>
          <textarea
            value={form.changeReason}
            onChange={(event) => update("changeReason", event.target.value)}
            rows={3}
            className="input-base mt-2"
            placeholder="예: 실제 견적 대비 예상가가 낮아 기본 단가 조정"
          />
          <span className="mt-2 block text-xs leading-5 text-neutral-500">
            저장 시 견적 룰 변경 이력에 함께 기록됩니다. 비워 두어도 저장할 수 있습니다.
          </span>
        </label>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
        <Link
          href="/admin/quote-rules"
          className="focus-ring inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ink"
        >
          취소
        </Link>
        {mode === "edit" ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={remove}
            className="focus-ring inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            삭제
          </button>
        ) : null}
      </div>
    </form>
  );
}
