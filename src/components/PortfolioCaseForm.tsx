"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PortfolioCaseImage } from "@/components/PortfolioCaseImage";
import {
  FINISHING_OPTION_OPTIONS,
  PRINT_OPTION_OPTIONS,
  QUANTITY_RANGE_OPTIONS
} from "@/lib/lead-options";
import {
  generatePortfolioOverview,
  generatePortfolioSeoDescription,
  generatePortfolioSeoTitle,
  generatePortfolioShortDescription,
  generatePortfolioSlug,
  generatePortfolioTags,
  generatePortfolioTitle,
  generateSpecificationSummary
} from "@/lib/portfolio-content";
import { getPortfolioSeoChecklist, getPortfolioSeoPreview } from "@/lib/portfolio-seo";
import {
  PORTFOLIO_INDUSTRY_OPTIONS,
  PORTFOLIO_PACKAGE_TYPE_OPTIONS,
  PORTFOLIO_PURPOSE_OPTIONS,
  PORTFOLIO_STATUSES,
  PORTFOLIO_STATUS_LABELS,
  PORTFOLIO_STRUCTURE_OPTIONS,
  type PortfolioStatus
} from "@/lib/portfolio-options";
import { PortfolioCaseFieldErrors, portfolioCaseSchema, toPortfolioFieldErrors } from "@/lib/portfolio-schema";
import type { PortfolioImageUploadResponse } from "@/lib/upload-utils";

type PortfolioCaseFormValue = {
  title: string;
  slug: string;
  status: PortfolioStatus;
  featured: boolean;
  sortOrder: string;
  industry: string;
  boxType: string;
  packageStructure: string;
  casePurpose: string;
  productName: string;
  clientName: string;
  isClientNamePublic: boolean;
  quantityRange: string;
  widthMm: string;
  depthMm: string;
  heightMm: string;
  paperType: string;
  boardThickness: string;
  printOption: string;
  finishingOptions: string[];
  mainImageUrl: string;
  mainImageAlt: string;
  imageCaption: string;
  imageUrlsText: string;
  shortDescription: string;
  projectOverview: string;
  productionPoint: string;
  specificationSummary: string;
  seoTitle: string;
  seoDescription: string;
  tagsText: string;
  publicApprovalConfirmed: boolean;
  publicApprovalMemo: string;
  publicApprovalBy: string;
};

type PortfolioCaseFormProps = {
  mode: "create" | "edit";
  caseId?: string;
  initialValue?: Partial<PortfolioCaseFormValue>;
};

const defaultValue: PortfolioCaseFormValue = {
  title: "",
  slug: "",
  status: "DRAFT",
  featured: false,
  sortOrder: "0",
  industry: "",
  boxType: "",
  packageStructure: "",
  casePurpose: "",
  productName: "",
  clientName: "",
  isClientNamePublic: false,
  quantityRange: "",
  widthMm: "",
  depthMm: "",
  heightMm: "",
  paperType: "",
  boardThickness: "",
  printOption: "",
  finishingOptions: [],
  mainImageUrl: "",
  mainImageAlt: "",
  imageCaption: "",
  imageUrlsText: "",
  shortDescription: "",
  projectOverview: "",
  productionPoint: "",
  specificationSummary: "",
  seoTitle: "",
  seoDescription: "",
  tagsText: "",
  publicApprovalConfirmed: false,
  publicApprovalMemo: "",
  publicApprovalBy: ""
};

type SaveIntent = "save" | "publish" | "archive";

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value: string): string[] {
  return value
    .split(/,|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatUploadBytes(value?: number): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;

  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)}MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))}KB`;
}

function TextInput({
  label,
  value,
  onChange,
  required,
  type = "text",
  error,
  placeholder,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  error?: string;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-base mt-2"
      />
      {helper ? <p className="mt-1.5 text-xs leading-5 text-neutral-500">{helper}</p> : null}
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
  rows = 4,
  error,
  placeholder,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  error?: string;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <textarea
        required={required}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-base mt-2 min-h-24"
      />
      {helper ? <p className="mt-1.5 text-xs leading-5 text-neutral-500">{helper}</p> : null}
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  required,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-base mt-2"
      >
        <option value="">선택해 주세요</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
    </label>
  );
}

export function PortfolioCaseForm({ mode, caseId, initialValue }: PortfolioCaseFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PortfolioCaseFormValue>({
    ...defaultValue,
    ...initialValue
  });
  const [fieldErrors, setFieldErrors] = useState<PortfolioCaseFieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploadMessage, setImageUploadMessage] = useState("");
  const [imageUploadError, setImageUploadError] = useState("");
  const [imageUploadResult, setImageUploadResult] = useState<PortfolioImageUploadResponse | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const seoCase = useMemo(
    () => ({
      title: form.title,
      slug: form.slug,
      industry: form.industry,
      boxType: form.boxType,
      mainImageUrl: form.mainImageUrl,
      mainImageAlt: form.mainImageAlt,
      shortDescription: form.shortDescription,
      productionPoint: form.productionPoint,
      specificationSummary: form.specificationSummary,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      tags: JSON.stringify(splitTags(form.tagsText))
    }),
    [form]
  );
  const seoPreview = getPortfolioSeoPreview(seoCase);
  const seoChecklist = getPortfolioSeoChecklist(seoCase);

  function update<K extends keyof PortfolioCaseFormValue>(key: K, value: PortfolioCaseFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toPayload(intent: SaveIntent) {
    const status =
      intent === "publish"
        ? "PUBLISHED"
        : intent === "archive"
          ? "ARCHIVED"
          : form.status;

    return {
      title: form.title,
      slug: form.slug,
      status,
      featured: form.featured,
      sortOrder: form.sortOrder,
      industry: form.industry,
      boxType: form.boxType,
      packageStructure: form.packageStructure || undefined,
      casePurpose: form.casePurpose || undefined,
      productName: form.productName,
      clientName: form.clientName,
      isClientNamePublic: form.isClientNamePublic,
      quantityRange: form.quantityRange || undefined,
      widthMm: form.widthMm,
      depthMm: form.depthMm,
      heightMm: form.heightMm,
      paperType: form.paperType,
      boardThickness: form.boardThickness,
      printOption: form.printOption || undefined,
      finishingOptions: form.finishingOptions,
      mainImageUrl: form.mainImageUrl,
      mainImageAlt: form.mainImageAlt,
      imageCaption: form.imageCaption,
      imageUrls: splitLines(form.imageUrlsText),
      shortDescription: form.shortDescription,
      projectOverview: form.projectOverview,
      productionPoint: form.productionPoint,
      specificationSummary: form.specificationSummary,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      tags: splitTags(form.tagsText),
      publicApprovalConfirmed: form.publicApprovalConfirmed,
      publicApprovalMemo: form.publicApprovalMemo,
      publicApprovalBy: form.publicApprovalBy
    };
  }

  function handleGenerateSlug() {
    update("slug", generatePortfolioSlug(form.title || form));
  }

  function handleGenerateDraft() {
    const input = {
      title: form.title,
      industry: form.industry,
      boxType: form.boxType,
      productName: form.productName,
      quantityRange: form.quantityRange,
      finishingOptions: form.finishingOptions,
      boardThickness: form.boardThickness,
      paperType: form.paperType,
      printOption: form.printOption,
      clientName: form.clientName,
      isClientNamePublic: form.isClientNamePublic
    };
    const tags = generatePortfolioTags(input);

    setForm((current) => ({
      ...current,
      title: current.title || generatePortfolioTitle(input),
      slug: current.slug || generatePortfolioSlug(input),
      shortDescription: generatePortfolioShortDescription(input),
      projectOverview: generatePortfolioOverview(input),
      productionPoint:
        current.productionPoint ||
        "제품의 첫인상과 개봉 경험을 고려해 구조 안정성, 인쇄 표현, 후가공 포인트를 함께 검토했습니다.",
      specificationSummary: generateSpecificationSummary(input),
      seoTitle: generatePortfolioSeoTitle(input),
      seoDescription: generatePortfolioSeoDescription(input),
      tagsText: tags.join(", ")
    }));
  }

  async function save(intent: SaveIntent) {
    setMessage("");
    setFieldErrors({});
    setIsSaving(true);

    const payload = toPayload(intent);
    const parsed = portfolioCaseSchema.safeParse(payload);

    if (!parsed.success) {
      setFieldErrors(toPortfolioFieldErrors(parsed.error));
      setMessage("입력 내용을 확인해 주세요.");
      setIsSaving(false);
      return;
    }

    const url = mode === "edit" && caseId ? `/api/admin/portfolio/${caseId}` : "/api/admin/portfolio";
    const method = mode === "edit" ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const data = (await response.json()) as {
        message?: string;
        fieldErrors?: PortfolioCaseFieldErrors;
        portfolioCase?: { id: string; status: PortfolioStatus; publicApprovalConfirmed?: boolean };
      };

      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setMessage(data.message ?? "저장 중 문제가 발생했습니다.");
        return;
      }

      setForm((current) => ({
        ...current,
        status: data.portfolioCase?.status ?? parsed.data.status,
        publicApprovalConfirmed: data.portfolioCase?.publicApprovalConfirmed ?? parsed.data.publicApprovalConfirmed
      }));
      setMessage(intent === "publish" ? "저장 후 공개 처리했습니다." : intent === "archive" ? "보관 처리했습니다." : "저장되었습니다.");

      if (mode === "create" && data.portfolioCase?.id) {
        router.push(`/admin/portfolio/${data.portfolioCase.id}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setMessage("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadMainImage(file: File | null) {
    if (!file) return;

    setImageUploadMessage("");
    setImageUploadError("");
    setImageUploadResult(null);
    setIsImageUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/uploads/portfolio", {
        method: "POST",
        body: formData
      });
      const data = (await response.json().catch(() => ({}))) as Partial<PortfolioImageUploadResponse> & {
        message?: string;
      };

      if (!response.ok || !data.url) {
        setImageUploadError(data.message ?? "이미지 업로드에 실패했습니다.");
        return;
      }

      update("mainImageUrl", data.url);
      setImageUploadResult(data as PortfolioImageUploadResponse);
      setImageUploadMessage(
        "업로드 완료. 웹용 이미지로 최적화되었습니다. 제작 사례 저장 버튼을 눌러야 대표 이미지가 최종 반영됩니다."
      );
    } catch {
      setImageUploadError("이미지 업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsImageUploading(false);
    }
  }

  async function handleDelete() {
    if (!caseId) return;
    const confirmed = window.confirm("이 제작 사례를 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?");
    if (!confirmed) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/portfolio/${caseId}`, { method: "DELETE" });

    if (response.ok) {
      router.push("/admin/portfolio");
      router.refresh();
      return;
    }

    setIsSaving(false);
    setMessage("삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  function toggleFinishing(option: string) {
    setForm((current) => ({
      ...current,
      finishingOptions: current.finishingOptions.includes(option)
        ? current.finishingOptions.filter((item) => item !== option)
        : [...current.finishingOptions, option]
    }));
  }

  const originalUploadSizeLabel = formatUploadBytes(imageUploadResult?.originalSizeBytes);
  const optimizedUploadSizeLabel = formatUploadBytes(imageUploadResult?.optimizedSizeBytes);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save("save");
      }}
      className="space-y-6"
    >
      {message ? (
        <div className="rounded-md border border-line bg-white px-4 py-3 text-sm leading-6 text-charcoal">
          {message}
        </div>
      ) : null}

      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-ink">기본 정보</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerateSlug}
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
            >
              슬러그 자동 생성
            </button>
            <button
              type="button"
              onClick={handleGenerateDraft}
              className="focus-ring rounded-md border border-line bg-ivory px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
            >
              사양 기반 초안 생성
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextInput label="제목" required value={form.title} onChange={(value) => update("title", value)} error={fieldErrors.title} />
          <TextInput
            label="슬러그"
            required
            value={form.slug}
            onChange={(value) => update("slug", value)}
            error={fieldErrors.slug}
            placeholder="cosmetic-magnetic-box-case"
          />
          <label className="block">
            <span className="label-base">상태</span>
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value as PortfolioStatus)}
              className="input-base mt-2"
            >
              {PORTFOLIO_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PORTFOLIO_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {fieldErrors.status ? <p className="mt-1.5 text-sm text-red-700">{fieldErrors.status}</p> : null}
          </label>
          <TextInput
            label="정렬 순서"
            type="number"
            value={form.sortOrder}
            onChange={(value) => update("sortOrder", value)}
            error={fieldErrors.sortOrder}
          />
          <label className="flex items-center gap-3 rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => update("featured", event.target.checked)}
              className="h-4 w-4 rounded border-line text-ink"
            />
            추천 사례 여부
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">제작 사양</h2>
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          고객사명, 제품명, 이미지 공개 여부는 반드시 확인 후 공개하세요.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SelectInput label="업종" required value={form.industry} onChange={(value) => update("industry", value)} options={PORTFOLIO_INDUSTRY_OPTIONS} error={fieldErrors.industry} />
          <SelectInput label="박스 종류" required value={form.boxType} onChange={(value) => update("boxType", value)} options={PORTFOLIO_PACKAGE_TYPE_OPTIONS} error={fieldErrors.boxType} />
          <SelectInput label="패키지 구조" value={form.packageStructure} onChange={(value) => update("packageStructure", value)} options={PORTFOLIO_STRUCTURE_OPTIONS} error={fieldErrors.packageStructure} />
          <SelectInput label="제작 목적" value={form.casePurpose} onChange={(value) => update("casePurpose", value)} options={PORTFOLIO_PURPOSE_OPTIONS} error={fieldErrors.casePurpose} />
          <TextInput label="제품명" value={form.productName} onChange={(value) => update("productName", value)} error={fieldErrors.productName} />
          <TextInput
            label="고객사명"
            value={form.clientName}
            onChange={(value) => update("clientName", value)}
            error={fieldErrors.clientName}
            helper="고객사명은 공개 허용된 경우에만 노출하세요."
          />
          <label className="flex items-center gap-3 rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={form.isClientNamePublic}
              onChange={(event) => update("isClientNamePublic", event.target.checked)}
              className="h-4 w-4 rounded border-line text-ink"
            />
            고객사명 공개 여부
          </label>
          <SelectInput label="제작 수량" value={form.quantityRange} onChange={(value) => update("quantityRange", value)} options={QUANTITY_RANGE_OPTIONS} error={fieldErrors.quantityRange} />
          <TextInput label="가로 mm" type="number" value={form.widthMm} onChange={(value) => update("widthMm", value)} error={fieldErrors.widthMm} />
          <TextInput label="세로 mm" type="number" value={form.depthMm} onChange={(value) => update("depthMm", value)} error={fieldErrors.depthMm} />
          <TextInput label="높이 mm" type="number" value={form.heightMm} onChange={(value) => update("heightMm", value)} error={fieldErrors.heightMm} />
          <TextInput label="사용 지류" value={form.paperType} onChange={(value) => update("paperType", value)} error={fieldErrors.paperType} />
          <TextInput label="보드 두께" value={form.boardThickness} onChange={(value) => update("boardThickness", value)} error={fieldErrors.boardThickness} />
          <SelectInput label="인쇄 사양" value={form.printOption} onChange={(value) => update("printOption", value)} options={PRINT_OPTION_OPTIONS} error={fieldErrors.printOption} />
        </div>

        <div className="mt-5">
          <p className="label-base">후가공</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FINISHING_OPTION_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={form.finishingOptions.includes(option)}
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
        <h2 className="text-lg font-bold text-ink">이미지</h2>
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          고객사명, 제품명, 이미지 공개 여부는 반드시 확인 후 공개하세요.
        </p>
        <div className="mt-5 grid gap-5">
          <div className="rounded-md border border-line bg-paper p-4">
            <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-start">
              <PortfolioCaseImage
                src={form.mainImageUrl}
                alt={form.mainImageAlt || form.title || "제작 사례 대표 이미지"}
              />
              <div>
                <label className="block">
                  <span className="label-base">대표 이미지 업로드</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isImageUploading}
                    onChange={(event) => {
                      const input = event.currentTarget;
                      const file = input.files?.[0] ?? null;
                      void uploadMainImage(file).finally(() => {
                        input.value = "";
                      });
                    }}
                    className="mt-2 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-charcoal file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-bold file:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  JPG, PNG, WebP 파일을 업로드할 수 있습니다. 최대 5MB까지 지원합니다.
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  업로드만으로 제작 사례가 저장되지는 않습니다. 업로드 완료 후 하단 저장 버튼을 눌러 주세요.
                </p>
                {isImageUploading ? <p className="mt-2 text-sm font-semibold text-brass">업로드 중...</p> : null}
                {imageUploadMessage ? <p className="mt-2 text-sm font-semibold text-emerald-700">{imageUploadMessage}</p> : null}
                {imageUploadResult ? (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
                    <p className="font-bold">웹용 이미지 최적화 결과</p>
                    <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                      {originalUploadSizeLabel ? (
                        <>
                          <dt className="font-semibold">원본 용량</dt>
                          <dd>{originalUploadSizeLabel}</dd>
                        </>
                      ) : null}
                      {optimizedUploadSizeLabel ? (
                        <>
                          <dt className="font-semibold">최적화 후 용량</dt>
                          <dd>{optimizedUploadSizeLabel}</dd>
                        </>
                      ) : null}
                      {imageUploadResult.width && imageUploadResult.height ? (
                        <>
                          <dt className="font-semibold">이미지 크기</dt>
                          <dd>
                            {imageUploadResult.width} × {imageUploadResult.height}px
                          </dd>
                        </>
                      ) : null}
                      {imageUploadResult.format ? (
                        <>
                          <dt className="font-semibold">저장 포맷</dt>
                          <dd>{imageUploadResult.format.toUpperCase()}</dd>
                        </>
                      ) : null}
                    </dl>
                  </div>
                ) : null}
                {imageUploadError ? <p className="mt-2 text-sm font-semibold text-red-700">{imageUploadError}</p> : null}
              </div>
            </div>
          </div>
          <TextInput label="대표 이미지 URL" value={form.mainImageUrl} onChange={(value) => update("mainImageUrl", value)} error={fieldErrors.mainImageUrl} />
          <TextInput
            label="대표 이미지 대체 텍스트"
            value={form.mainImageAlt}
            onChange={(value) => update("mainImageAlt", value)}
            error={fieldErrors.mainImageAlt}
            helper="이미지가 보이지 않거나 검색엔진이 이미지를 이해할 때 사용됩니다."
          />
          <TextArea
            label="이미지 설명"
            rows={3}
            value={form.imageCaption}
            onChange={(value) => update("imageCaption", value)}
            error={fieldErrors.imageCaption}
            helper="이미지가 보이지 않거나 검색엔진이 이미지를 이해할 때 사용됩니다."
          />
          <TextArea
            label="추가 이미지 URL 목록"
            rows={4}
            value={form.imageUrlsText}
            onChange={(value) => update("imageUrlsText", value)}
            placeholder="한 줄에 하나씩 입력하세요."
            error={fieldErrors.imageUrls}
          />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">공개 콘텐츠</h2>
        <div className="mt-5 grid gap-5">
          <TextArea label="짧은 설명" required rows={3} value={form.shortDescription} onChange={(value) => update("shortDescription", value)} error={fieldErrors.shortDescription} />
          <TextArea label="프로젝트 개요" rows={6} value={form.projectOverview} onChange={(value) => update("projectOverview", value)} error={fieldErrors.projectOverview} />
          <TextArea label="제작 포인트" rows={6} value={form.productionPoint} onChange={(value) => update("productionPoint", value)} error={fieldErrors.productionPoint} />
          <TextArea label="사양 요약" rows={6} value={form.specificationSummary} onChange={(value) => update("specificationSummary", value)} error={fieldErrors.specificationSummary} />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">공개 승인 확인</h2>
        <label className="mt-4 flex items-start gap-3 rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold leading-6 text-ink">
          <input
            type="checkbox"
            checked={form.publicApprovalConfirmed}
            onChange={(event) => update("publicApprovalConfirmed", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-line text-ink"
          />
          <span>고객사명, 제품 정보, 이미지, 제작 사양의 공개 가능 여부를 확인했습니다.</span>
        </label>
        {fieldErrors.publicApprovalConfirmed ? (
          <p className="mt-1.5 text-sm text-red-700">{fieldErrors.publicApprovalConfirmed}</p>
        ) : null}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextArea
            label="공개 승인 메모"
            rows={4}
            value={form.publicApprovalMemo}
            onChange={(value) => update("publicApprovalMemo", value)}
            placeholder="예: 고객사명 비공개 조건으로 공개 가능 / 제품명 제외 후 공개 가능"
            error={fieldErrors.publicApprovalMemo}
          />
          <TextInput
            label="공개 확인자"
            value={form.publicApprovalBy}
            onChange={(value) => update("publicApprovalBy", value)}
            placeholder="예: 관리자, 담당자명"
            error={fieldErrors.publicApprovalBy}
          />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">SEO</h2>
        <div className="mt-5 grid gap-5">
          <TextInput label="SEO 제목" value={form.seoTitle} onChange={(value) => update("seoTitle", value)} error={fieldErrors.seoTitle} />
          <TextArea label="SEO 설명" rows={3} value={form.seoDescription} onChange={(value) => update("seoDescription", value)} error={fieldErrors.seoDescription} />
          <TextArea
            label="태그"
            rows={3}
            value={form.tagsText}
            onChange={(value) => update("tagsText", value)}
            placeholder="쉼표 또는 줄바꿈으로 구분하세요."
            error={fieldErrors.tags}
          />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">SEO 미리보기</h2>
        <div className="mt-4 rounded-lg border border-line bg-paper p-4">
          <p className="text-base font-semibold text-blue-700">{seoPreview.title}</p>
          <p className="mt-1 text-sm text-emerald-700">/portfolio/{seoPreview.slug || "slug"}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{seoPreview.description || "SEO 설명 또는 짧은 설명이 표시됩니다."}</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {seoChecklist.map((item) => (
            <div
              key={item.key}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                item.passed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {item.passed ? "통과" : "확인 필요"} · {item.label}
            </div>
          ))}
        </div>
        {seoPreview.titleWarning ? <p className="mt-4 text-sm leading-6 text-amber-700">{seoPreview.titleWarning}</p> : null}
        {seoPreview.descriptionWarning ? <p className="mt-2 text-sm leading-6 text-amber-700">{seoPreview.descriptionWarning}</p> : null}
      </section>

      <div className="sticky bottom-0 z-20 flex flex-col gap-2 border-t border-line bg-paper/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/portfolio")}
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ink"
        >
          취소
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleDelete}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            삭제
          </button>
        ) : null}
        {mode === "edit" ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => save("archive")}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            보관
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-ink bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => save("publish")}
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === "create" ? "저장 후 공개" : "공개"}
        </button>
      </div>
    </form>
  );
}
