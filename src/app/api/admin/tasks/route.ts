import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salesTaskSchema, toSalesTaskFieldErrors } from "@/lib/sales-task-schema";

function cleanText(value: string | null | undefined) {
  return value?.trim() || null;
}

function getTaskOrderBy(sort: string | null): Prisma.SalesTaskOrderByWithRelationInput[] {
  if (sort === "priority") {
    return [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }];
  }
  if (sort === "newest") {
    return [{ createdAt: "desc" }];
  }
  return [{ dueAt: "asc" }, { createdAt: "desc" }];
}

function buildTaskWhere(searchParams: URLSearchParams): Prisma.SalesTaskWhereInput {
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const type = searchParams.get("type")?.trim();
  const priority = searchParams.get("priority")?.trim();
  const dueState = searchParams.get("dueState")?.trim();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const where: Prisma.SalesTaskWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { assignedTo: { contains: q } }
    ];
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (priority) where.priority = priority;

  if (dueState === "today") {
    where.status = { in: ["TODO", "IN_PROGRESS"] };
    where.dueAt = { lte: todayEnd };
  } else if (dueState === "overdue") {
    where.status = { in: ["TODO", "IN_PROGRESS"] };
    where.dueAt = { lt: todayStart };
  } else if (dueState === "upcoming") {
    where.status = { in: ["TODO", "IN_PROGRESS"] };
    where.dueAt = { gt: todayEnd };
  } else if (dueState === "done") {
    where.status = "DONE";
  }

  return where;
}

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tasks = await prisma.salesTask.findMany({
    where: buildTaskWhere(searchParams),
    include: {
      lead: { select: { id: true, customerName: true, companyName: true } },
      quoteProposal: { select: { id: true, proposalNumber: true, status: true } }
    },
    orderBy: getTaskOrderBy(searchParams.get("sort")),
    take: 200
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = salesTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "업무 입력 내용을 확인해 주세요.", fieldErrors: toSalesTaskFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  if (parsed.data.sourceType && parsed.data.sourceId) {
    const existingOpenTask = await prisma.salesTask.findFirst({
      where: {
        sourceType: parsed.data.sourceType,
        sourceId: parsed.data.sourceId,
        status: { notIn: ["DONE", "CANCELLED"] }
      }
    });

    if (existingOpenTask) {
      return NextResponse.json({ task: existingOpenTask, message: "이미 진행 중인 연결 업무가 있습니다." }, { status: 200 });
    }
  }

  const now = new Date();
  const task = await prisma.salesTask.create({
    data: {
      leadId: cleanText(parsed.data.leadId),
      quoteProposalId: cleanText(parsed.data.quoteProposalId),
      title: parsed.data.title,
      description: cleanText(parsed.data.description),
      type: parsed.data.type,
      priority: parsed.data.priority,
      status: parsed.data.status,
      dueAt: parsed.data.dueAt ?? null,
      completedAt: parsed.data.status === "DONE" ? now : null,
      cancelledAt: parsed.data.status === "CANCELLED" ? now : null,
      assignedTo: cleanText(parsed.data.assignedTo),
      sourceType: cleanText(parsed.data.sourceType),
      sourceId: cleanText(parsed.data.sourceId)
    }
  });

  return NextResponse.json({ task }, { status: 201 });
}
