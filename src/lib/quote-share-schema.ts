import { z } from "zod";

export const QUOTE_SHARE_LINK_STATUSES = ["ACTIVE", "REVOKED", "EXPIRED"] as const;
export type QuoteShareLinkStatus = (typeof QUOTE_SHARE_LINK_STATUSES)[number];

export const QUOTE_SHARE_LINK_STATUS_LABELS: Record<QuoteShareLinkStatus, string> = {
  ACTIVE: "활성",
  REVOKED: "폐기",
  EXPIRED: "만료"
};

export const QUOTE_CUSTOMER_RESPONSE_TYPES = ["ACCEPTED", "REJECTED", "REVISION_REQUESTED"] as const;
export type QuoteCustomerResponseType = (typeof QUOTE_CUSTOMER_RESPONSE_TYPES)[number];

export const QUOTE_CUSTOMER_RESPONSE_LABELS: Record<QuoteCustomerResponseType, string> = {
  ACCEPTED: "수락",
  REJECTED: "거절",
  REVISION_REQUESTED: "수정 요청"
};

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const booleanFromForm = z.preprocess((value) => {
  if (value === "on" || value === "true" || value === true) return true;
  if (value === "false" || value === false || value === undefined || value === null || value === "") return false;
  return value;
}, z.boolean());

export const quoteShareLinkCreateSchema = z.object({
  expiresInDays: z.coerce
    .number({ invalid_type_error: "만료일을 올바르게 입력해 주세요." })
    .int("만료일을 올바르게 입력해 주세요.")
    .min(1, "만료일을 올바르게 입력해 주세요.")
    .max(90, "공유 링크는 최대 90일까지만 설정할 수 있습니다.")
    .default(14),
  regenerate: booleanFromForm.optional().default(false)
});

export const quoteShareCustomerResponseSchema = z.object({
  responseType: z.enum(QUOTE_CUSTOMER_RESPONSE_TYPES, {
    required_error: "응답 유형을 선택해 주세요.",
    invalid_type_error: "응답 유형을 선택해 주세요."
  }),
  responderName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(50, "담당자명은 50자 이하로 입력해 주세요.").optional()
  ),
  message: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000, "메시지는 1,000자 이하로 입력해 주세요.").optional()
  )
});

export type QuoteShareLinkCreateInput = z.infer<typeof quoteShareLinkCreateSchema>;
export type QuoteShareCustomerResponseInput = z.infer<typeof quoteShareCustomerResponseSchema>;
export type QuoteShareCustomerResponseFieldErrors = Partial<Record<keyof QuoteShareCustomerResponseInput, string>>;

export function isQuoteCustomerResponseType(value: string | null | undefined): value is QuoteCustomerResponseType {
  return QUOTE_CUSTOMER_RESPONSE_TYPES.includes(value as QuoteCustomerResponseType);
}

export function isQuoteShareLinkStatus(value: string | null | undefined): value is QuoteShareLinkStatus {
  return QUOTE_SHARE_LINK_STATUSES.includes(value as QuoteShareLinkStatus);
}

export function toQuoteShareCustomerResponseFieldErrors(
  error: z.ZodError
): QuoteShareCustomerResponseFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as QuoteShareCustomerResponseFieldErrors;
}
