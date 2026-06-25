import {
  SALES_TASK_PRIORITY_LABELS,
  SALES_TASK_STATUS_LABELS,
  SALES_TASK_TYPE_LABELS,
  type SalesTaskPriority,
  type SalesTaskStatus,
  type SalesTaskType
} from "@/lib/sales-task-schema";

export type SalesTaskLike = {
  id?: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueAt: Date | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt?: Date;
};

export type SalesTaskCandidate = {
  title: string;
  description?: string | null;
  type: SalesTaskType;
  priority: SalesTaskPriority;
  status?: SalesTaskStatus;
  dueAt?: Date | null;
  leadId?: string | null;
  quoteProposalId?: string | null;
  assignedTo?: string | null;
  sourceType: string;
  sourceId: string;
};

export function getTaskTypeLabel(type: string): string {
  return SALES_TASK_TYPE_LABELS[type as SalesTaskType] ?? type;
}

export function getTaskPriorityLabel(priority: string): string {
  return SALES_TASK_PRIORITY_LABELS[priority as SalesTaskPriority] ?? priority;
}

export function getTaskStatusLabel(status: string): string {
  return SALES_TASK_STATUS_LABELS[status as SalesTaskStatus] ?? status;
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function endOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

export function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function isOpenTaskStatus(status: string): boolean {
  return status === "TODO" || status === "IN_PROGRESS";
}

export function isTaskDue(task: Pick<SalesTaskLike, "dueAt" | "status">, now = new Date()): boolean {
  if (!task.dueAt || !isOpenTaskStatus(task.status)) return false;
  return task.dueAt.getTime() <= endOfDay(now).getTime();
}

export function isTaskOverdue(task: Pick<SalesTaskLike, "dueAt" | "status">, now = new Date()): boolean {
  if (!task.dueAt || !isOpenTaskStatus(task.status)) return false;
  return task.dueAt.getTime() < startOfDay(now).getTime();
}

const priorityRank: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
};

export function sortTasksForToday<T extends SalesTaskLike>(tasks: T[], now = new Date()): T[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isTaskOverdue(a, now) ? 0 : 1;
    const bOverdue = isTaskOverdue(b, now) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    const aDue = a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aDue !== bDue) return aDue - bDue;

    const aPriority = priorityRank[a.priority] ?? 9;
    const bPriority = priorityRank[b.priority] ?? 9;
    if (aPriority !== bPriority) return aPriority - bPriority;

    return a.title.localeCompare(b.title, "ko");
  });
}

export function formatTaskDueLabel(dueAt: Date | null | undefined, now = new Date()): string {
  if (!dueAt) return "기한 없음";
  if (isTaskOverdue({ dueAt, status: "TODO" }, now)) return "기한 지남";
  const todayStart = startOfDay(now).getTime();
  const dueStart = startOfDay(dueAt).getTime();
  if (dueStart === todayStart) return "오늘";
  if (dueStart === startOfDay(addDays(now, 1)).getTime()) return "내일";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(dueAt);
}

export function buildLeadFollowUpTaskCandidate(
  lead: { id: string; customerName: string; companyName?: string | null; nextFollowUpAt?: Date | null },
  now = new Date()
): SalesTaskCandidate {
  return {
    leadId: lead.id,
    title: `${lead.customerName} 후속 연락`,
    description: lead.companyName ? `${lead.companyName} 문의 후속 연락` : "리드 후속 연락",
    type: "FOLLOW_UP",
    priority: "NORMAL",
    dueAt: lead.nextFollowUpAt ?? addDays(now, 1),
    sourceType: "LEAD_FOLLOW_UP",
    sourceId: lead.id
  };
}

export function buildRevisionRequestTaskCandidate(
  proposal: { id: string; proposalNumber: string; leadId?: string | null },
  response?: { id: string; message?: string | null; createdAt?: Date }
): SalesTaskCandidate {
  return {
    leadId: proposal.leadId ?? null,
    quoteProposalId: proposal.id,
    title: `${proposal.proposalNumber} 수정 요청 검토`,
    description: response?.message ?? "고객 수정 요청을 확인하고 수정 견적안을 준비해 주세요.",
    type: "REVISION_REVIEW",
    priority: "HIGH",
    dueAt: response?.createdAt ?? new Date(),
    sourceType: "REVISION_REQUEST",
    sourceId: response?.id ?? proposal.id
  };
}

export function buildQuoteProposalTaskCandidate(
  proposal: {
    id: string;
    proposalNumber: string;
    status: string;
    leadId?: string | null;
    updatedAt?: Date;
  },
  kind: "SHARE" | "CUSTOMER_CHECK" | "PREP" = "PREP"
): SalesTaskCandidate {
  if (kind === "SHARE") {
    return {
      leadId: proposal.leadId ?? null,
      quoteProposalId: proposal.id,
      title: `${proposal.proposalNumber} 공유 링크 전달`,
      description: "견적안 공유 링크를 생성하거나 고객에게 직접 전달했는지 확인해 주세요.",
      type: "QUOTE_SHARE",
      priority: "NORMAL",
      dueAt: new Date(),
      sourceType: "QUOTE_SHARE",
      sourceId: proposal.id
    };
  }

  if (kind === "CUSTOMER_CHECK") {
    return {
      leadId: proposal.leadId ?? null,
      quoteProposalId: proposal.id,
      title: `${proposal.proposalNumber} 고객 응답 확인`,
      description: "발송 후 고객 응답이 없는 견적안을 확인해 주세요.",
      type: "CUSTOMER_RESPONSE",
      priority: "NORMAL",
      dueAt: new Date(),
      sourceType: "QUOTE_CUSTOMER_RESPONSE",
      sourceId: proposal.id
    };
  }

  return {
    leadId: proposal.leadId ?? null,
    quoteProposalId: proposal.id,
    title: `${proposal.proposalNumber} 견적안 작성 확인`,
    description: "임시작성 상태의 견적안을 검토하고 다음 상태로 진행해 주세요.",
    type: "QUOTE_PREP",
    priority: "NORMAL",
    dueAt: proposal.updatedAt ?? new Date(),
    sourceType: "QUOTE_PREP",
    sourceId: proposal.id
  };
}

export function buildShareLinkExpiryTaskCandidate(shareLink: {
  id: string;
  quoteProposalId: string;
  expiresAt: Date;
  quoteProposal?: { proposalNumber?: string; leadId?: string | null } | null;
}): SalesTaskCandidate {
  return {
    leadId: shareLink.quoteProposal?.leadId ?? null,
    quoteProposalId: shareLink.quoteProposalId,
    title: `${shareLink.quoteProposal?.proposalNumber ?? "견적안"} 공유 링크 만료 확인`,
    description: "공유 링크 만료가 가까운 견적안입니다. 고객 확인 또는 링크 재생성이 필요한지 검토해 주세요.",
    type: "SHARE_LINK_EXPIRY",
    priority: "NORMAL",
    dueAt: shareLink.expiresAt,
    sourceType: "SHARE_LINK_EXPIRY",
    sourceId: shareLink.id
  };
}

export function shouldCreateTaskFromCandidate(
  candidate: Pick<SalesTaskCandidate, "sourceType" | "sourceId">,
  existingTasks: Array<Pick<SalesTaskLike, "sourceType" | "sourceId" | "status">>
): boolean {
  return !existingTasks.some(
    (task) =>
      task.sourceType === candidate.sourceType &&
      task.sourceId === candidate.sourceId &&
      task.status !== "DONE" &&
      task.status !== "CANCELLED"
  );
}
