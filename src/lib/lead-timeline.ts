import { getTaskStatusLabel, getTaskTypeLabel } from "@/lib/sales-task";

export type LeadTimelineItem = {
  id: string;
  occurredAt: Date;
  type: "LEAD" | "COMMUNICATION" | "QUOTE" | "CUSTOMER_RESPONSE" | "TASK";
  label: string;
  description: string;
  actor?: string | null;
  source?: string | null;
  href?: string | null;
};

export type LeadTimelineInput = {
  lead: { id: string; createdAt: Date; customerName: string };
  communicationLogs?: Array<{
    id: string;
    summary: string;
    detail?: string | null;
    channel: string;
    direction: string;
    contactedAt: Date;
  }>;
  quoteActivities?: Array<{
    id: string;
    quoteProposalId?: string | null;
    type: string;
    actor: string;
    message: string;
    createdAt: Date;
  }>;
  quoteProposals?: Array<{
    id: string;
    proposalNumber: string;
    status: string;
    createdAt: Date;
    customerResponses?: Array<{
      id: string;
      responseType: string;
      message?: string | null;
      responderName?: string | null;
      createdAt: Date;
    }>;
  }>;
  salesTasks?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    dueAt?: Date | null;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    createdAt: Date;
  }>;
};

const quoteActivityLabels: Record<string, string> = {
  PROPOSAL_CREATED: "견적안 작성",
  PROPOSAL_UPDATED: "견적안 상태 변경",
  PROPOSAL_REVISION_CREATED: "수정 견적안 생성",
  PROPOSAL_STATUS_CHANGED: "견적안 상태 변경",
  SHARE_LINK_CREATED: "공유 링크 생성",
  SHARE_LINK_REVOKED: "공유 링크 폐기",
  SHARE_LINK_VIEWED: "고객 견적안 확인",
  CUSTOMER_ACCEPTED: "고객 응답",
  CUSTOMER_REJECTED: "고객 응답",
  CUSTOMER_REVISION_REQUESTED: "고객 응답",
  COMMUNICATION_LOG_CREATED: "상담 이력",
  COMMUNICATION_LOG_UPDATED: "상담 이력",
  COMMUNICATION_LOG_DELETED: "상담 이력"
};

const customerResponseLabels: Record<string, string> = {
  ACCEPTED: "고객 수락",
  REJECTED: "고객 거절",
  REVISION_REQUESTED: "고객 수정 요청"
};

export function buildLeadTimeline(input: LeadTimelineInput): LeadTimelineItem[] {
  const items: LeadTimelineItem[] = [
    {
      id: `lead-created-${input.lead.id}`,
      occurredAt: input.lead.createdAt,
      type: "LEAD",
      label: "문의 접수",
      description: `${input.lead.customerName} 문의가 접수되었습니다.`,
      actor: "customer",
      source: "lead"
    }
  ];

  input.communicationLogs?.forEach((log) => {
    items.push({
      id: `communication-${log.id}`,
      occurredAt: log.contactedAt,
      type: "COMMUNICATION",
      label: "상담 이력",
      description: log.detail ? `${log.summary}\n${log.detail}` : log.summary,
      actor: log.direction,
      source: log.channel
    });
  });

  input.quoteProposals?.forEach((proposal) => {
    items.push({
      id: `proposal-created-${proposal.id}`,
      occurredAt: proposal.createdAt,
      type: "QUOTE",
      label: "견적안 작성",
      description: `${proposal.proposalNumber} 견적안이 생성되었습니다.`,
      actor: "admin",
      source: proposal.status,
      href: `/admin/quote-proposals/${proposal.id}`
    });

    proposal.customerResponses?.forEach((response) => {
      items.push({
        id: `customer-response-${response.id}`,
        occurredAt: response.createdAt,
        type: "CUSTOMER_RESPONSE",
        label: customerResponseLabels[response.responseType] ?? "고객 응답",
        description: response.message ?? `${proposal.proposalNumber} 고객 응답이 접수되었습니다.`,
        actor: response.responderName ?? "customer",
        source: response.responseType,
        href: `/admin/quote-proposals/${proposal.id}`
      });
    });
  });

  input.quoteActivities?.forEach((activity) => {
    items.push({
      id: `quote-activity-${activity.id}`,
      occurredAt: activity.createdAt,
      type: activity.type.startsWith("CUSTOMER_") ? "CUSTOMER_RESPONSE" : "QUOTE",
      label: quoteActivityLabels[activity.type] ?? "견적 활동",
      description: activity.message,
      actor: activity.actor,
      source: activity.type,
      href: activity.quoteProposalId ? `/admin/quote-proposals/${activity.quoteProposalId}` : null
    });
  });

  input.salesTasks?.forEach((task) => {
    items.push({
      id: `task-created-${task.id}`,
      occurredAt: task.createdAt,
      type: "TASK",
      label: "업무 생성",
      description: `${getTaskTypeLabel(task.type)}: ${task.title}`,
      actor: "admin",
      source: task.status,
      href: `/admin/tasks/${task.id}/edit`
    });

    if (task.completedAt) {
      items.push({
        id: `task-completed-${task.id}`,
        occurredAt: task.completedAt,
        type: "TASK",
        label: "업무 완료",
        description: `${task.title} 업무가 ${getTaskStatusLabel(task.status)} 처리되었습니다.`,
        actor: "admin",
        source: task.type,
        href: `/admin/tasks/${task.id}/edit`
      });
    }

    if (task.cancelledAt) {
      items.push({
        id: `task-cancelled-${task.id}`,
        occurredAt: task.cancelledAt,
        type: "TASK",
        label: "업무 취소",
        description: `${task.title} 업무가 취소되었습니다.`,
        actor: "admin",
        source: task.type,
        href: `/admin/tasks/${task.id}/edit`
      });
    }
  });

  return items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}

export function filterLeadTimelineItems(items: LeadTimelineItem[], filter?: string | null): LeadTimelineItem[] {
  if (!filter || filter === "ALL") return items;
  return items.filter((item) => item.type === filter);
}
