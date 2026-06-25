import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { createUniqueProposalNumber } from "@/lib/proposal-number";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import { buildQuoteProposalCreateData } from "@/lib/quote-proposal";
import {
  isQuoteProposalStatus,
  quoteProposalSchema,
  toQuoteProposalFieldErrors
} from "@/lib/quote-proposal-schema";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.QuoteProposalWhereInput = {};

  if (q) {
    where.OR = [
      { proposalNumber: { contains: q } },
      { customerNameSnapshot: { contains: q } },
      { companyNameSnapshot: { contains: q } },
      { boxType: { contains: q } }
    ];
  }

  if (isQuoteProposalStatus(status)) {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999`);
  }

  const quoteProposals = await prisma.quoteProposal.findMany({
    where,
    include: {
      lead: { select: { id: true, customerName: true } }
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200
  });

  return NextResponse.json({ quoteProposals });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = quoteProposalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "입력 내용을 확인해 주세요.", fieldErrors: toQuoteProposalFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const quoteProposal = await prisma.$transaction(async (tx) => {
    const proposalNumber = await createUniqueProposalNumber(tx);
    const { proposal, items } = buildQuoteProposalCreateData(parsed.data, proposalNumber);
    const created = await tx.quoteProposal.create({ data: proposal });

    await tx.quoteProposal.update({
      where: { id: created.id },
      data: { revisionGroupId: created.id, revisionNumber: 1, isLatestRevision: true }
    });

    await tx.quoteProposalItem.createMany({
      data: items.map((item) => ({
        ...item,
        quoteProposalId: created.id
      }))
    });

    await tx.quoteActivityLog.create({
      data: {
        leadId: created.leadId,
        quoteProposalId: created.id,
        type: "PROPOSAL_CREATED",
        actor: "admin",
        message: "견적안이 생성되었습니다.",
        metadataJson: stringifyActivityMetadata({ proposalNumber })
      }
    });

    return tx.quoteProposal.findUnique({
      where: { id: created.id },
      include: { items: { orderBy: { sortOrder: "asc" } } }
    });
  });

  return NextResponse.json({ quoteProposal }, { status: 201 });
}
