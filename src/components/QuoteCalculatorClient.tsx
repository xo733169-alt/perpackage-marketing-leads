"use client";

import { useMemo, useState } from "react";
import {
  BOX_TYPE_OPTIONS,
  FINISHING_OPTION_OPTIONS,
  PRINT_OPTION_OPTIONS,
  QUANTITY_RANGE_OPTIONS
} from "@/lib/lead-options";
import {
  calculateReferenceQuote,
  QUOTE_COMPLEXITY_LABELS,
  QUOTE_CONFIDENCE_LABELS,
  type QuoteInput,
  type QuoteRuleConfig
} from "@/lib/quote-engine";
import { formatKrw } from "@/lib/analytics";

type CalculatorState = {
  boxType: string;
  quantityRange: string;
  widthMm: string;
  depthMm: string;
  heightMm: string;
  printOption: string;
  finishingOptions: string[];
};

function rangeLabel(min: number | null, max: number | null) {
  if (!min || !max) return "-";
  return `${formatKrw(min)} ~ ${formatKrw(max)}`;
}

function toQuoteInput(state: CalculatorState): QuoteInput {
  return {
    boxType: state.boxType,
    quantityRange: state.quantityRange,
    widthMm: state.widthMm,
    depthMm: state.depthMm,
    heightMm: state.heightMm,
    printOption: state.printOption,
    finishingOptions: state.finishingOptions
  };
}

export function QuoteCalculatorClient({
  rules,
  initialValue
}: {
  rules: QuoteRuleConfig[];
  initialValue?: Partial<CalculatorState>;
}) {
  const [state, setState] = useState<CalculatorState>({
    boxType: initialValue?.boxType ?? "",
    quantityRange: initialValue?.quantityRange ?? "",
    widthMm: initialValue?.widthMm ?? "",
    depthMm: initialValue?.depthMm ?? "",
    heightMm: initialValue?.heightMm ?? "",
    printOption: initialValue?.printOption ?? "",
    finishingOptions: initialValue?.finishingOptions ?? []
  });

  const result = useMemo(() => calculateReferenceQuote(toQuoteInput(state), rules), [rules, state]);

  function update<K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function toggleFinishing(option: string) {
    setState((current) => ({
      ...current,
      finishingOptions: current.finishingOptions.includes(option)
        ? current.finishingOptions.filter((item) => item !== option)
        : [...current.finishingOptions, option]
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">계산 조건</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-base">박스 종류</span>
            <select value={state.boxType} onChange={(event) => update("boxType", event.target.value)} className="input-base mt-2">
              <option value="">선택해 주세요</option>
              {BOX_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">제작 수량</span>
            <select
              value={state.quantityRange}
              onChange={(event) => update("quantityRange", event.target.value)}
              className="input-base mt-2"
            >
              <option value="">선택해 주세요</option>
              {QUANTITY_RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">가로 mm</span>
            <input value={state.widthMm} onChange={(event) => update("widthMm", event.target.value)} type="number" className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">세로 mm</span>
            <input value={state.depthMm} onChange={(event) => update("depthMm", event.target.value)} type="number" className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">높이 mm</span>
            <input value={state.heightMm} onChange={(event) => update("heightMm", event.target.value)} type="number" className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">인쇄 여부</span>
            <select
              value={state.printOption}
              onChange={(event) => update("printOption", event.target.value)}
              className="input-base mt-2"
            >
              <option value="">선택해 주세요</option>
              {PRINT_OPTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <p className="label-base">후가공</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {FINISHING_OPTION_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 rounded-md border border-line bg-ivory px-3 py-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={state.finishingOptions.includes(option)}
                  onChange={() => toggleFinishing(option)}
                  className="h-4 w-4 rounded border-line text-ink"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">계산 결과</h2>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          이 계산 결과는 내부 참고용입니다. 실제 견적은 사양, 종이, 제작 방식, 외주 공정, 일정 확인 후 확정해야 합니다.
        </div>

        <dl className="mt-5 divide-y divide-line">
          <div className="py-3">
            <dt className="text-xs font-bold text-neutral-500">참고용 개당 예상 범위</dt>
            <dd className="mt-1 text-base font-bold text-ink">
              {rangeLabel(result.estimatedUnitPriceMinKrw, result.estimatedUnitPriceMaxKrw)}
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-bold text-neutral-500">참고용 총 예상 범위</dt>
            <dd className="mt-1 text-base font-bold text-ink">
              {rangeLabel(result.estimatedTotalPriceMinKrw, result.estimatedTotalPriceMaxKrw)}
            </dd>
          </div>
          <div className="grid gap-4 py-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold text-neutral-500">난이도</dt>
              <dd className="mt-1 text-sm text-ink">{QUOTE_COMPLEXITY_LABELS[result.complexityLevel]}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-neutral-500">신뢰도</dt>
              <dd className="mt-1 text-sm text-ink">{QUOTE_CONFIDENCE_LABELS[result.confidenceLevel]}</dd>
            </div>
          </div>
          <div className="py-3">
            <dt className="text-xs font-bold text-neutral-500">누락된 항목</dt>
            <dd className="mt-1 text-sm text-ink">{result.missingFields.length ? result.missingFields.join(", ") : "없음"}</dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-bold text-neutral-500">적용된 룰</dt>
            <dd className="mt-1 text-sm text-ink">{result.appliedRuleName ?? "-"}</dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-bold text-neutral-500">계산 메모</dt>
            <dd className="mt-2 space-y-1 text-sm leading-6 text-charcoal">
              {result.calculationNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-bold text-neutral-500">견적 안내 문구</dt>
            <dd className="mt-1 text-sm leading-6 text-charcoal">{result.estimateDisclaimer}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
