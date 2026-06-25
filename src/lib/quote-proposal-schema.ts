import { z } from "zod";

export const QUOTE_PROPOSAL_STATUSES = [
  "DRAFT",
  "READY_TO_SEND",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "SUPERSEDED"
] as const;

export type QuoteProposalStatus = (typeof QUOTE_PROPOSAL_STATUSES)[number];

export const QUOTE_PROPOSAL_STATUS_LABELS: Record<QuoteProposalStatus, string> = {
  DRAFT: "임시작성",
  READY_TO_SEND: "발송준비",
  SENT: "발송완료",
  ACCEPTED: "수락",
  REJECTED: "거절",
  EXPIRED: "만료",
  CANCELLED: "취소",
  SUPERSEDED: "대체됨"
};

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalText = (max = 2000) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, `최대 ${max}자까지 입력할 수 있습니다.`).optional());

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int("정수로 입력해 주세요.").min(0, "0 이상으로 입력해 주세요.").optional()
);

const booleanFromForm = z.preprocess((value) => {
  if (value === "on" || value === "true" || value === true) return true;
  if (value === "false" || value === false || value === undefined || value === null || value === "") return false;
  return value;
}, z.boolean());

export const quoteProposalItemSchema = z.object({
  id: optionalText(80),
  sortOrder: optionalInt.default(0),
  itemName: z.string().trim().min(1, "항목명을 입력해 주세요.").max(160, "항목명은 160자 이하로 입력해 주세요."),
  description: optionalText(1000),
  quantity: z.coerce
    .number({ invalid_type_error: "수량은 1 이상이어야 합니다." })
    .int("수량은 정수로 입력해 주세요.")
    .min(1, "수량은 1 이상이어야 합니다."),
  unitPriceKrw: z.coerce
    .number({ invalid_type_error: "단가는 0원 이상이어야 합니다." })
    .int("단가는 정수로 입력해 주세요.")
    .min(0, "단가는 0원 이상이어야 합니다.")
});

export const quoteProposalSchema = z.object({
  leadId: optionalText(80),
  status: z.enum(QUOTE_PROPOSAL_STATUSES, {
    required_error: "올바르지 않은 상태값입니다.",
    invalid_type_error: "올바르지 않은 상태값입니다."
  }),
  title: z.string().trim().min(1, "견적안 제목을 입력해 주세요.").max(160, "견적안 제목은 160자 이하로 입력해 주세요."),
  customerNameSnapshot: z.string().trim().min(1, "고객명을 입력해 주세요.").max(120),
  companyNameSnapshot: optionalText(120),
  phoneSnapshot: optionalText(80),
  emailSnapshot: optionalText(160),
  kakaoIdSnapshot: optionalText(120),
  boxType: z.string().trim().min(1, "박스 종류를 입력해 주세요.").max(120),
  industry: z.string().trim().min(1, "업종을 입력해 주세요.").max(120),
  quantityLabel: optionalText(120),
  quantityCount: optionalInt,
  specificationSummary: optionalText(3000),
  productionNotes: optionalText(3000),
  deliveryEstimateText: optionalText(1000),
  paymentTerms: optionalText(1000),
  validUntil: optionalDate,
  vatIncluded: booleanFromForm.optional().default(false),
  customerMessage: optionalText(3000),
  internalMemo: optionalText(3000),
  basedOnEstimateLabel: optionalText(1000),
  basedOnUnitPriceMinKrw: optionalInt,
  basedOnUnitPriceMaxKrw: optionalInt,
  basedOnTotalPriceMinKrw: optionalInt,
  basedOnTotalPriceMaxKrw: optionalInt,
  items: z.array(quoteProposalItemSchema).min(1, "견적 항목을 1개 이상 입력해 주세요.")
});

export const quoteProposalStatusUpdateSchema = z.object({
  status: z.enum(QUOTE_PROPOSAL_STATUSES, {
    required_error: "올바르지 않은 상태값입니다.",
    invalid_type_error: "올바르지 않은 상태값입니다."
  })
});

export type QuoteProposalInput = z.infer<typeof quoteProposalSchema>;
export type QuoteProposalItemInput = z.infer<typeof quoteProposalItemSchema>;
export type QuoteProposalFieldErrors = Partial<Record<keyof QuoteProposalInput, string>>;

export function isQuoteProposalStatus(value: string | null | undefined): value is QuoteProposalStatus {
  return QUOTE_PROPOSAL_STATUSES.includes(value as QuoteProposalStatus);
}

export function toQuoteProposalFieldErrors(error: z.ZodError): QuoteProposalFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as QuoteProposalFieldErrors;
}
