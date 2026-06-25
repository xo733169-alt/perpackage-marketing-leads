import { describe, expect, it } from "vitest";
import { buildLeadTimeline, filterLeadTimelineItems } from "@/lib/lead-timeline";

describe("lead timeline helpers", () => {
  it("builds a newest-first unified lead timeline", () => {
    const items = buildLeadTimeline({
      lead: { id: "lead_1", customerName: "김민수", createdAt: new Date("2026-06-18T09:00:00.000Z") },
      communicationLogs: [
        {
          id: "comm_1",
          summary: "전화 상담",
          detail: "사이즈 확인",
          channel: "PHONE",
          direction: "OUTBOUND",
          contactedAt: new Date("2026-06-19T09:00:00.000Z")
        }
      ],
      quoteProposals: [
        {
          id: "proposal_1",
          proposalNumber: "PPQ-20260620-0001",
          status: "SENT",
          createdAt: new Date("2026-06-20T09:00:00.000Z"),
          customerResponses: [
            {
              id: "response_1",
              responseType: "REVISION_REQUESTED",
              message: "수량을 1,000개로 바꿔 주세요.",
              createdAt: new Date("2026-06-20T11:00:00.000Z")
            }
          ]
        }
      ],
      quoteActivities: [
        {
          id: "activity_1",
          quoteProposalId: "proposal_1",
          type: "SHARE_LINK_VIEWED",
          actor: "customer",
          message: "고객이 견적안을 확인했습니다.",
          createdAt: new Date("2026-06-20T10:00:00.000Z")
        }
      ],
      salesTasks: [
        {
          id: "task_1",
          title: "수정 요청 검토",
          type: "REVISION_REVIEW",
          status: "DONE",
          dueAt: new Date("2026-06-20T12:00:00.000Z"),
          completedAt: new Date("2026-06-20T13:00:00.000Z"),
          cancelledAt: null,
          createdAt: new Date("2026-06-20T12:00:00.000Z")
        }
      ]
    });

    expect(items[0].label).toBe("업무 완료");
    expect(items.map((item) => item.type)).toContain("LEAD");
    expect(items.map((item) => item.type)).toContain("COMMUNICATION");
    expect(items.map((item) => item.type)).toContain("QUOTE");
    expect(items.map((item) => item.type)).toContain("CUSTOMER_RESPONSE");
    expect(items.map((item) => item.type)).toContain("TASK");
  });

  it("filters timeline items by type", () => {
    const items = buildLeadTimeline({
      lead: { id: "lead_1", customerName: "김민수", createdAt: new Date("2026-06-18T09:00:00.000Z") },
      salesTasks: [
        {
          id: "task_1",
          title: "후속 연락",
          type: "FOLLOW_UP",
          status: "TODO",
          dueAt: null,
          createdAt: new Date("2026-06-20T09:00:00.000Z")
        }
      ]
    });

    expect(filterLeadTimelineItems(items, "TASK")).toHaveLength(1);
    expect(filterLeadTimelineItems(items, "ALL")).toHaveLength(items.length);
    expect(filterLeadTimelineItems(items, null)).toHaveLength(items.length);
  });
});
