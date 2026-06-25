export const PORTFOLIO_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number];

export const PORTFOLIO_STATUS_LABELS: Record<PortfolioStatus, string> = {
  DRAFT: "임시저장",
  PUBLISHED: "공개",
  ARCHIVED: "보관"
};

export const PORTFOLIO_SEO_STATUSES = ["GOOD", "NEEDS_WORK", "MISSING_REQUIRED"] as const;

export type PortfolioSeoStatus = (typeof PORTFOLIO_SEO_STATUSES)[number];

export const PORTFOLIO_SEO_STATUS_LABELS: Record<PortfolioSeoStatus, string> = {
  GOOD: "좋음",
  NEEDS_WORK: "보완필요",
  MISSING_REQUIRED: "필수누락"
};

export const PORTFOLIO_PACKAGE_TYPE_OPTIONS = [
  "단상자",
  "쇼핑백",
  "싸바리박스",
  "자석박스",
  "상하짝박스",
  "서랍형박스",
  "골판지박스",
  "내부 트레이",
  "봉투/파우치",
  "스티커/라벨",
  "아직 모르겠음",
  "기타"
] as const;

export const PORTFOLIO_INDUSTRY_OPTIONS = [
  "화장품",
  "식품",
  "디저트",
  "건강식품",
  "건강기능식품",
  "굿즈",
  "의류",
  "생활용품",
  "전자제품",
  "문구/팬시",
  "주얼리",
  "선물세트",
  "기타"
] as const;

export const PORTFOLIO_STRUCTURE_OPTIONS = [
  "맞뚜껑형",
  "삼면접착형",
  "자동바닥형",
  "상하분리형",
  "서랍형",
  "슬리브형",
  "C형 무접착",
  "손잡이형",
  "기타"
] as const;

export const PORTFOLIO_PURPOSE_OPTIONS = [
  "선물용",
  "택배용",
  "매장진열",
  "박람회/행사용",
  "카카오 선물하기",
  "올리브영/입점용",
  "브랜드 런칭",
  "샘플/테스트",
  "기타"
] as const;

export const PORTFOLIO_FILTER_OPTIONS = [
  "전체",
  "싸바리박스",
  "자석박스",
  "상하짝박스",
  "서랍형박스",
  "선물세트 박스",
  "화장품 패키지",
  "건강기능식품 패키지",
  "주얼리/의류 패키지"
] as const;

export function isPortfolioStatus(value: string | null | undefined): value is PortfolioStatus {
  return PORTFOLIO_STATUSES.includes(value as PortfolioStatus);
}

export function isPortfolioSeoStatus(value: string | null | undefined): value is PortfolioSeoStatus {
  return PORTFOLIO_SEO_STATUSES.includes(value as PortfolioSeoStatus);
}
