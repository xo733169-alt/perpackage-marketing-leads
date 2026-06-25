import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { portfolioCaseSchema, toPortfolioFieldErrors, type PortfolioCaseInput } from "@/lib/portfolio-schema";
import { buildPortfolioCaseWhere, stringifyStringList } from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";

function toPortfolioData(input: PortfolioCaseInput): Prisma.PortfolioCaseUncheckedCreateInput {
  const now = new Date();

  return {
    title: input.title,
    slug: input.slug,
    status: input.status,
    featured: input.featured,
    sortOrder: input.sortOrder ?? 0,
    industry: input.industry,
    boxType: input.boxType,
    packageStructure: input.packageStructure ?? null,
    casePurpose: input.casePurpose ?? null,
    productName: input.productName ?? null,
    clientName: input.clientName ?? null,
    isClientNamePublic: input.isClientNamePublic,
    quantityRange: input.quantityRange ?? null,
    widthMm: input.widthMm ?? null,
    depthMm: input.depthMm ?? null,
    heightMm: input.heightMm ?? null,
    paperType: input.paperType ?? null,
    boardThickness: input.boardThickness ?? null,
    printOption: input.printOption ?? null,
    finishingOptions: stringifyStringList(input.finishingOptions),
    mainImageUrl: input.mainImageUrl ?? null,
    mainImageAlt: input.mainImageAlt ?? null,
    imageCaption: input.imageCaption ?? null,
    imageUrls: stringifyStringList(input.imageUrls),
    shortDescription: input.shortDescription,
    projectOverview: input.projectOverview ?? null,
    productionPoint: input.productionPoint ?? null,
    specificationSummary: input.specificationSummary ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    tags: stringifyStringList(input.tags),
    publicApprovalConfirmed: input.publicApprovalConfirmed,
    publicApprovalMemo: input.publicApprovalMemo ?? null,
    publicApprovalBy: input.publicApprovalBy ?? null,
    publicApprovedAt: input.publicApprovalConfirmed ? now : null,
    publishedAt: input.status === "PUBLISHED" ? now : null
  };
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const where = buildPortfolioCaseWhere(searchParams, { includeStatus: true });

  const cases = await prisma.portfolioCase.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 100
  });

  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = portfolioCaseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "입력 내용을 확인해 주세요.", fieldErrors: toPortfolioFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const portfolioCase = await prisma.portfolioCase.create({
      data: toPortfolioData(parsed.data)
    });

    return NextResponse.json({ portfolioCase }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: "이미 사용 중인 슬러그입니다." }, { status: 409 });
    }

    return NextResponse.json({ message: "제작 사례 저장 중 문제가 발생했습니다." }, { status: 500 });
  }
}
