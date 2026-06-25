export const QUOTE_ACTIVITY_TYPES = [
  "PROPOSAL_CREATED",
  "PROPOSAL_UPDATED",
  "PROPOSAL_REVISION_CREATED",
  "PROPOSAL_STATUS_CHANGED",
  "SHARE_LINK_CREATED",
  "SHARE_LINK_REVOKED",
  "SHARE_LINK_VIEWED",
  "CUSTOMER_ACCEPTED",
  "CUSTOMER_REJECTED",
  "CUSTOMER_REVISION_REQUESTED",
  "COMMUNICATION_LOG_CREATED",
  "COMMUNICATION_LOG_UPDATED",
  "COMMUNICATION_LOG_DELETED"
] as const;

export type QuoteActivityType = (typeof QUOTE_ACTIVITY_TYPES)[number];

export const QUOTE_ACTIVITY_TYPE_LABELS: Record<QuoteActivityType, string> = {
  PROPOSAL_CREATED: "견적안 생성",
  PROPOSAL_UPDATED: "견적안 수정",
  PROPOSAL_REVISION_CREATED: "수정 견적안 생성",
  PROPOSAL_STATUS_CHANGED: "상태 변경",
  SHARE_LINK_CREATED: "공유 링크 생성",
  SHARE_LINK_REVOKED: "공유 링크 폐기",
  SHARE_LINK_VIEWED: "견적안 확인",
  CUSTOMER_ACCEPTED: "고객 수락",
  CUSTOMER_REJECTED: "고객 거절",
  CUSTOMER_REVISION_REQUESTED: "고객 수정 요청",
  COMMUNICATION_LOG_CREATED: "상담 이력 생성",
  COMMUNICATION_LOG_UPDATED: "상담 이력 수정",
  COMMUNICATION_LOG_DELETED: "상담 이력 삭제"
};

export const QUOTE_ACTIVITY_ACTOR_LABELS: Record<string, string> = {
  admin: "관리자",
  customer: "고객",
  system: "시스템"
};

export function stringifyActivityMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  return JSON.stringify(metadata);
}

export function getCustomerResponseActivityType(responseType: string): QuoteActivityType {
  if (responseType === "ACCEPTED") return "CUSTOMER_ACCEPTED";
  if (responseType === "REJECTED") return "CUSTOMER_REJECTED";
  return "CUSTOMER_REVISION_REQUESTED";
}

export function getCustomerResponseActivityMessage(responseType: string): string {
  if (responseType === "ACCEPTED") return "고객이 견적안을 수락했습니다.";
  if (responseType === "REJECTED") return "고객이 견적안을 거절했습니다.";
  return "고객이 수정 요청을 남겼습니다.";
}
