import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdminAuthenticated } from "@/lib/auth";
import { QUOTE_RULE_CHANGE_TYPES, type QuoteRuleChangeType } from "@/lib/quote-rule-log";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const changeType = searchParams.get("changeType");
  const where: Prisma.QuoteRuleChangeLogWhereInput = {};

  if (q) {
    where.quoteRuleNameSnapshot = { contains: q };
  }

  if (QUOTE_RULE_CHANGE_TYPES.includes(changeType as QuoteRuleChangeType)) {
    where.changeType = changeType as QuoteRuleChangeType;
  }

  const logs = await prisma.quoteRuleChangeLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return NextResponse.json({ logs });
}
