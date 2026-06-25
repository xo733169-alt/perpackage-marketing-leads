import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/lead-options";
import { prisma } from "@/lib/prisma";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return null;
  if (value === undefined) return null;
  return value;
};

const nullableDateInput = z.preprocess(
  emptyToNull,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "날짜 형식을 확인해 주세요.")
    .nullable()
);

const nullableAmountInput = z.preprocess(
  emptyToNull,
  z.coerce.number().int("금액은 정수로 입력해 주세요.").min(0, "금액은 0원 이상으로 입력해 주세요.").nullable()
);

const summaryListInput = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  return value;
}, z.array(z.string().trim().max(1000, "각 항목은 1000자 이하로 입력해 주세요.")).max(50, "최대 50개까지 입력할 수 있습니다.").optional());

const updateSchema = z.object({
  status: z.enum(LEAD_STATUSES, {
    invalid_type_error: "상담 상태를 확인해 주세요.",
    required_error: "상담 상태를 선택해 주세요."
  }).optional(),
  adminMemo: z.string().max(5000, "관리자 메모는 5000자 이하로 입력해 주세요.").optional(),
  salesNote: z.string().max(5000, "영업 메모는 5000자 이하로 입력해 주세요.").optional(),
  nextFollowUpAt: nullableDateInput.optional(),
  lastContactedAt: nullableDateInput.optional(),
  quotedAt: nullableDateInput.optional(),
  orderConfirmedAt: nullableDateInput.optional(),
  closedAt: nullableDateInput.optional(),
  confirmedOrderAmountKrw: nullableAmountInput.optional(),
  lostReason: z.string().max(1000, "종료/실패 사유는 1000자 이하로 입력해 주세요.").optional(),
  consultationSummaryTitle: z.string().max(200, "요약 제목은 200자 이하로 입력해 주세요.").optional(),
  consultationSummaryOverview: z.string().max(4000, "요약 문장은 4000자 이하로 입력해 주세요.").optional(),
  consultationPriorityNotes: summaryListInput,
  consultationMissingItems: summaryListInput,
  consultationRiskNotes: summaryListInput,
  consultationNextActions: summaryListInput,
  resetConsultationSummary: z.boolean().optional().default(false),
  markContactedToday: z.boolean().optional().default(false)
});

function toDateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

function resolveConversionDate({
  explicitValue,
  existingValue,
  shouldSetNow,
  now
}: {
  explicitValue: string | null | undefined;
  existingValue: Date | null;
  shouldSetNow: boolean;
  now: Date;
}): Date | null | undefined {
  if (explicitValue !== undefined) {
    return toDateOrNull(explicitValue);
  }

  if (shouldSetNow && !existingValue) {
    return now;
  }

  return undefined;
}

function normalizeOptionalText(value: string | undefined) {
  if (value === undefined) return undefined;
  return value.trim() || null;
}

function normalizeSummaryList(value: string[] | undefined) {
  if (value === undefined) return undefined;
  return value.length ? JSON.stringify(value) : null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id }
  });

  if (!lead) {
    return NextResponse.json({ message: "리드를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "입력 내용을 확인해 주세요." }, { status: 400 });
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: {
      status: true,
      quotedAt: true,
      orderConfirmedAt: true,
      closedAt: true
    }
  });

  if (!existingLead) {
    return NextResponse.json({ message: "리드를 찾을 수 없습니다." }, { status: 404 });
  }

  const shouldMarkContacted = parsed.data.markContactedToday;
  const now = new Date();
  const wasStatusProvided = parsed.data.status !== undefined || shouldMarkContacted;
  const nextStatus = shouldMarkContacted && existingLead.status === "NEW" ? "CONTACTING" : parsed.data.status ?? existingLead.status;
  const updateData: Prisma.LeadUpdateInput = {
    status: nextStatus
  };

  const adminMemo = normalizeOptionalText(parsed.data.adminMemo);
  if (adminMemo !== undefined) updateData.adminMemo = adminMemo;

  const salesNote = normalizeOptionalText(parsed.data.salesNote);
  if (salesNote !== undefined) updateData.salesNote = salesNote;

  if (parsed.data.nextFollowUpAt !== undefined) updateData.nextFollowUpAt = toDateOrNull(parsed.data.nextFollowUpAt);
  if (parsed.data.lastContactedAt !== undefined) updateData.lastContactedAt = toDateOrNull(parsed.data.lastContactedAt);
  if (shouldMarkContacted) updateData.lastContactedAt = now;

  const quotedAt = resolveConversionDate({
    explicitValue: parsed.data.quotedAt,
    existingValue: existingLead.quotedAt,
    shouldSetNow: wasStatusProvided && nextStatus === "QUOTED",
    now
  });
  if (quotedAt !== undefined) updateData.quotedAt = quotedAt;

  const orderConfirmedAt = resolveConversionDate({
    explicitValue: parsed.data.orderConfirmedAt,
    existingValue: existingLead.orderConfirmedAt,
    shouldSetNow: wasStatusProvided && nextStatus === "ORDER_CONFIRMED",
    now
  });
  if (orderConfirmedAt !== undefined) updateData.orderConfirmedAt = orderConfirmedAt;

  const closedAt = resolveConversionDate({
    explicitValue: parsed.data.closedAt,
    existingValue: existingLead.closedAt,
    shouldSetNow: wasStatusProvided && nextStatus === "CLOSED",
    now
  });
  if (closedAt !== undefined) updateData.closedAt = closedAt;

  if (parsed.data.confirmedOrderAmountKrw !== undefined) {
    updateData.confirmedOrderAmountKrw = parsed.data.confirmedOrderAmountKrw;
  }

  const lostReason = normalizeOptionalText(parsed.data.lostReason);
  if (lostReason !== undefined) updateData.lostReason = lostReason;

  const summaryFieldsProvided =
    parsed.data.consultationSummaryTitle !== undefined ||
    parsed.data.consultationSummaryOverview !== undefined ||
    parsed.data.consultationPriorityNotes !== undefined ||
    parsed.data.consultationMissingItems !== undefined ||
    parsed.data.consultationRiskNotes !== undefined ||
    parsed.data.consultationNextActions !== undefined;

  if (parsed.data.resetConsultationSummary) {
    updateData.consultationSummaryTitle = null;
    updateData.consultationSummaryOverview = null;
    updateData.consultationPriorityNotes = null;
    updateData.consultationMissingItems = null;
    updateData.consultationRiskNotes = null;
    updateData.consultationNextActions = null;
    updateData.consultationSummaryUpdatedAt = null;
  } else if (summaryFieldsProvided) {
    const consultationSummaryTitle = normalizeOptionalText(parsed.data.consultationSummaryTitle);
    if (consultationSummaryTitle !== undefined) updateData.consultationSummaryTitle = consultationSummaryTitle;

    const consultationSummaryOverview = normalizeOptionalText(parsed.data.consultationSummaryOverview);
    if (consultationSummaryOverview !== undefined) updateData.consultationSummaryOverview = consultationSummaryOverview;

    const consultationPriorityNotes = normalizeSummaryList(parsed.data.consultationPriorityNotes);
    if (consultationPriorityNotes !== undefined) updateData.consultationPriorityNotes = consultationPriorityNotes;

    const consultationMissingItems = normalizeSummaryList(parsed.data.consultationMissingItems);
    if (consultationMissingItems !== undefined) updateData.consultationMissingItems = consultationMissingItems;

    const consultationRiskNotes = normalizeSummaryList(parsed.data.consultationRiskNotes);
    if (consultationRiskNotes !== undefined) updateData.consultationRiskNotes = consultationRiskNotes;

    const consultationNextActions = normalizeSummaryList(parsed.data.consultationNextActions);
    if (consultationNextActions !== undefined) updateData.consultationNextActions = consultationNextActions;

    const hasAnyManualSummaryValue = [
      updateData.consultationSummaryTitle,
      updateData.consultationSummaryOverview,
      updateData.consultationPriorityNotes,
      updateData.consultationMissingItems,
      updateData.consultationRiskNotes,
      updateData.consultationNextActions
    ].some((value) => typeof value === "string" && value.trim() !== "" && value !== "[]");

    updateData.consultationSummaryUpdatedAt = hasAnyManualSummaryValue ? now : null;
  }

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: updateData
  });

  return NextResponse.json({ lead });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { id: true }
  });

  if (!existingLead) {
    return NextResponse.json({ message: "리드를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.lead.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ ok: true });
}
