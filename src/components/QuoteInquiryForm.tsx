"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOX_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  PRINT_OPTION_OPTIONS,
  QUANTITY_RANGE_OPTIONS
} from "@/lib/lead-options";
import { LeadFieldErrors, leadCreateSchema, toFieldErrors } from "@/lib/lead-schema";
import type { PublicReferenceQuotePreview } from "@/lib/quote-engine";

type SubmitState = {
  message?: string;
  fieldErrors: LeadFieldErrors;
};

type TrackingFields = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrer: string;
  landingPath: string;
  sourceCaseSlug: string;
  sourceCaseTitle: string;
};

const initialTracking: TrackingFields = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  referrer: "",
  landingPath: "",
  sourceCaseSlug: "",
  sourceCaseTitle: ""
};

const PACKAGE_TYPE_OPTIONS = [
  "단상자",
  "쇼핑백",
  "싸바리박스",
  "골판지박스",
  "내부 트레이",
  "봉투/파우치",
  "스티커/라벨",
  "잘 모르겠어요",
  "기타"
] as const;

const PACKAGE_STRUCTURE_OPTIONS = [
  "맞뚜껑형",
  "삼면접착형",
  "자동바닥형",
  "상하분리형",
  "서랍형",
  "슬리브형",
  "C형 무접착",
  "손잡이형",
  "잘 모르겠어요",
  "기타"
] as const;

const PACKAGE_QUANTITY_OPTIONS = [
  "100개 이하",
  "100~500개",
  "500~1,000개",
  "1,000~3,000개",
  "3,000개 이상",
  "아직 미정"
] as const;

const PHYSICAL_PRODUCT_OPTIONS = [
  "제품 실물이 있습니다",
  "제품 이미지만 있습니다",
  "사이즈표만 있습니다",
  "아직 없습니다",
  "잘 모르겠어요"
] as const;

const DESIGN_FILE_OPTIONS = [
  "AI 파일 있음",
  "PDF 파일 있음",
  "이미지 파일만 있음",
  "디자인 의뢰 필요",
  "아직 없음",
  "잘 모르겠어요"
] as const;

const DIELINE_OPTIONS = [
  "도면 있음",
  "기존 박스 샘플 있음",
  "도면 제작 필요",
  "잘 모르겠어요"
] as const;

const PACKAGE_BUDGET_RANGE_OPTIONS = [
  "50만원 이하",
  "50~100만원",
  "100~300만원",
  "300만원 이상",
  "아직 미정"
] as const;

const PACKAGE_FINISHING_OPTIONS = [
  "무광코팅",
  "유광코팅",
  "박",
  "형압/엠보",
  "부분코팅",
  "창/PET",
  "끈/손잡이",
  "잘 모르겠어요",
  "없음"
] as const;

const READINESS_CHECKLIST_ITEMS = [
  { id: "productOrSize", label: "제품 실물 또는 정확한 사이즈가 있나요?" },
  { id: "quantity", label: "희망 수량이 정해졌나요?" },
  { id: "dueDate", label: "희망 납기일이 있나요?" },
  { id: "designFile", label: "디자인 파일이 준비되어 있나요?" },
  { id: "referenceSample", label: "참고할 패키지 사진이나 기존 샘플이 있나요?" },
  { id: "budget", label: "예산 범위가 정해졌나요?" },
  { id: "productProperty", label: "제품 무게나 내용물 특성을 알고 있나요?" }
] as const;

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isOption(value: string | null, options: readonly string[]) {
  return Boolean(value && options.includes(value));
}

function formDataToPayload(formData: FormData) {
  return {
    customerName: getFormValue(formData, "customerName"),
    companyName: getFormValue(formData, "companyName"),
    phone: getFormValue(formData, "phone"),
    email: getFormValue(formData, "email"),
    kakaoId: getFormValue(formData, "kakaoId"),
    industry: getFormValue(formData, "industry"),
    boxType: getFormValue(formData, "boxType"),
    widthMm: getFormValue(formData, "widthMm"),
    depthMm: getFormValue(formData, "depthMm"),
    heightMm: getFormValue(formData, "heightMm"),
    quantityRange: getFormValue(formData, "quantityRange"),
    printOption: getFormValue(formData, "printOption"),
    finishingOptions: formData.getAll("finishingOptions").filter((value): value is string => typeof value === "string"),
    desiredDeliveryDate: getFormValue(formData, "desiredDeliveryDate"),
    budgetRange: getFormValue(formData, "budgetRange") || undefined,
    referenceNote: getFormValue(formData, "referenceNote"),
    message: getFormValue(formData, "message"),
    packageType: getFormValue(formData, "packageType"),
    packageStructure: getFormValue(formData, "packageStructure"),
    quantity: getFormValue(formData, "quantity"),
    sizeInfo: getFormValue(formData, "sizeInfo"),
    hasPhysicalProduct: getFormValue(formData, "hasPhysicalProduct"),
    hasDesignFile: getFormValue(formData, "hasDesignFile"),
    hasDieline: getFormValue(formData, "hasDieline"),
    desiredDueDate: getFormValue(formData, "desiredDueDate"),
    isUrgent: formData.get("isUrgent") === "on",
    readinessChecklist: getFormValue(formData, "readinessChecklist"),
    readinessScore: getFormValue(formData, "readinessScore"),
    privacyConsent: formData.get("privacyConsent") === "on",
    marketingConsent: formData.get("marketingConsent") === "on",
    utmSource: getFormValue(formData, "utmSource"),
    utmMedium: getFormValue(formData, "utmMedium"),
    utmCampaign: getFormValue(formData, "utmCampaign"),
    utmTerm: getFormValue(formData, "utmTerm"),
    utmContent: getFormValue(formData, "utmContent"),
    referrer: getFormValue(formData, "referrer"),
    landingPath: getFormValue(formData, "landingPath"),
    sourceCaseSlug: getFormValue(formData, "sourceCaseSlug"),
    sourceCaseTitle: getFormValue(formData, "sourceCaseTitle"),
    website: getFormValue(formData, "website")
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
}

function SelectField({
  id,
  label,
  options,
  value,
  required,
  error,
  onChange
}: {
  id: string;
  label: string;
  options: readonly string[];
  value: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <select id={id} name={id} value={value} required={required} className="input-base mt-2" onChange={(event) => onChange(event.target.value)}>
        <option value="">선택해 주세요</option>
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </label>
  );
}

function TextField({
  id,
  label,
  type = "text",
  required,
  placeholder,
  error,
  value,
  onChange
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        className="input-base mt-2"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <FieldError message={error} />
    </label>
  );
}

function TextareaField({
  id,
  label,
  rows = 3,
  placeholder,
  helper,
  error
}: {
  id: string;
  label: string;
  rows?: number;
  placeholder?: string;
  helper?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      {helper ? <span className="mt-1 block text-xs leading-5 text-neutral-500">{helper}</span> : null}
      <textarea id={id} name={id} rows={rows} placeholder={placeholder} className="input-base mt-2 min-h-24" />
      <FieldError message={error} />
    </label>
  );
}

function QuotePreviewBox({
  quote,
  quantityRange
}: {
  quote: PublicReferenceQuotePreview | null;
  quantityRange: string;
}) {
  const hasOnlyQuantityMissing =
    quote?.missingFields.length === 1 && quote.missingFields[0] === "제작 수량" && quantityRange === "아직 미정";
  const canShowUnit = Boolean(quote?.unitPriceRangeLabel && (quote.canShowNumericEstimate || hasOnlyQuantityMissing));

  return (
    <div className="mt-6 rounded-lg border border-brass/30 bg-white p-4">
      <p className="text-sm font-bold text-ink">참고용 예상 범위</p>
      {!quote || (!canShowUnit && !quote.canShowNumericEstimate) ? (
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          박스 종류, 제작 수량, 사이즈, 인쇄 여부를 입력하면 참고용 예상 범위를 더 정확하게 확인할 수 있습니다.
        </p>
      ) : (
        <div className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
          {quote.unitPriceRangeLabel ? (
            <p>
              <span className="font-semibold text-ink">개당 예상 범위:</span> {quote.unitPriceRangeLabel}
            </p>
          ) : null}
          {quantityRange === "아직 미정" ? (
            <p>수량이 정해지면 총 예상 범위를 더 정확하게 안내드릴 수 있습니다.</p>
          ) : quote.totalPriceRangeLabel ? (
            <p>
              <span className="font-semibold text-ink">총 예상 범위:</span> {quote.totalPriceRangeLabel}
            </p>
          ) : null}
          <p className="text-xs leading-5 text-neutral-500">{quote.estimateDisclaimer}</p>
        </div>
      )}
    </div>
  );
}

function getReadinessMessage(score: number) {
  if (score <= 30) {
    return "아직 준비 정보가 부족합니다. 괜찮습니다. 상담을 통해 필요한 정보를 함께 정리해드릴 수 있습니다.";
  }

  if (score <= 70) {
    return "기본 상담이 가능한 상태입니다. 제품 사이즈와 수량이 정리되면 더 정확한 안내가 가능합니다.";
  }

  return "상담 준비도가 높은 상태입니다. 도면, 디자인 파일, 납기 조건을 함께 확인하면 견적 상담이 빠르게 진행될 수 있습니다.";
}

export function QuoteInquiryForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<SubmitState>({ fieldErrors: {} });
  const [tracking, setTracking] = useState<TrackingFields>(initialTracking);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedBoxType, setSelectedBoxType] = useState("");
  const [selectedQuantityRange, setSelectedQuantityRange] = useState("");
  const [widthMm, setWidthMm] = useState("");
  const [depthMm, setDepthMm] = useState("");
  const [heightMm, setHeightMm] = useState("");
  const [selectedPrintOption, setSelectedPrintOption] = useState("");
  const [selectedBudgetRange, setSelectedBudgetRange] = useState("");
  const [selectedPackageType, setSelectedPackageType] = useState("");
  const [selectedPackageStructure, setSelectedPackageStructure] = useState("");
  const [selectedPackageQuantity, setSelectedPackageQuantity] = useState("");
  const [selectedPhysicalProduct, setSelectedPhysicalProduct] = useState("");
  const [selectedDesignFile, setSelectedDesignFile] = useState("");
  const [selectedDieline, setSelectedDieline] = useState("");
  const [selectedFinishingOptions, setSelectedFinishingOptions] = useState<string[]>([]);
  const [readinessChecked, setReadinessChecked] = useState<Record<string, boolean>>({});
  const [quotePreview, setQuotePreview] = useState<PublicReferenceQuotePreview | null>(null);

  const finishingOptions = useMemo(() => PACKAGE_FINISHING_OPTIONS, []);
  const readinessScore = useMemo(() => {
    const checkedCount = READINESS_CHECKLIST_ITEMS.filter((item) => readinessChecked[item.id]).length;
    return Math.round((checkedCount / READINESS_CHECKLIST_ITEMS.length) * 100);
  }, [readinessChecked]);
  const readinessChecklistPayload = useMemo(
    () =>
      JSON.stringify(
        READINESS_CHECKLIST_ITEMS.map((item) => ({
          key: item.id,
          label: item.label,
          checked: Boolean(readinessChecked[item.id])
        }))
      ),
    [readinessChecked]
  );
  const readinessMessage = useMemo(() => getReadinessMessage(readinessScore), [readinessScore]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const industry = params.get("industry");
    const boxType = params.get("boxType");

    if (isOption(industry, INDUSTRY_OPTIONS)) {
      setSelectedIndustry(industry ?? "");
    }

    if (isOption(boxType, BOX_TYPE_OPTIONS)) {
      setSelectedBoxType(boxType ?? "");
    }

    setTracking({
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      utmTerm: params.get("utm_term") ?? "",
      utmContent: params.get("utm_content") ?? "",
      referrer: document.referrer ?? "",
      landingPath: `${window.location.pathname}${window.location.search}`,
      sourceCaseSlug: params.get("sourceCaseSlug") ?? "",
      sourceCaseTitle: params.get("sourceCaseTitle") ?? ""
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchQuotePreview() {
      try {
        const response = await fetch("/api/quote-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            boxType: selectedBoxType,
            quantityRange: selectedQuantityRange,
            widthMm,
            depthMm,
            heightMm,
            printOption: selectedPrintOption,
            finishingOptions: selectedFinishingOptions
          })
        });

        if (!response.ok) {
          setQuotePreview(null);
          return;
        }

        const data = (await response.json()) as { quote: PublicReferenceQuotePreview };
        setQuotePreview(data.quote);
      } catch (error) {
        if (!controller.signal.aborted) {
          setQuotePreview(null);
        }
      }
    }

    void fetchQuotePreview();
    return () => controller.abort();
  }, [selectedBoxType, selectedQuantityRange, widthMm, depthMm, heightMm, selectedPrintOption, selectedFinishingOptions]);

  function toggleFinishingOption(option: string) {
    setSelectedFinishingOptions((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    );
  }

  function toggleReadinessItem(id: string) {
    setReadinessChecked((current) => ({
      ...current,
      [id]: !current[id]
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setState({ fieldErrors: {} });

    const payload = formDataToPayload(new FormData(event.currentTarget));
    const parsed = leadCreateSchema.safeParse(payload);

    if (!parsed.success) {
      setState({
        fieldErrors: toFieldErrors(parsed.error),
        message: "입력 내용을 다시 확인해 주세요."
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed.data)
      });

      const data = (await response.json()) as {
        message?: string;
        fieldErrors?: LeadFieldErrors;
      };

      if (!response.ok) {
        setState({
          fieldErrors: data.fieldErrors ?? {},
          message: data.message ?? "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
        });
        return;
      }

      router.push("/thanks");
    } catch {
      setState({
        fieldErrors: {},
        message: "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 scroll-mt-24" noValidate>
      <input type="hidden" name="utmSource" value={tracking.utmSource} />
      <input type="hidden" name="utmMedium" value={tracking.utmMedium} />
      <input type="hidden" name="utmCampaign" value={tracking.utmCampaign} />
      <input type="hidden" name="utmTerm" value={tracking.utmTerm} />
      <input type="hidden" name="utmContent" value={tracking.utmContent} />
      <input type="hidden" name="referrer" value={tracking.referrer} />
      <input type="hidden" name="landingPath" value={tracking.landingPath} />
      <input type="hidden" name="sourceCaseSlug" value={tracking.sourceCaseSlug} />
      <input type="hidden" name="sourceCaseTitle" value={tracking.sourceCaseTitle} />
      <input type="hidden" name="readinessChecklist" value={readinessChecklistPayload} />
      <input type="hidden" name="readinessScore" value={String(readinessScore)} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {state.message ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.message}</div> : null}

      {tracking.sourceCaseTitle ? (
        <div className="rounded-lg border border-brass/30 bg-ivory p-4 text-sm leading-6 text-charcoal">
          <p className="font-semibold text-ink">‘{tracking.sourceCaseTitle}’ 제작 사례를 보고 문의 중입니다.</p>
          <p className="mt-1">유사한 구조와 사양을 참고해 상담을 도와드리겠습니다.</p>
        </div>
      ) : null}

      <fieldset className="rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">고객 정보</legend>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextField id="customerName" label="고객명" required error={state.fieldErrors.customerName} />
          <TextField id="companyName" label="회사명" error={state.fieldErrors.companyName} />
          <TextField id="phone" label="연락처" required placeholder="010-0000-0000" error={state.fieldErrors.phone} />
          <TextField id="email" label="이메일" type="email" error={state.fieldErrors.email} />
          <TextField id="kakaoId" label="카카오톡 ID" error={state.fieldErrors.kakaoId} />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">패키지 제작 정보</legend>
        <div className="mt-5 rounded-lg border border-brass/30 bg-white p-4 text-sm leading-6 text-charcoal">
          <p className="font-semibold text-ink">
            패키지 제작이 처음이어도 괜찮습니다. 알고 계신 정보만 입력해주시면 상담 시 필요한 내용을 함께 정리해드립니다.
          </p>
          <p className="mt-2">정확한 견적은 제품 실측, 도면, 재질, 수량, 인쇄/후가공 조건 확인 후 안내됩니다.</p>
          <p className="mt-1 font-semibold text-ink">최종 견적은 상담 후 확정됩니다.</p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SelectField
            id="packageType"
            label="패키지 종류"
            options={PACKAGE_TYPE_OPTIONS}
            value={selectedPackageType}
            error={state.fieldErrors.packageType}
            onChange={setSelectedPackageType}
          />
          <SelectField
            id="packageStructure"
            label="패키지 구조"
            options={PACKAGE_STRUCTURE_OPTIONS}
            value={selectedPackageStructure}
            error={state.fieldErrors.packageStructure}
            onChange={setSelectedPackageStructure}
          />
          <SelectField
            id="quantity"
            label="수량"
            options={PACKAGE_QUANTITY_OPTIONS}
            value={selectedPackageQuantity}
            error={state.fieldErrors.quantity}
            onChange={setSelectedPackageQuantity}
          />
          <SelectField
            id="hasPhysicalProduct"
            label="제품 실물 여부"
            options={PHYSICAL_PRODUCT_OPTIONS}
            value={selectedPhysicalProduct}
            error={state.fieldErrors.hasPhysicalProduct}
            onChange={setSelectedPhysicalProduct}
          />
          <SelectField
            id="hasDesignFile"
            label="디자인 파일 여부"
            options={DESIGN_FILE_OPTIONS}
            value={selectedDesignFile}
            error={state.fieldErrors.hasDesignFile}
            onChange={setSelectedDesignFile}
          />
          <SelectField
            id="hasDieline"
            label="도면 여부"
            options={DIELINE_OPTIONS}
            value={selectedDieline}
            error={state.fieldErrors.hasDieline}
            onChange={setSelectedDieline}
          />
          <div className="md:col-span-2">
            <TextareaField
              id="sizeInfo"
              label="사이즈 정보"
              rows={3}
              helper="정확하지 않아도 괜찮습니다. 대략적인 가로 × 세로 × 높이를 mm 기준으로 적어주세요."
              placeholder="예: 제품 기준 120 × 80 × 40mm 정도 / 아직 정확하지 않음"
              error={state.fieldErrors.sizeInfo}
            />
          </div>
          <TextField
            id="desiredDueDate"
            label="희망 납기"
            placeholder="예: 7월 말, 행사 전까지, 아직 미정"
            error={state.fieldErrors.desiredDueDate}
          />
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-line bg-white px-3 py-2.5 text-sm text-charcoal md:mt-7">
            <input name="isUrgent" type="checkbox" className="h-4 w-4 rounded border-line text-ink" />
            <span>급건입니다</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">제작 정보</legend>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SelectField
            id="industry"
            label="업종"
            required
            options={INDUSTRY_OPTIONS}
            value={selectedIndustry}
            error={state.fieldErrors.industry}
            onChange={setSelectedIndustry}
          />
          <SelectField
            id="boxType"
            label="원하는 박스 종류"
            required
            options={BOX_TYPE_OPTIONS}
            value={selectedBoxType}
            error={state.fieldErrors.boxType}
            onChange={setSelectedBoxType}
          />
          <TextField id="widthMm" label="가로 mm" type="number" value={widthMm} onChange={setWidthMm} error={state.fieldErrors.widthMm} />
          <TextField id="depthMm" label="세로 mm" type="number" value={depthMm} onChange={setDepthMm} error={state.fieldErrors.depthMm} />
          <TextField id="heightMm" label="높이 mm" type="number" value={heightMm} onChange={setHeightMm} error={state.fieldErrors.heightMm} />
          <SelectField
            id="quantityRange"
            label="제작 수량"
            required
            options={QUANTITY_RANGE_OPTIONS}
            value={selectedQuantityRange}
            error={state.fieldErrors.quantityRange}
            onChange={setSelectedQuantityRange}
          />
          <SelectField
            id="printOption"
            label="인쇄 여부"
            required
            options={PRINT_OPTION_OPTIONS}
            value={selectedPrintOption}
            error={state.fieldErrors.printOption}
            onChange={setSelectedPrintOption}
          />
          <TextField id="desiredDeliveryDate" label="희망 납기일" type="date" error={state.fieldErrors.desiredDeliveryDate} />
          <SelectField
            id="budgetRange"
            label="예산 범위"
            options={PACKAGE_BUDGET_RANGE_OPTIONS}
            value={selectedBudgetRange}
            error={state.fieldErrors.budgetRange}
            onChange={setSelectedBudgetRange}
          />
        </div>

        <QuotePreviewBox quote={quotePreview} quantityRange={selectedQuantityRange} />

        <div className="mt-6">
          <p className="label-base">후가공</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {finishingOptions.map((option) => (
              <label
                key={option}
                className="focus-within:ring-2 focus-within:ring-ink flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2.5 text-sm text-charcoal"
              >
                <input
                  type="checkbox"
                  name="finishingOptions"
                  value={option}
                  checked={selectedFinishingOptions.includes(option)}
                  onChange={() => toggleFinishingOption(option)}
                  className="h-4 w-4 rounded border-line text-ink"
                />
                {option}
              </label>
            ))}
          </div>
          <FieldError message={state.fieldErrors.finishingOptions} />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">제작 준비 체크리스트</legend>
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {READINESS_CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.id}
              className="focus-within:ring-2 focus-within:ring-ink flex items-start gap-3 rounded-md border border-line bg-white px-3 py-3 text-sm leading-6 text-charcoal"
            >
              <input
                type="checkbox"
                checked={Boolean(readinessChecked[item.id])}
                onChange={() => toggleReadinessItem(item.id)}
                className="mt-1 h-4 w-4 rounded border-line text-ink"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-brass/30 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-ink">제작 준비도 {readinessScore}점</p>
            <p className="text-xs text-neutral-500">{READINESS_CHECKLIST_ITEMS.length}개 항목 중 체크 기준</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-brass transition-all" style={{ width: `${readinessScore}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-charcoal">{readinessMessage}</p>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            표시되는 준비도는 견적 확정 기준이 아니며, 최종 견적은 상담 후 확정됩니다.
          </p>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">참고 자료 및 요청사항</legend>
        <div className="mt-5 grid gap-5">
          <label className="block">
            <span className="label-base">참고 이미지/링크</span>
            <textarea
              id="referenceNote"
              name="referenceNote"
              rows={3}
              placeholder="참고 URL을 붙여넣거나 원하는 패키지 느낌을 적어주세요."
              className="input-base mt-2 min-h-24"
            />
            <FieldError message={state.fieldErrors.referenceNote} />
          </label>

          <label className="block">
            <span className="label-base">추가 요청사항</span>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="제품 용도, 납기, 샘플 필요 여부 등 상담에 필요한 내용을 적어주세요."
              className="input-base mt-2 min-h-32"
            />
            <FieldError message={state.fieldErrors.message} />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">동의 항목</legend>
        <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-charcoal">
          <input name="privacyConsent" type="checkbox" className="mt-1 h-4 w-4 rounded border-line text-ink" />
          <span>
            개인정보 수집 및 이용에 동의합니다. (필수)
            <Link href="/privacy" className="ml-2 font-semibold text-ink underline underline-offset-4">
              자세히 보기
            </Link>
          </span>
        </label>
        <FieldError message={state.fieldErrors.privacyConsent} />

        <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-charcoal">
          <input name="marketingConsent" type="checkbox" className="mt-1 h-4 w-4 rounded border-line text-ink" />
          <span>제작 사례, 샘플 안내, 재주문 안내 등 마케팅 정보 수신에 동의합니다. (선택)</span>
        </label>
      </fieldset>

      <div className="flex flex-col gap-3 pb-20 sm:flex-row sm:items-center sm:pb-0">
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "문의 접수 중..." : "견적 문의 접수하기"}
        </button>
        <p className="text-sm leading-6 text-neutral-600">
          접수 후 남겨주신 연락처로 사양 확인과 견적 안내를 진행드립니다.
        </p>
      </div>
    </form>
  );
}
