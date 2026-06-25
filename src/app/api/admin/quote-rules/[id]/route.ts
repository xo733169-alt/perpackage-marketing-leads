import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { quoteRuleSchema, toQuoteRuleFieldErrors } from "@/lib/quote-rule-schema";
import { toQuoteRuleUpdateData } from "@/lib/quote-rule-utils";
import { getQuoteRuleChangeType, serializeQuoteRuleForLog } from "@/lib/quote-rule-log";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const quoteRule = await prisma.quoteRule.findUnique({
    where: { id: params.id }
  });

  if (!quoteRule) {
    return NextResponse.json({ message: "견적 룰을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ quoteRule });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.quoteRule.findUnique({
    where: { id: params.id }
  });

  if (!existing) {
    return NextResponse.json({ message: "견적 룰을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = quoteRuleSchema.safeParse(body);
  const changeReason = typeof body.changeReason === "string" ? body.changeReason.trim() : "";

  if (!parsed.success) {
    return NextResponse.json(
      { message: "입력 내용을 확인해 주세요.", fieldErrors: toQuoteRuleFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const quoteRule = await prisma.$transaction(async (tx) => {
      const updated = await tx.quoteRule.update({
        where: { id: params.id },
        data: toQuoteRuleUpdateData(parsed.data)
      });

      await tx.quoteRuleChangeLog.create({
        data: {
          quoteRuleId: updated.id,
          quoteRuleNameSnapshot: updated.name,
          changeType: getQuoteRuleChangeType(existing, updated),
          beforeJson: serializeQuoteRuleForLog(existing),
          afterJson: serializeQuoteRuleForLog(updated),
          changeReason,
          changedBy: "admin"
        }
      });

      return updated;
    });

    return NextResponse.json({ quoteRule });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: "이미 사용 중인 룰 이름입니다." }, { status: 409 });
    }

    return NextResponse.json({ message: "견적 룰 저장 중 문제가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.quoteRule.findUnique({
    where: { id: params.id }
  });

  if (!existing) {
    return NextResponse.json({ message: "견적 룰을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.quoteRuleChangeLog.create({
      data: {
        quoteRuleId: existing.id,
        quoteRuleNameSnapshot: existing.name,
        changeType: "DELETED",
        beforeJson: serializeQuoteRuleForLog(existing),
        afterJson: null,
        changeReason: "",
        changedBy: "admin"
      }
    });

    await tx.quoteRule.delete({
      where: { id: params.id }
    });
  });

  return NextResponse.json({ ok: true });
}
