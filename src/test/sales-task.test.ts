import { describe, expect, it } from "vitest";
import {
  buildLeadFollowUpTaskCandidate,
  buildQuoteProposalTaskCandidate,
  buildRevisionRequestTaskCandidate,
  buildShareLinkExpiryTaskCandidate,
  formatTaskDueLabel,
  getTaskPriorityLabel,
  getTaskStatusLabel,
  getTaskTypeLabel,
  isTaskDue,
  isTaskOverdue,
  shouldCreateTaskFromCandidate,
  sortTasksForToday
} from "@/lib/sales-task";

const now = new Date(2026, 5, 20, 9, 0, 0);

describe("sales task helpers", () => {
  it("returns Korean labels for task values", () => {
    expect(getTaskTypeLabel("FOLLOW_UP")).toBe("후속 연락");
    expect(getTaskPriorityLabel("URGENT")).toBe("긴급");
    expect(getTaskStatusLabel("DONE")).toBe("완료");
  });

  it("detects due and overdue open tasks", () => {
    const yesterday = new Date(2026, 5, 19, 10, 0, 0);
    const today = new Date(2026, 5, 20, 18, 0, 0);

    expect(isTaskDue({ dueAt: today, status: "TODO" }, now)).toBe(true);
    expect(isTaskOverdue({ dueAt: yesterday, status: "IN_PROGRESS" }, now)).toBe(true);
    expect(isTaskDue({ dueAt: yesterday, status: "DONE" }, now)).toBe(false);
  });

  it("formats due labels", () => {
    expect(formatTaskDueLabel(null, now)).toBe("기한 없음");
    expect(formatTaskDueLabel(new Date(2026, 5, 19, 12, 0, 0), now)).toBe("기한 지남");
    expect(formatTaskDueLabel(new Date(2026, 5, 20, 12, 0, 0), now)).toBe("오늘");
    expect(formatTaskDueLabel(new Date(2026, 5, 21, 12, 0, 0), now)).toBe("내일");
  });

  it("sorts today tasks by overdue, due date, priority, and title", () => {
    const tasks = [
      { title: "B", type: "GENERAL", priority: "LOW", status: "TODO", dueAt: new Date(2026, 5, 20, 10, 0, 0) },
      { title: "A", type: "GENERAL", priority: "URGENT", status: "TODO", dueAt: new Date(2026, 5, 20, 10, 0, 0) },
      { title: "C", type: "GENERAL", priority: "NORMAL", status: "TODO", dueAt: new Date(2026, 5, 19, 10, 0, 0) }
    ];

    expect(sortTasksForToday(tasks, now).map((task) => task.title)).toEqual(["C", "A", "B"]);
  });

  it("builds lead follow-up task candidates", () => {
    const dueAt = new Date(2026, 5, 22, 9, 0, 0);
    const candidate = buildLeadFollowUpTaskCandidate(
      { id: "lead_1", customerName: "김민수", companyName: "브랜드", nextFollowUpAt: dueAt },
      now
    );

    expect(candidate.type).toBe("FOLLOW_UP");
    expect(candidate.title).toContain("김민수");
    expect(candidate.dueAt).toEqual(dueAt);
    expect(candidate.sourceType).toBe("LEAD_FOLLOW_UP");
  });

  it("builds quote-related task candidates", () => {
    const revision = buildRevisionRequestTaskCandidate(
      { id: "proposal_1", proposalNumber: "PPQ-20260620-0001", leadId: "lead_1" },
      { id: "response_1", message: "수량 수정 요청", createdAt: now }
    );
    const share = buildQuoteProposalTaskCandidate(
      { id: "proposal_1", proposalNumber: "PPQ-20260620-0001", status: "READY_TO_SEND", leadId: "lead_1" },
      "SHARE"
    );
    const expiring = buildShareLinkExpiryTaskCandidate({
      id: "share_1",
      quoteProposalId: "proposal_1",
      expiresAt: now,
      quoteProposal: { proposalNumber: "PPQ-20260620-0001", leadId: "lead_1" }
    });

    expect(revision.type).toBe("REVISION_REVIEW");
    expect(revision.priority).toBe("HIGH");
    expect(share.type).toBe("QUOTE_SHARE");
    expect(expiring.type).toBe("SHARE_LINK_EXPIRY");
  });

  it("prevents duplicate open task candidates", () => {
    const candidate = {
      title: "업무",
      type: "FOLLOW_UP" as const,
      priority: "NORMAL" as const,
      sourceType: "LEAD_FOLLOW_UP",
      sourceId: "lead_1"
    };

    expect(shouldCreateTaskFromCandidate(candidate, [{ sourceType: "LEAD_FOLLOW_UP", sourceId: "lead_1", status: "TODO" }])).toBe(false);
    expect(shouldCreateTaskFromCandidate(candidate, [{ sourceType: "LEAD_FOLLOW_UP", sourceId: "lead_1", status: "DONE" }])).toBe(true);
  });
});
