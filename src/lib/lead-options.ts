export const INDUSTRY_OPTIONS = [
  "화장품",
  "건강기능식품",
  "식품",
  "의류",
  "주얼리",
  "생활용품",
  "선물세트",
  "기타"
] as const;

export const BOX_TYPE_OPTIONS = [
  "싸바리박스",
  "자석박스",
  "상하짝박스",
  "서랍형박스",
  "단상자",
  "아직 모르겠음",
  "기타"
] as const;

export const QUANTITY_RANGE_OPTIONS = [
  "100개 이하",
  "100~300개",
  "300~500개",
  "500~1000개",
  "1000개 이상",
  "아직 미정"
] as const;

export const PRINT_OPTION_OPTIONS = [
  "무지",
  "단색 인쇄",
  "4도 인쇄",
  "박/형압 포함",
  "아직 미정"
] as const;

export const FINISHING_OPTION_OPTIONS = [
  "무광코팅",
  "유광코팅",
  "금박",
  "은박",
  "형압",
  "자석",
  "리본",
  "스펀지",
  "PET창",
  "칸막이",
  "기타"
] as const;

export const BUDGET_RANGE_OPTIONS = [
  "아직 미정",
  "50만원 이하",
  "50~100만원",
  "100만원 이하",
  "100~300만원",
  "300~500만원",
  "300만원 이상",
  "500만원 이상"
] as const;

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTING",
  "QUOTED",
  "ORDER_CONFIRMED",
  "ON_HOLD",
  "CLOSED"
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "신규문의",
  CONTACTING: "상담중",
  QUOTED: "견적완료",
  ORDER_CONFIRMED: "주문확정",
  ON_HOLD: "보류",
  CLOSED: "종료"
};

export function isLeadStatus(value: string | null | undefined): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}
