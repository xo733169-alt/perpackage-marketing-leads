import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { portfolioCaseSchema, toPortfolioFieldErrors, type PortfolioCaseInput } from "@/lib/portfolio-schema";
import { stringifyStringList } from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";

type ExistingPortfolioState = {
  publishedAt: Date | null;
  publicApprovedAt: Date | null;
};

function toPortfolioUpdateData(
  input: PortfolioCaseInput,
  existing: ExistingPortfolioState
): Prisma.PortfolioCaseUncheckedUpdateInput {
  const publicApprovedAt = input.publicApprovalConfirmed
    ? existing.publicApprovedAt ?? new Date()
    : null;

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
    publicApprovedAt,
    publishedAt: input.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt
  };
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const portfolioCase = await prisma.portfolioCase.findUnique({
    where: { id: params.id }
  });

  if (!portfolioCase) {
    return NextResponse.json({ message: "제작 사례를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ portfolioCase });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existingCase = await prisma.portfolioCase.findUnique({
    where: { id: params.id },
    select: {
      publishedAt: true,
      publicApprovedAt: true
    }
  });

  if (!existingCase) {
    return NextResponse.json({ message: "제작 사례를 찾을 수 없습니다." }, { status: 404 });
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
    const portfolioCase = await prisma.portfolioCase.update({
      where: { id: params.id },
      data: toPortfolioUpdateData(parsed.data, existingCase)
    });

    return NextResponse.json({ portfolioCase });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: "이미 사용 중인 슬러그입니다." }, { status: 409 });
    }

    return NextResponse.json({ message: "제작 사례 저장 중 문제가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const existingCase = await prisma.portfolioCase.findUnique({
    where: { id: params.id },
    select: { id: true }
  });

  if (!existingCase) {
    return NextResponse.json({ message: "제작 사례를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.portfolioCase.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ ok: true });
}
