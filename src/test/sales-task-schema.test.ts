import { describe, expect, it } from "vitest";
import { salesTaskPatchSchema, salesTaskSchema } from "@/lib/sales-task-schema";

describe("salesTaskSchema", () => {
  it("accepts a valid sales task", () => {
    const parsed = salesTaskSchema.safeParse({
      title: "김민수 후속 연락",
      description: "샘플 일정 확인",
      type: "FOLLOW_UP",
      priority: "NORMAL",
      status: "TODO",
      dueAt: "2026-06-20T09:00:00.000Z",
      leadId: "lead_1",
      quoteProposalId: "",
      assignedTo: "admin"
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.quoteProposalId).toBeUndefined();
      expect(parsed.data.dueAt).toBeInstanceOf(Date);
    }
  });

  it("rejects missing title and invalid task values", () => {
    const parsed = salesTaskSchema.safeParse({
      title: "",
      type: "UNKNOWN",
      priority: "NORMAL",
      status: "TODO"
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      expect(flattened.title?.[0]).toContain("업무 제목");
      expect(flattened.type?.[0]).toBeTruthy();
    }
  });

  it("allows partial patch payloads", () => {
    const parsed = salesTaskPatchSchema.safeParse({ status: "DONE" });

    expect(parsed.success).toBe(true);
  });
});
