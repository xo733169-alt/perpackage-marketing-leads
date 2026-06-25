import { z } from "zod";
import {
  FINISHING_OPTION_OPTIONS,
  PRINT_OPTION_OPTIONS,
  QUANTITY_RANGE_OPTIONS
} from "./lead-options";
import {
  PORTFOLIO_INDUSTRY_OPTIONS,
  PORTFOLIO_PACKAGE_TYPE_OPTIONS,
  PORTFOLIO_PURPOSE_OPTIONS,
  PORTFOLIO_STATUSES,
  PORTFOLIO_STRUCTURE_OPTIONS
} from "./portfolio-options";

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
    .number({ invalid_type_error: "숫자로 입력해 주세요." })
    .int("정수로 입력해 주세요.")
    .optional()
);

const optionalPositiveNumber = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ invalid_type_error: "숫자로 입력해 주세요." })
    .int("정수로 입력해 주세요.")
    .positive("0보다 큰 숫자로 입력해 주세요.")
    .optional()
);

const optionalStringArray = z.array(z.string().trim().max(500)).optional().default([]);

export const portfolioCaseSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력해 주세요.").max(140, "제목은 140자 이하로 입력해 주세요."),
    slug: z
      .string()
      .trim()
      .min(1, "슬러그를 입력해 주세요.")
      .max(160, "슬러그는 160자 이하로 입력해 주세요.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."),
    status: z.enum(PORTFOLIO_STATUSES, {
      required_error: "상태를 선택해 주세요.",
      invalid_type_error: "상태를 선택해 주세요."
    }),
    featured: z.boolean().optional().default(false),
    sortOrder: optionalNumber,
    industry: z.enum(PORTFOLIO_INDUSTRY_OPTIONS, {
      required_error: "업종을 선택해 주세요.",
      invalid_type_error: "업종을 선택해 주세요."
    }),
    boxType: z.enum(PORTFOLIO_PACKAGE_TYPE_OPTIONS, {
      required_error: "박스 종류를 선택해 주세요.",
      invalid_type_error: "박스 종류를 선택해 주세요."
    }),
    packageStructure: z.preprocess(emptyToUndefined, z.enum(PORTFOLIO_STRUCTURE_OPTIONS).optional()),
    casePurpose: z.preprocess(emptyToUndefined, z.enum(PORTFOLIO_PURPOSE_OPTIONS).optional()),
    productName: optionalText(120),
    clientName: optionalText(120),
    isClientNamePublic: z.boolean().optional().default(false),
    quantityRange: z.enum(QUANTITY_RANGE_OPTIONS).optional(),
    widthMm: optionalPositiveNumber,
    depthMm: optionalPositiveNumber,
    heightMm: optionalPositiveNumber,
    paperType: optionalText(120),
    boardThickness: optionalText(80),
    printOption: z.enum(PRINT_OPTION_OPTIONS).optional(),
    finishingOptions: z.array(z.enum(FINISHING_OPTION_OPTIONS)).optional().default([]),
    mainImageUrl: optionalText(1000),
    mainImageAlt: optionalText(160),
    imageCaption: optionalText(300),
    imageUrls: optionalStringArray,
    shortDescription: z
      .string()
      .trim()
      .min(1, "짧은 설명을 입력해 주세요.")
      .max(300, "짧은 설명은 300자 이하로 입력해 주세요."),
    projectOverview: optionalText(3000),
    productionPoint: optionalText(3000),
    specificationSummary: optionalText(3000),
    seoTitle: optionalText(160),
    seoDescription: optionalText(300),
    tags: optionalStringArray,
    publicApprovalConfirmed: z.boolean().optional().default(false),
    publicApprovalMemo: optionalText(1000),
    publicApprovalBy: optionalText(120)
  })
  .superRefine((data, context) => {
    if (data.status === "PUBLISHED" && !data.publicApprovalConfirmed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publicApprovalConfirmed"],
        message: "제작 사례를 공개하려면 공개 승인 확인이 필요합니다."
      });
    }
  });

export type PortfolioCaseInput = z.infer<typeof portfolioCaseSchema>;

export type PortfolioCaseFieldErrors = Partial<Record<keyof PortfolioCaseInput, string>>;

export function toPortfolioFieldErrors(error: z.ZodError<PortfolioCaseInput>): PortfolioCaseFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as PortfolioCaseFieldErrors;
}
