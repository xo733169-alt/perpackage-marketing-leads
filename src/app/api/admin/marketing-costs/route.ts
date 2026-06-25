import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import {
  marketingCostSchema,
  toMarketingCostDate,
  toMarketingCostFieldErrors,
  type MarketingCostInput
} from "@/lib/marketing-cost-schema";
import { prisma } from "@/lib/prisma";

function toMarketingCostData(input: MarketingCostInput): Prisma.MarketingCostUncheckedCreateInput {
  return {
    costDate: toMarketingCostDate(input.costDate),
    channel: input.channel,
    utmSource: input.utmSource ?? null,
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
    amountKrw: input.amountKrw,
    memo: input.memo ?? null
  };
}

function parseDate(value: string | null, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"), true);
  const channel = searchParams.get("channel")?.trim();
  const source = searchParams.get("utmSource")?.trim();

  const where: Prisma.MarketingCostWhereInput = {};

  if (from || to) {
    where.costDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  if (channel) {
    where.channel = channel;
  }

  if (source) {
    where.utmSource = { contains: source };
  }

  const costs = await prisma.marketingCost.findMany({
    where,
    orderBy: [{ costDate: "desc" }, { createdAt: "desc" }],
    take: 200
  });

  return NextResponse.json({ costs });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = marketingCostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "입력 내용을 확인해 주세요.", fieldErrors: toMarketingCostFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const cost = await prisma.marketingCost.create({
    data: toMarketingCostData(parsed.data)
  });

  return NextResponse.json({ cost }, { status: 201 });
}
