import { z } from "zod";

export const LEAD_COMMUNICATION_CHANNELS = [
  "PHONE",
  "KAKAO",
  "EMAIL",
  "SMS",
  "MEETING",
  "INTERNAL",
  "OTHER"
] as const;

export const LEAD_COMMUNICATION_DIRECTIONS = ["INBOUND", "OUTBOUND", "INTERNAL"] as const;

export type LeadCommunicationChannel = (typeof LEAD_COMMUNICATION_CHANNELS)[number];
export type LeadCommunicationDirection = (typeof LEAD_COMMUNICATION_DIRECTIONS)[number];

export const LEAD_COMMUNICATION_CHANNEL_LABELS: Record<LeadCommunicationChannel, string> = {
  PHONE: "전화",
  KAKAO: "카카오톡",
  EMAIL: "이메일",
  SMS: "문자",
  MEETING: "미팅",
  INTERNAL: "내부 메모",
  OTHER: "기타"
};

export const LEAD_COMMUNICATION_DIRECTION_LABELS: Record<LeadCommunicationDirection, string> = {
  INBOUND: "고객 → 페르패키지",
  OUTBOUND: "페르패키지 → 고객",
  INTERNAL: "내부 기록"
};

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalText = (max: number, message: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, message).optional());

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const leadCommunicationSchema = z.object({
  channel: z.enum(LEAD_COMMUNICATION_CHANNELS, {
    required_error: "상담 채널을 선택해 주세요.",
    invalid_type_error: "상담 채널을 선택해 주세요."
  }),
  direction: z.enum(LEAD_COMMUNICATION_DIRECTIONS, {
    required_error: "상담 방향을 선택해 주세요.",
    invalid_type_error: "상담 방향을 선택해 주세요."
  }),
  summary: z.string().trim().min(1, "상담 요약을 입력해 주세요.").max(200, "상담 요약은 200자 이하로 입력해 주세요."),
  detail: optionalText(2000, "상담 내용은 2,000자 이하로 입력해 주세요."),
  contactedAt: z.coerce.date({
    required_error: "상담 일시를 올바르게 입력해 주세요.",
    invalid_type_error: "상담 일시를 올바르게 입력해 주세요."
  }),
  nextFollowUpAt: optionalDate
});

export type LeadCommunicationInput = z.infer<typeof leadCommunicationSchema>;

export type LeadCommunicationFieldErrors = Partial<Record<keyof LeadCommunicationInput, string>>;

export function toLeadCommunicationFieldErrors(error: z.ZodError): LeadCommunicationFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as LeadCommunicationFieldErrors;
}

export function shouldUpdateLeadFollowUp(current: Date | null | undefined, candidate: Date | null | undefined) {
  if (!candidate) return false;
  if (!current) return true;
  return candidate.getTime() < current.getTime();
}
