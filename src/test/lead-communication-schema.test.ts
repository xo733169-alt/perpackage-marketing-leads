import { describe, expect, it } from "vitest";
import { leadCommunicationSchema, shouldUpdateLeadFollowUp } from "@/lib/lead-communication-schema";

describe("leadCommunicationSchema", () => {
  it("accepts a valid communication log", () => {
    const result = leadCommunicationSchema.safeParse({
      channel: "KAKAO",
      direction: "OUTBOUND",
      summary: "추가 사양 요청",
      detail: "사이즈와 후가공 여부를 확인 요청함",
      contactedAt: "2026-06-20T10:00:00",
      nextFollowUpAt: "2026-06-21T10:00:00"
    });

    expect(result.success).toBe(true);
  });

  it("requires summary, channel, direction, and contacted date", () => {
    const result = leadCommunicationSchema.safeParse({
      channel: "INVALID",
      direction: "INVALID",
      summary: "",
      contactedAt: "not-a-date"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.summary?.[0]).toBe("상담 요약을 입력해 주세요.");
      expect(result.error.flatten().fieldErrors.channel?.[0]).toBeDefined();
      expect(result.error.flatten().fieldErrors.direction?.[0]).toBeDefined();
      expect(result.error.flatten().fieldErrors.contactedAt?.[0]).toBeDefined();
    }
  });

  it("updates lead follow-up only when the new date is earlier or missing current value", () => {
    const current = new Date("2026-06-22T10:00:00");

    expect(shouldUpdateLeadFollowUp(null, new Date("2026-06-23T10:00:00"))).toBe(true);
    expect(shouldUpdateLeadFollowUp(current, new Date("2026-06-21T10:00:00"))).toBe(true);
    expect(shouldUpdateLeadFollowUp(current, new Date("2026-06-23T10:00:00"))).toBe(false);
    expect(shouldUpdateLeadFollowUp(current, null)).toBe(false);
  });
});
