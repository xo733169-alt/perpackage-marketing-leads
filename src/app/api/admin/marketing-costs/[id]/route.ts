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

function toMarketingCostUpdateData(input: MarketingCostInput): Prisma.MarketingCostUncheckedUpdateInput {
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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const cost = await prisma.marketingCost.findUnique({
    where: { id: params.id }
  });

  if (!cost) {
    return NextResponse.json({ message: "마케팅 비용 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ cost });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const existing = await prisma.marketingCost.findUnique({
    where: { id: params.id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: "마케팅 비용 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const cost = await prisma.marketingCost.update({
    where: { id: params.id },
    data: toMarketingCostUpdateData(parsed.data)
  });

  return NextResponse.json({ cost });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existing = await prisma.marketingCost.findUnique({
    where: { id: params.id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: "마케팅 비용 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.marketingCost.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ ok: true });
}
