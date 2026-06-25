import { z } from "zod";

export const MARKETING_COST_CHANNELS = [
  "네이버 검색광고",
  "카카오",
  "메타",
  "구글",
  "블로그/콘텐츠",
  "직접 입력",
  "기타"
] as const;

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalText = (max = 500) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `최대 ${max}자까지 입력할 수 있습니다.`).optional()
  );

export const marketingCostSchema = z.object({
  costDate: z
    .string({
      required_error: "비용 날짜를 입력해 주세요.",
      invalid_type_error: "비용 날짜를 입력해 주세요."
    })
    .trim()
    .min(1, "비용 날짜를 입력해 주세요.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "비용 날짜 형식을 확인해 주세요."),
  channel: z
    .string({
      required_error: "채널을 입력해 주세요.",
      invalid_type_error: "채널을 입력해 주세요."
    })
    .trim()
    .min(1, "채널을 입력해 주세요.")
    .max(80, "채널은 80자 이하로 입력해 주세요."),
  utmSource: optionalText(120),
  utmMedium: optionalText(120),
  utmCampaign: optionalText(160),
  amountKrw: z.coerce
    .number({
      required_error: "비용을 입력해 주세요.",
      invalid_type_error: "비용은 숫자로 입력해 주세요."
    })
    .int("비용은 정수로 입력해 주세요.")
    .min(0, "비용은 0원 이상으로 입력해 주세요."),
  memo: optionalText(1000)
});

export type MarketingCostInput = z.infer<typeof marketingCostSchema>;

export type MarketingCostFieldErrors = Partial<Record<keyof MarketingCostInput, string>>;

export function toMarketingCostFieldErrors(error: z.ZodError<MarketingCostInput>): MarketingCostFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as MarketingCostFieldErrors;
}

export function toMarketingCostDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}
