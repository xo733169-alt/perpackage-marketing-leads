import { z } from "zod";
import {
  BOX_TYPE_OPTIONS,
  BUDGET_RANGE_OPTIONS,
  INDUSTRY_OPTIONS,
  PRINT_OPTION_OPTIONS,
  QUANTITY_RANGE_OPTIONS
} from "./lead-options";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalText = (max = 500) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `최대 ${max}자까지 입력할 수 있습니다.`).optional()
  );

const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({
      invalid_type_error: "숫자로 입력해 주세요."
    })
    .int("정수로 입력해 주세요.")
    .positive("0보다 큰 숫자로 입력해 주세요.")
    .optional()
);

const optionalDate = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "희망 납기일을 확인해 주세요.")
    .optional()
);

const optionalTrackingText = optionalText(300);

const booleanFromForm = z.preprocess((value) => {
  if (value === "on" || value === "true" || value === true) return true;
  if (value === "false" || value === false || value === undefined || value === null || value === "") return false;
  return value;
}, z.boolean());

const defaultWhenEmpty = (fallback: string) => (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return fallback;
  if (value === undefined || value === null) return fallback;
  return value;
};

const optionalStringArray = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall back to comma/newline separated text.
    }

    return trimmed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(z.string().trim().max(80, "각 항목은 80자 이하로 입력해 주세요.")).max(30, "최대 30개까지 선택할 수 있습니다."));

const optionalFlexibleChecklist = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
}, z.union([z.string().trim().max(4000, "최대 4000자까지 입력할 수 있습니다."), z.array(z.unknown()), z.record(z.unknown())]).optional());

const optionalReadinessScore = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({
      invalid_type_error: "제작 준비도 점수는 숫자로 입력해 주세요."
    })
    .int("제작 준비도 점수는 정수로 입력해 주세요.")
    .min(0, "제작 준비도 점수는 0 이상이어야 합니다.")
    .max(100, "제작 준비도 점수는 100 이하이어야 합니다.")
    .optional()
);

export const leadCreateSchema = z.object({
  customerName: z.string().trim().min(1, "고객명을 입력해 주세요.").max(80, "고객명은 80자 이하로 입력해 주세요."),
  companyName: optionalText(120),
  phone: z
    .string()
    .trim()
    .min(1, "연락처를 입력해 주세요.")
    .regex(/^[0-9+\-\s()]{7,20}$/, "연락처 형식을 확인해 주세요."),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("올바른 이메일 주소를 입력해 주세요.").optional()
  ),
  kakaoId: optionalText(80),
  industry: z.preprocess(defaultWhenEmpty("기타"), z.enum(INDUSTRY_OPTIONS)),
  boxType: z.preprocess(defaultWhenEmpty("아직 모르겠음"), z.enum(BOX_TYPE_OPTIONS)),
  widthMm: optionalNumber,
  depthMm: optionalNumber,
  heightMm: optionalNumber,
  quantityRange: z.preprocess(defaultWhenEmpty("아직 미정"), z.enum(QUANTITY_RANGE_OPTIONS)),
  printOption: z.preprocess(defaultWhenEmpty("아직 미정"), z.enum(PRINT_OPTION_OPTIONS)),
  finishingOptions: optionalStringArray.default([]),
  desiredDeliveryDate: optionalDate,
  budgetRange: z.preprocess(emptyToUndefined, z.enum(BUDGET_RANGE_OPTIONS).optional()),
  referenceNote: optionalText(1000),
  message: optionalText(2000),
  packageType: optionalText(120),
  packageStructure: optionalText(160),
  quantity: optionalText(120),
  sizeInfo: optionalText(300),
  hasPhysicalProduct: optionalText(80),
  hasDesignFile: optionalText(80),
  hasDieline: optionalText(80),
  desiredDueDate: optionalText(120),
  isUrgent: booleanFromForm.optional().default(false),
  readinessChecklist: optionalFlexibleChecklist,
  readinessScore: optionalReadinessScore,
  consultationNotes: optionalText(2000),
  privacyConsent: booleanFromForm.refine((value) => value === true, {
    message: "개인정보 수집 및 이용에 동의해 주세요."
  }),
  marketingConsent: booleanFromForm.optional().default(false),
  utmSource: optionalTrackingText,
  utmMedium: optionalTrackingText,
  utmCampaign: optionalTrackingText,
  utmTerm: optionalTrackingText,
  utmContent: optionalTrackingText,
  referrer: optionalText(1000),
  landingPath: optionalText(1000),
  sourceCaseSlug: optionalText(200),
  sourceCaseTitle: optionalText(200),
  website: optionalText(200)
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export type LeadFieldErrors = Partial<Record<keyof LeadCreateInput, string>>;

export function toFieldErrors(error: z.ZodError<LeadCreateInput>): LeadFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as LeadFieldErrors;
}
