import { z } from "zod";

export const SALES_TASK_TYPES = [
  "FOLLOW_UP",
  "QUOTE_PREP",
  "REVISION_REVIEW",
  "QUOTE_SHARE",
  "CUSTOMER_RESPONSE",
  "SHARE_LINK_EXPIRY",
  "GENERAL"
] as const;

export const SALES_TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const SALES_TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

export type SalesTaskType = (typeof SALES_TASK_TYPES)[number];
export type SalesTaskPriority = (typeof SALES_TASK_PRIORITIES)[number];
export type SalesTaskStatus = (typeof SALES_TASK_STATUSES)[number];

export const SALES_TASK_TYPE_LABELS: Record<SalesTaskType, string> = {
  FOLLOW_UP: "후속 연락",
  QUOTE_PREP: "견적안 작성",
  REVISION_REVIEW: "수정 요청 검토",
  QUOTE_SHARE: "견적안 공유",
  CUSTOMER_RESPONSE: "고객 응답 확인",
  SHARE_LINK_EXPIRY: "공유 링크 만료 확인",
  GENERAL: "일반 업무"
};

export const SALES_TASK_PRIORITY_LABELS: Record<SalesTaskPriority, string> = {
  LOW: "낮음",
  NORMAL: "보통",
  HIGH: "높음",
  URGENT: "긴급"
};

export const SALES_TASK_STATUS_LABELS: Record<SalesTaskStatus, string> = {
  TODO: "예정",
  IN_PROGRESS: "진행중",
  DONE: "완료",
  CANCELLED: "취소"
};

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalText = (max: number, message: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, message).optional());

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const salesTaskSchema = z.object({
  leadId: optionalText(100, "연결 리드 ID는 100자 이하로 입력해 주세요."),
  quoteProposalId: optionalText(100, "연결 견적안 ID는 100자 이하로 입력해 주세요."),
  title: z.string().trim().min(1, "업무 제목을 입력해 주세요.").max(200, "업무 제목은 200자 이하로 입력해 주세요."),
  description: optionalText(2000, "업무 설명은 2,000자 이하로 입력해 주세요."),
  type: z.enum(SALES_TASK_TYPES, {
    required_error: "업무 유형을 선택해 주세요.",
    invalid_type_error: "올바르지 않은 업무 유형입니다."
  }),
  priority: z.enum(SALES_TASK_PRIORITIES, {
    required_error: "우선순위를 선택해 주세요.",
    invalid_type_error: "올바르지 않은 우선순위입니다."
  }),
  status: z.enum(SALES_TASK_STATUSES, {
    required_error: "업무 상태를 선택해 주세요.",
    invalid_type_error: "올바르지 않은 업무 상태입니다."
  }),
  dueAt: optionalDate,
  assignedTo: optionalText(100, "담당자는 100자 이하로 입력해 주세요."),
  sourceType: optionalText(100, "업무 출처 유형은 100자 이하로 입력해 주세요."),
  sourceId: optionalText(200, "업무 출처 ID는 200자 이하로 입력해 주세요.")
});

export const salesTaskPatchSchema = salesTaskSchema.partial().extend({
  status: z
    .enum(SALES_TASK_STATUSES, {
      invalid_type_error: "올바르지 않은 업무 상태입니다."
    })
    .optional()
});

export type SalesTaskInput = z.infer<typeof salesTaskSchema>;
export type SalesTaskPatchInput = z.infer<typeof salesTaskPatchSchema>;
export type SalesTaskFieldErrors = Partial<Record<keyof SalesTaskInput, string>>;

export function toSalesTaskFieldErrors(error: z.ZodError): SalesTaskFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as SalesTaskFieldErrors;
}
