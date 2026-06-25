import type { PortfolioCase } from "@prisma/client";
import type { PortfolioSeoStatus } from "./portfolio-options";
import { parseStringList } from "./portfolio-utils";

export type PortfolioSeoCase = Pick<
  PortfolioCase,
  | "title"
  | "slug"
  | "industry"
  | "boxType"
  | "mainImageUrl"
  | "mainImageAlt"
  | "shortDescription"
  | "productionPoint"
  | "specificationSummary"
  | "seoTitle"
  | "seoDescription"
  | "tags"
>;

export type PortfolioSeoChecklistItem = {
  key: string;
  label: string;
  passed: boolean;
  required?: boolean;
};

export type PortfolioSeoPreview = {
  title: string;
  slug: string;
  description: string;
  titleWarning?: string;
  descriptionWarning?: string;
};

function lengthWithoutSpaces(value: string) {
  return value.replace(/\s/g, "").length;
}

export function getPortfolioSeoChecklist(caseItem: PortfolioSeoCase): PortfolioSeoChecklistItem[] {
  const tags = parseStringList(caseItem.tags);
  const hasMainImageOrPlaceholder = true;
  const hasImageAlt = !caseItem.mainImageUrl || Boolean(caseItem.mainImageAlt?.trim());

  return [
    { key: "seoTitle", label: "SEO 제목 있음", passed: Boolean(caseItem.seoTitle?.trim()), required: true },
    { key: "seoDescription", label: "SEO 설명 있음", passed: Boolean(caseItem.seoDescription?.trim()), required: true },
    { key: "slug", label: "슬러그 있음", passed: Boolean(caseItem.slug?.trim()), required: true },
    { key: "shortDescription", label: "짧은 설명 있음", passed: Boolean(caseItem.shortDescription?.trim()), required: true },
    { key: "image", label: "대표 이미지 또는 placeholder 준비", passed: hasMainImageOrPlaceholder },
    { key: "imageAlt", label: "대표 이미지 alt 문구 있음", passed: hasImageAlt },
    { key: "tags", label: "태그 2개 이상", passed: tags.length >= 2 },
    { key: "industry", label: "업종 있음", passed: Boolean(caseItem.industry?.trim()), required: true },
    { key: "boxType", label: "박스 종류 있음", passed: Boolean(caseItem.boxType?.trim()), required: true },
    { key: "productionPoint", label: "제작 포인트 있음", passed: Boolean(caseItem.productionPoint?.trim()) },
    { key: "specificationSummary", label: "사양 요약 있음", passed: Boolean(caseItem.specificationSummary?.trim()) }
  ];
}

export function getPortfolioSeoStatus(caseItem: PortfolioSeoCase): PortfolioSeoStatus {
  const checklist = getPortfolioSeoChecklist(caseItem);

  if (checklist.some((item) => item.required && !item.passed)) {
    return "MISSING_REQUIRED";
  }

  if (checklist.some((item) => !item.passed)) {
    return "NEEDS_WORK";
  }

  return "GOOD";
}

export function getPortfolioSeoPreview(caseItem: PortfolioSeoCase): PortfolioSeoPreview {
  const title = caseItem.seoTitle?.trim() || `${caseItem.title} | 페르패키지`;
  const description = caseItem.seoDescription?.trim() || caseItem.shortDescription;
  const titleLength = lengthWithoutSpaces(title);
  const descriptionLength = lengthWithoutSpaces(description);

  return {
    title,
    slug: caseItem.slug,
    description,
    titleWarning:
      titleLength < 15 || titleLength > 35
        ? "SEO 제목은 15~35자 정도를 권장합니다. 너무 길면 검색 결과에서 잘릴 수 있습니다."
        : undefined,
    descriptionWarning:
      descriptionLength < 40 || descriptionLength > 90
        ? "SEO 설명은 40~90자 정도를 권장합니다. 검색 의도와 제작 상담 내용을 자연스럽게 넣어주세요."
        : undefined
  };
}
