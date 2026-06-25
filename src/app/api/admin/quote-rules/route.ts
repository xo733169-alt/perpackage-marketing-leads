import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { BOX_TYPE_OPTIONS } from "@/lib/lead-options";
import { quoteRuleSchema, toQuoteRuleFieldErrors } from "@/lib/quote-rule-schema";
import { toQuoteRuleCreateData } from "@/lib/quote-rule-utils";
import { serializeQuoteRuleForLog } from "@/lib/quote-rule-log";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const active = searchParams.get("active");
  const boxType = searchParams.get("boxType")?.trim();

  const where: Prisma.QuoteRuleWhereInput = {};

  if (q) {
    where.OR = [{ name: { contains: q } }, { boxType: { contains: q } }, { quantityRange: { contains: q } }];
  }

  if (active === "active") where.isActive = true;
  if (active === "inactive") where.isActive = false;
  if (boxType && BOX_TYPE_OPTIONS.includes(boxType as (typeof BOX_TYPE_OPTIONS)[number])) where.boxType = boxType;

  const quoteRules = await prisma.quoteRule.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { boxType: "asc" }, { quantityRange: "asc" }, { updatedAt: "desc" }],
    take: 200
  });

  return NextResponse.json({ quoteRules });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
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
      const created = await tx.quoteRule.create({
        data: toQuoteRuleCreateData(parsed.data)
      });

      await tx.quoteRuleChangeLog.create({
        data: {
          quoteRuleId: created.id,
          quoteRuleNameSnapshot: created.name,
          changeType: "CREATED",
          beforeJson: null,
          afterJson: serializeQuoteRuleForLog(created),
          changeReason,
          changedBy: "admin"
        }
      });

      return created;
    });

    return NextResponse.json({ quoteRule }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: "이미 사용 중인 룰 이름입니다." }, { status: 409 });
    }

    return NextResponse.json({ message: "견적 룰 저장 중 문제가 발생했습니다." }, { status: 500 });
  }
}
