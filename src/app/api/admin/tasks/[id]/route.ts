import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salesTaskPatchSchema, toSalesTaskFieldErrors } from "@/lib/sales-task-schema";

function cleanText(value: string | null | undefined) {
  return value?.trim() || null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const task = await prisma.salesTask.findUnique({
    where: { id: params.id },
    include: {
      lead: { select: { id: true, customerName: true, companyName: true } },
      quoteProposal: { select: { id: true, proposalNumber: true, status: true } }
    }
  });

  if (!task) {
    return NextResponse.json({ message: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existingTask = await prisma.salesTask.findUnique({ where: { id: params.id } });

  if (!existingTask) {
    return NextResponse.json({ message: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = salesTaskPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "업무 입력 내용을 확인해 주세요.", fieldErrors: toSalesTaskFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const nextStatus = parsed.data.status ?? existingTask.status;
  const now = new Date();

  const task = await prisma.salesTask.update({
    where: { id: params.id },
    data: {
      leadId: parsed.data.leadId !== undefined ? cleanText(parsed.data.leadId) : undefined,
      quoteProposalId:
        parsed.data.quoteProposalId !== undefined ? cleanText(parsed.data.quoteProposalId) : undefined,
      title: parsed.data.title,
      description: parsed.data.description !== undefined ? cleanText(parsed.data.description) : undefined,
      type: parsed.data.type,
      priority: parsed.data.priority,
      status: parsed.data.status,
      dueAt: parsed.data.dueAt !== undefined ? parsed.data.dueAt ?? null : undefined,
      assignedTo: parsed.data.assignedTo !== undefined ? cleanText(parsed.data.assignedTo) : undefined,
      sourceType: parsed.data.sourceType !== undefined ? cleanText(parsed.data.sourceType) : undefined,
      sourceId: parsed.data.sourceId !== undefined ? cleanText(parsed.data.sourceId) : undefined,
      completedAt: nextStatus === "DONE" && !existingTask.completedAt ? now : undefined,
      cancelledAt: nextStatus === "CANCELLED" && !existingTask.cancelledAt ? now : undefined
    }
  });

  return NextResponse.json({ task });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existingTask = await prisma.salesTask.findUnique({ where: { id: params.id }, select: { id: true } });

  if (!existingTask) {
    return NextResponse.json({ message: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.salesTask.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
