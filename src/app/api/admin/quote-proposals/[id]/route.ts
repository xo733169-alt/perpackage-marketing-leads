import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import {
  buildLeadUpdateForProposalStatus,
  buildQuoteProposalUpdateData
} from "@/lib/quote-proposal";
import {
  QUOTE_PROPOSAL_STATUS_LABELS,
  quoteProposalSchema,
  quoteProposalStatusUpdateSchema,
  toQuoteProposalFieldErrors,
  type QuoteProposalStatus
} from "@/lib/quote-proposal-schema";
import { prisma } from "@/lib/prisma";

async function applyLeadStatusUpdate(quoteProposalId: string) {
  const proposal = await prisma.quoteProposal.findUnique({
    where: { id: quoteProposalId },
    include: {
      lead: {
        select: {
          id: true,
          status: true,
          quotedAt: true,
          orderConfirmedAt: true,
          confirmedOrderAmountKrw: true
        }
      }
    }
  });

  if (!proposal?.lead) return;

  const leadUpdate = buildLeadUpdateForProposalStatus({
    currentStatus: proposal.lead.status,
    quotedAt: proposal.lead.quotedAt,
    orderConfirmedAt: proposal.lead.orderConfirmedAt,
    confirmedOrderAmountKrw: proposal.lead.confirmedOrderAmountKrw,
    proposalStatus: proposal.status as QuoteProposalStatus,
    proposalTotalAmountKrw: proposal.totalAmountKrw
  });

  if (!leadUpdate) return;

  await prisma.lead.update({
    where: { id: proposal.lead.id },
    data: leadUpdate
  });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const quoteProposal = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    include: {
      lead: { select: { id: true, customerName: true, companyName: true } },
      items: { orderBy: { sortOrder: "asc" } }
    }
  });

  if (!quoteProposal) {
    return NextResponse.json({ message: "견적안을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ quoteProposal });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    include: { items: true }
  });

  if (!existing) {
    return NextResponse.json({ message: "견적안을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const isStatusOnlyUpdate = typeof body.status === "string" && Object.keys(body).length === 1;

  if (isStatusOnlyUpdate) {
    const parsed = quoteProposalStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "올바르지 않은 상태값입니다." }, { status: 400 });
    }

    const quoteProposal = await prisma.quoteProposal.update({
      where: { id: params.id },
      data: { status: parsed.data.status }
    });

    await prisma.quoteActivityLog.create({
      data: {
        leadId: quoteProposal.leadId,
        quoteProposalId: quoteProposal.id,
        type: "PROPOSAL_STATUS_CHANGED",
        actor: "admin",
        message: `견적안 상태가 ${QUOTE_PROPOSAL_STATUS_LABELS[parsed.data.status]}로 변경되었습니다.`,
        metadataJson: stringifyActivityMetadata({ from: existing.status, to: parsed.data.status })
      }
    });

    await applyLeadStatusUpdate(params.id);

    return NextResponse.json({ quoteProposal });
  }

  const parsed = quoteProposalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "입력 내용을 확인해 주세요.", fieldErrors: toQuoteProposalFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const quoteProposal = await prisma.$transaction(async (tx) => {
    const { proposal, items } = buildQuoteProposalUpdateData(parsed.data);

    const updated = await tx.quoteProposal.update({
      where: { id: params.id },
      data: proposal
    });

    await tx.quoteProposalItem.deleteMany({
      where: { quoteProposalId: params.id }
    });

    await tx.quoteProposalItem.createMany({
      data: items.map((item) => ({
        ...item,
        quoteProposalId: params.id
      }))
    });

    await tx.quoteActivityLog.create({
      data: {
        leadId: updated.leadId,
        quoteProposalId: updated.id,
        type: "PROPOSAL_UPDATED",
        actor: "admin",
        message: "견적안이 수정되었습니다.",
        metadataJson: stringifyActivityMetadata({ itemCount: items.length })
      }
    });

    if (existing.status !== parsed.data.status) {
      await tx.quoteActivityLog.create({
        data: {
          leadId: updated.leadId,
          quoteProposalId: updated.id,
          type: "PROPOSAL_STATUS_CHANGED",
          actor: "admin",
          message: `견적안 상태가 ${QUOTE_PROPOSAL_STATUS_LABELS[parsed.data.status]}로 변경되었습니다.`,
          metadataJson: stringifyActivityMetadata({ from: existing.status, to: parsed.data.status })
        }
      });
    }

    return tx.quoteProposal.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { sortOrder: "asc" } } }
    });
  });

  await applyLeadStatusUpdate(params.id);

  return NextResponse.json({ quoteProposal });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: "견적안을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.quoteProposal.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ ok: true });
}
