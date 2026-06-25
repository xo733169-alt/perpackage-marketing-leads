import { NextResponse } from "next/server";
import { isAllowedMutationOrigin } from "@/lib/auth";
import {
  getCustomerResponseActivityMessage,
  getCustomerResponseActivityType,
  stringifyActivityMetadata
} from "@/lib/quote-activity";
import { notifyQuoteResponseCreated } from "@/lib/quote-response-notifications";
import {
  buildLeadUpdateForCustomerResponse,
  getCustomerResponseProposalStatus,
  hashQuoteShareToken,
  isShareLinkUsable
} from "@/lib/quote-share";
import {
  quoteShareCustomerResponseSchema,
  toQuoteShareCustomerResponseFieldErrors
} from "@/lib/quote-share-schema";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { token: string } }) {
  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const token = decodeURIComponent(params.token);
  const tokenHash = hashQuoteShareToken(token);
  const now = new Date();
  const shareLink = await prisma.quoteProposalShareLink.findUnique({
    where: { tokenHash },
    include: {
      quoteProposal: {
        include: {
          lead: {
            select: {
              id: true,
              orderConfirmedAt: true,
              confirmedOrderAmountKrw: true
            }
          }
        }
      },
      customerResponses: { select: { id: true }, take: 1 }
    }
  });

  if (!shareLink) {
    return NextResponse.json({ message: "유효하지 않거나 만료된 견적안 링크입니다." }, { status: 404 });
  }

  if (!isShareLinkUsable(shareLink, now)) {
    return NextResponse.json({ message: "유효하지 않거나 만료된 견적안 링크입니다." }, { status: 404 });
  }

  if (shareLink.customerResponses.length > 0) {
    return NextResponse.json({ message: "이미 응답이 접수된 견적안 링크입니다." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = quoteShareCustomerResponseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "입력 내용을 확인해 주세요.",
        fieldErrors: toQuoteShareCustomerResponseFieldErrors(parsed.error)
      },
      { status: 400 }
    );
  }

  const responseType = parsed.data.responseType;
  const nextProposalStatus = getCustomerResponseProposalStatus(responseType);

  const response = await prisma.$transaction(async (tx) => {
    const created = await tx.quoteProposalCustomerResponse.create({
      data: {
        quoteProposalId: shareLink.quoteProposalId,
        shareLinkId: shareLink.id,
        responseType,
        responderName: parsed.data.responderName ?? null,
        message: parsed.data.message ?? null
      }
    });

    await tx.quoteProposal.update({
      where: { id: shareLink.quoteProposalId },
      data: { status: nextProposalStatus }
    });

    const leadUpdate = buildLeadUpdateForCustomerResponse({
      responseType,
      orderConfirmedAt: shareLink.quoteProposal.lead?.orderConfirmedAt ?? null,
      confirmedOrderAmountKrw: shareLink.quoteProposal.lead?.confirmedOrderAmountKrw ?? null,
      proposalTotalAmountKrw: shareLink.quoteProposal.totalAmountKrw,
      now
    });

    if (leadUpdate && shareLink.quoteProposal.leadId) {
      await tx.lead.update({
        where: { id: shareLink.quoteProposal.leadId },
        data: leadUpdate
      });
    }

    await tx.quoteActivityLog.create({
      data: {
        leadId: shareLink.quoteProposal.leadId,
        quoteProposalId: shareLink.quoteProposalId,
        type: getCustomerResponseActivityType(responseType),
        actor: "customer",
        message: getCustomerResponseActivityMessage(responseType),
        metadataJson: stringifyActivityMetadata({
          shareLinkId: shareLink.id,
          responseId: created.id,
          responseType
        })
      }
    });

    return created;
  });

  await notifyQuoteResponseCreated({
    proposalId: shareLink.quoteProposalId,
    proposalNumber: shareLink.quoteProposal.proposalNumber,
    responseType,
    createdAt: response.createdAt,
    leadId: shareLink.quoteProposal.leadId
  });

  return NextResponse.json({ ok: true, responseType }, { status: 201 });
}
