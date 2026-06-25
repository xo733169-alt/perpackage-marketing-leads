import { z } from "zod";
import { BOX_TYPE_OPTIONS, QUANTITY_RANGE_OPTIONS } from "./lead-options";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const booleanFromForm = z.preprocess((value) => {
  if (value === "on" || value === "true" || value === true) return true;
  if (value === "false" || value === false || value === undefined || value === null || value === "") return false;
  return value;
}, z.boolean());

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int("정수로 입력해 주세요.").min(0, "0 이상으로 입력해 주세요.").optional()
);

const requiredInt = (message: string) =>
  z.coerce
    .number({
      required_error: message,
      invalid_type_error: "숫자로 입력해 주세요."
    })
    .int("정수로 입력해 주세요.")
    .min(0, "0 이상으로 입력해 주세요.");

const requiredFloat = (message: string) =>
  z.coerce
    .number({
      required_error: message,
      invalid_type_error: "숫자로 입력해 주세요."
    })
    .min(0, "0 이상으로 입력해 주세요.")
    .max(10, "10 이하로 입력해 주세요.");

export const quoteRuleSchema = z
  .object({
    name: z.string().trim().min(1, "룰 이름을 입력해 주세요.").max(140, "룰 이름은 140자 이하로 입력해 주세요."),
    isActive: booleanFromForm.optional().default(true),
    boxType: z.preprocess(
      emptyToUndefined,
      z.enum(BOX_TYPE_OPTIONS, {
        required_error: "박스 종류를 선택해 주세요.",
        invalid_type_error: "박스 종류를 선택해 주세요."
      })
    ),
    quantityRange: z.preprocess(
      emptyToUndefined,
      z.enum(QUANTITY_RANGE_OPTIONS, {
        required_error: "수량 구간을 선택해 주세요.",
        invalid_type_error: "수량 구간을 선택해 주세요."
      })
    ),
    minQuantity: optionalInt,
    maxQuantity: optionalInt,
    baseUnitPriceMinKrw: requiredInt("기본 단가 범위를 입력해 주세요."),
    baseUnitPriceMaxKrw: requiredInt("기본 단가 범위를 입력해 주세요."),
    sizeSmallThreshold: requiredInt("소형 기준값을 입력해 주세요."),
    sizeMediumThreshold: requiredInt("중형 기준값을 입력해 주세요."),
    sizeLargeThreshold: requiredInt("대형 기준값을 입력해 주세요."),
    smallSizeMultiplier: requiredFloat("소형 배율을 입력해 주세요."),
    mediumSizeMultiplier: requiredFloat("중형 배율을 입력해 주세요."),
    largeSizeMultiplier: requiredFloat("대형 배율을 입력해 주세요."),
    extraLargeSizeMultiplier: requiredFloat("초대형 배율을 입력해 주세요."),
    printNoneMultiplier: requiredFloat("무지 인쇄 배율을 입력해 주세요."),
    printOneColorMultiplier: requiredFloat("단색 인쇄 배율을 입력해 주세요."),
    printFullColorMultiplier: requiredFloat("4도 인쇄 배율을 입력해 주세요."),
    printFoilEmbossMultiplier: requiredFloat("박/형압 포함 배율을 입력해 주세요."),
    finishingBaseAddMinKrw: requiredInt("후가공 추가 최소 금액을 입력해 주세요."),
    finishingBaseAddMaxKrw: requiredInt("후가공 추가 최대 금액을 입력해 주세요."),
    complexityLowMultiplier: requiredFloat("낮은 난이도 배율을 입력해 주세요."),
    complexityNormalMultiplier: requiredFloat("보통 난이도 배율을 입력해 주세요."),
    complexityHighMultiplier: requiredFloat("높은 난이도 배율을 입력해 주세요."),
    complexityVeryHighMultiplier: requiredFloat("매우 높은 난이도 배율을 입력해 주세요."),
    minOrderPriceKrw: requiredInt("최소 주문 금액을 입력해 주세요."),
    notes: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(2000, "메모는 2000자 이하로 입력해 주세요.").optional()
    )
  })
  .superRefine((data, context) => {
    if (data.baseUnitPriceMinKrw > data.baseUnitPriceMaxKrw) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseUnitPriceMinKrw"],
        message: "최소 단가는 최대 단가보다 클 수 없습니다."
      });
    }

    if (data.finishingBaseAddMinKrw > data.finishingBaseAddMaxKrw) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finishingBaseAddMinKrw"],
        message: "후가공 추가 최소 금액은 최대 금액보다 클 수 없습니다."
      });
    }

    if (data.maxQuantity !== undefined && data.minQuantity !== undefined && data.minQuantity > data.maxQuantity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minQuantity"],
        message: "최소 수량은 최대 수량보다 클 수 없습니다."
      });
    }

    if (data.sizeSmallThreshold > data.sizeMediumThreshold || data.sizeMediumThreshold > data.sizeLargeThreshold) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizeSmallThreshold"],
        message: "사이즈 기준값은 소형, 중형, 대형 순서로 커져야 합니다."
      });
    }
  });

export type QuoteRuleInput = z.infer<typeof quoteRuleSchema>;

export type QuoteRuleFieldErrors = Partial<Record<keyof QuoteRuleInput, string>>;

export function toQuoteRuleFieldErrors(error: z.ZodError<QuoteRuleInput>): QuoteRuleFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as QuoteRuleFieldErrors;
}
