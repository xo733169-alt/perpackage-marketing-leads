import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.quoteProposalShareLink.findUnique({
    where: { id: params.id },
    include: {
      quoteProposal: { select: { id: true, leadId: true, proposalNumber: true } }
    }
  });

  if (!existing) {
    return NextResponse.json({ message: "공유 링크를 찾을 수 없습니다." }, { status: 404 });
  }

  const now = new Date();
  const shareLink = await prisma.$transaction(async (tx) => {
    const updated = await tx.quoteProposalShareLink.update({
      where: { id: existing.id },
      data: {
        status: "REVOKED",
        revokedAt: existing.revokedAt ?? now
      }
    });

    if (existing.status !== "REVOKED") {
      await tx.quoteActivityLog.create({
        data: {
          leadId: existing.quoteProposal.leadId,
          quoteProposalId: existing.quoteProposal.id,
          type: "SHARE_LINK_REVOKED",
          actor: "admin",
          message: "공유 링크가 폐기되었습니다.",
          metadataJson: stringifyActivityMetadata({
            shareLinkId: existing.id,
            tokenPreview: existing.tokenPreview
          })
        }
      });
    }

    return updated;
  });

  return NextResponse.json({ shareLink });
}
