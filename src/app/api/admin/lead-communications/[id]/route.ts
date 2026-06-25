import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import {
  leadCommunicationSchema,
  shouldUpdateLeadFollowUp,
  toLeadCommunicationFieldErrors
} from "@/lib/lead-communication-schema";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.leadCommunicationLog.findUnique({
    where: { id: params.id },
    include: { lead: { select: { id: true, nextFollowUpAt: true } } }
  });

  if (!existing) {
    return NextResponse.json({ message: "상담 이력을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = leadCommunicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "상담 이력 입력 내용을 확인해 주세요.", fieldErrors: toLeadCommunicationFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const communicationLog = await prisma.$transaction(async (tx) => {
    const updated = await tx.leadCommunicationLog.update({
      where: { id: existing.id },
      data: {
        channel: parsed.data.channel,
        direction: parsed.data.direction,
        summary: parsed.data.summary,
        detail: parsed.data.detail ?? null,
        contactedAt: parsed.data.contactedAt,
        nextFollowUpAt: parsed.data.nextFollowUpAt ?? null
      }
    });

    if (shouldUpdateLeadFollowUp(existing.lead.nextFollowUpAt, updated.nextFollowUpAt)) {
      await tx.lead.update({
        where: { id: existing.leadId },
        data: { nextFollowUpAt: updated.nextFollowUpAt }
      });
    }

    await tx.quoteActivityLog.create({
      data: {
        leadId: existing.leadId,
        type: "COMMUNICATION_LOG_UPDATED",
        actor: "admin",
        message: "상담 이력이 수정되었습니다.",
        metadataJson: stringifyActivityMetadata({ communicationLogId: updated.id })
      }
    });

    return updated;
  });

  return NextResponse.json({ communicationLog });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.leadCommunicationLog.findUnique({
    where: { id: params.id },
    select: { id: true, leadId: true, channel: true, direction: true }
  });

  if (!existing) {
    return NextResponse.json({ message: "상담 이력을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.leadCommunicationLog.delete({ where: { id: existing.id } });
    await tx.quoteActivityLog.create({
      data: {
        leadId: existing.leadId,
        type: "COMMUNICATION_LOG_DELETED",
        actor: "admin",
        message: "상담 이력이 삭제되었습니다.",
        metadataJson: stringifyActivityMetadata({
          communicationLogId: existing.id,
          channel: existing.channel,
          direction: existing.direction
        })
      }
    });
  });

  return NextResponse.json({ ok: true });
}
