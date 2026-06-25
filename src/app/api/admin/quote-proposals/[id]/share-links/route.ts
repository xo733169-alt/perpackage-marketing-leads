import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import {
  buildQuoteShareUrl,
  generateQuoteShareToken,
  getQuoteShareTokenPreview,
  getShareLinkExpiresAt,
  hashQuoteShareToken
} from "@/lib/quote-share";
import { quoteShareLinkCreateSchema } from "@/lib/quote-share-schema";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = quoteShareLinkCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "입력 내용을 확인해 주세요." },
      { status: 400 }
    );
  }

  const proposal = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    select: { id: true, leadId: true, proposalNumber: true }
  });

  if (!proposal) {
    return NextResponse.json({ message: "견적안을 찾을 수 없습니다." }, { status: 404 });
  }

  const now = new Date();
  const activeShareLink = await prisma.quoteProposalShareLink.findFirst({
    where: {
      quoteProposalId: proposal.id,
      status: "ACTIVE",
      revokedAt: null,
      expiresAt: { gt: now }
    },
    select: { id: true }
  });

  if (activeShareLink && !parsed.data.regenerate) {
    return NextResponse.json(
      { message: "이미 활성 공유 링크가 있습니다. 새 링크가 필요하면 재생성을 사용해 주세요." },
      { status: 409 }
    );
  }

  const rawToken = generateQuoteShareToken();
  const tokenHash = hashQuoteShareToken(rawToken);
  const tokenPreview = getQuoteShareTokenPreview(rawToken);
  const expiresAt = getShareLinkExpiresAt(parsed.data.expiresInDays, now);

  const shareLink = await prisma.$transaction(async (tx) => {
    const revoked = await tx.quoteProposalShareLink.updateMany({
      where: {
        quoteProposalId: proposal.id,
        status: "ACTIVE",
        revokedAt: null
      },
      data: {
        status: "REVOKED",
        revokedAt: now
      }
    });

    if (revoked.count > 0) {
      await tx.quoteActivityLog.create({
        data: {
          leadId: proposal.leadId,
          quoteProposalId: proposal.id,
          type: "SHARE_LINK_REVOKED",
          actor: "admin",
          message: "기존 공유 링크가 폐기되었습니다.",
          metadataJson: stringifyActivityMetadata({ revokedCount: revoked.count })
        }
      });
    }

    const created = await tx.quoteProposalShareLink.create({
      data: {
        quoteProposalId: proposal.id,
        tokenHash,
        tokenPreview,
        status: "ACTIVE",
        expiresAt,
        createdBy: "admin"
      }
    });

    await tx.quoteActivityLog.create({
      data: {
        leadId: proposal.leadId,
        quoteProposalId: proposal.id,
        type: "SHARE_LINK_CREATED",
        actor: "admin",
        message: "공유 링크가 생성되었습니다.",
        metadataJson: stringifyActivityMetadata({
          shareLinkId: created.id,
          tokenPreview,
          expiresAt: expiresAt.toISOString()
        })
      }
    });

    return created;
  });

  return NextResponse.json({
    shareLink,
    shareUrl: buildQuoteShareUrl(rawToken)
  });
}
