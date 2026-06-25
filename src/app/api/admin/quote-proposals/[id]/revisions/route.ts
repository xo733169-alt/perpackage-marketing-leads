import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { createUniqueProposalNumber } from "@/lib/proposal-number";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import {
  buildRevisionDraftFromProposal,
  buildSupersededProposalUpdate,
  getNextRevisionNumber
} from "@/lib/quote-proposal-revision";
import {
  getRevisionReasonFromCustomerResponse,
  quoteProposalRevisionSchema
} from "@/lib/quote-proposal-revision-schema";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const proposal = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    select: { id: true, revisionGroupId: true }
  });

  if (!proposal) {
    return NextResponse.json({ message: "견적안을 찾을 수 없습니다." }, { status: 404 });
  }

  const revisionGroupId = proposal.revisionGroupId ?? proposal.id;
  const revisions = await prisma.quoteProposal.findMany({
    where: {
      OR: [{ revisionGroupId }, { id: revisionGroupId }]
    },
    orderBy: [{ revisionNumber: "desc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ revisions });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = quoteProposalRevisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "입력 내용을 확인해 주세요.",
        fieldErrors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const sourceProposal = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customerResponses: {
        where: { responseType: "REVISION_REQUESTED" },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!sourceProposal) {
    return NextResponse.json({ message: "견적안을 찾을 수 없습니다." }, { status: 404 });
  }

  if (sourceProposal.status === "ACCEPTED" || sourceProposal.status === "CANCELLED") {
    return NextResponse.json(
      { message: "수락 또는 취소된 견적안에서는 수정안을 만들 수 없습니다." },
      { status: 400 }
    );
  }

  const customerRevisionRequest = sourceProposal.customerResponses[0] ?? null;
  const revisionReason = getRevisionReasonFromCustomerResponse(
    parsed.data.revisionReason,
    customerRevisionRequest?.message
  );

  const createdRevision = await prisma.$transaction(async (tx) => {
    const revisionGroupId = sourceProposal.revisionGroupId ?? sourceProposal.id;
    const now = new Date();

    const existingRevisions = await tx.quoteProposal.findMany({
      where: { OR: [{ revisionGroupId }, { id: revisionGroupId }] },
      select: { revisionNumber: true }
    });
    const nextRevisionNumber = getNextRevisionNumber(existingRevisions);
    const proposalNumber = await createUniqueProposalNumber(tx);
    const revisionDraft = buildRevisionDraftFromProposal(sourceProposal, revisionReason, nextRevisionNumber);

    await tx.quoteProposal.updateMany({
      where: { OR: [{ revisionGroupId }, { id: revisionGroupId }] },
      data: { isLatestRevision: false }
    });

    const created = await tx.quoteProposal.create({
      data: {
        leadId: sourceProposal.leadId,
        proposalNumber,
        status: revisionDraft.status,
        revisionGroupId,
        revisionNumber: revisionDraft.revisionNumber,
        parentProposalId: revisionDraft.parentProposalId,
        isLatestRevision: true,
        revisionReason: revisionDraft.revisionReason,
        revisedFromCustomerResponseId: customerRevisionRequest?.id ?? null,
        title: revisionDraft.title,
        customerNameSnapshot: sourceProposal.customerNameSnapshot,
        companyNameSnapshot: sourceProposal.companyNameSnapshot,
        phoneSnapshot: sourceProposal.phoneSnapshot,
        emailSnapshot: sourceProposal.emailSnapshot,
        kakaoIdSnapshot: sourceProposal.kakaoIdSnapshot,
        boxType: sourceProposal.boxType,
        industry: sourceProposal.industry,
        quantityLabel: sourceProposal.quantityLabel,
        quantityCount: sourceProposal.quantityCount,
        specificationSummary: sourceProposal.specificationSummary,
        productionNotes: sourceProposal.productionNotes,
        deliveryEstimateText: sourceProposal.deliveryEstimateText,
        paymentTerms: sourceProposal.paymentTerms,
        validUntil: sourceProposal.validUntil,
        subtotalAmountKrw: sourceProposal.subtotalAmountKrw,
        vatAmountKrw: sourceProposal.vatAmountKrw,
        totalAmountKrw: sourceProposal.totalAmountKrw,
        vatIncluded: sourceProposal.vatIncluded,
        customerMessage: sourceProposal.customerMessage,
        internalMemo: sourceProposal.internalMemo,
        basedOnEstimateLabel: sourceProposal.basedOnEstimateLabel,
        basedOnUnitPriceMinKrw: sourceProposal.basedOnUnitPriceMinKrw,
        basedOnUnitPriceMaxKrw: sourceProposal.basedOnUnitPriceMaxKrw,
        basedOnTotalPriceMinKrw: sourceProposal.basedOnTotalPriceMinKrw,
        basedOnTotalPriceMaxKrw: sourceProposal.basedOnTotalPriceMaxKrw,
        estimateComparisonStatus: sourceProposal.estimateComparisonStatus
      }
    });

    await tx.quoteProposalItem.createMany({
      data: sourceProposal.items.map((item) => ({
        quoteProposalId: created.id,
        sortOrder: item.sortOrder,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unitPriceKrw: item.unitPriceKrw,
        amountKrw: item.amountKrw
      }))
    });

    await tx.quoteProposal.update({
      where: { id: sourceProposal.id },
      data: {
        revisionGroupId,
        ...buildSupersededProposalUpdate(sourceProposal.status, created.id, now)
      }
    });

    const revokedShareLinks = await tx.quoteProposalShareLink.updateMany({
      where: {
        quoteProposalId: sourceProposal.id,
        status: "ACTIVE",
        revokedAt: null
      },
      data: {
        status: "REVOKED",
        revokedAt: now
      }
    });

    if (revokedShareLinks.count > 0) {
      await tx.quoteActivityLog.create({
        data: {
          leadId: sourceProposal.leadId,
          quoteProposalId: sourceProposal.id,
          type: "SHARE_LINK_REVOKED",
          actor: "system",
          message: "수정 견적안 생성으로 이전 견적안의 공유 링크가 폐기되었습니다.",
          metadataJson: stringifyActivityMetadata({ revokedCount: revokedShareLinks.count, supersededByProposalId: created.id })
        }
      });
    }

    await tx.quoteActivityLog.create({
      data: {
        leadId: created.leadId,
        quoteProposalId: created.id,
        type: "PROPOSAL_REVISION_CREATED",
        actor: "admin",
        message: "수정 견적안이 생성되었습니다.",
        metadataJson: stringifyActivityMetadata({
          sourceProposalId: sourceProposal.id,
          sourceProposalNumber: sourceProposal.proposalNumber,
          revisionGroupId,
          revisionNumber: created.revisionNumber,
          revisedFromCustomerResponseId: customerRevisionRequest?.id ?? null
        })
      }
    });

    return created;
  });

  return NextResponse.json({ quoteProposal: createdRevision }, { status: 201 });
}
