import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import {
  leadCommunicationSchema,
  shouldUpdateLeadFollowUp,
  toLeadCommunicationFieldErrors
} from "@/lib/lead-communication-schema";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const communicationLogs = await prisma.leadCommunicationLog.findMany({
    where: { leadId: params.id },
    orderBy: { contactedAt: "desc" }
  });

  return NextResponse.json({ communicationLogs });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { id: true, nextFollowUpAt: true }
  });

  if (!lead) {
    return NextResponse.json({ message: "리드를 찾을 수 없습니다." }, { status: 404 });
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
    const created = await tx.leadCommunicationLog.create({
      data: {
        leadId: lead.id,
        channel: parsed.data.channel,
        direction: parsed.data.direction,
        summary: parsed.data.summary,
        detail: parsed.data.detail ?? null,
        contactedAt: parsed.data.contactedAt,
        nextFollowUpAt: parsed.data.nextFollowUpAt ?? null
      }
    });

    if (shouldUpdateLeadFollowUp(lead.nextFollowUpAt, created.nextFollowUpAt)) {
      await tx.lead.update({
        where: { id: lead.id },
        data: { nextFollowUpAt: created.nextFollowUpAt }
      });
    }

    await tx.quoteActivityLog.create({
      data: {
        leadId: lead.id,
        type: "COMMUNICATION_LOG_CREATED",
        actor: "admin",
        message: "상담 이력이 추가되었습니다.",
        metadataJson: stringifyActivityMetadata({
          communicationLogId: created.id,
          channel: created.channel,
          direction: created.direction
        })
      }
    });

    return created;
  });

  return NextResponse.json({ communicationLog }, { status: 201 });
}
