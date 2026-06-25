import { NextResponse } from "next/server";
import { calculateLeadScore } from "@/lib/lead-score";
import { leadCreateSchema, toFieldErrors } from "@/lib/lead-schema";
import { notifyLeadCreated } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { calculateReferenceQuote } from "@/lib/quote-engine";
import { toQuoteRuleConfig, stringifyStringList } from "@/lib/quote-rule-utils";

function stringifyFlexibleField(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "입력 내용을 다시 확인해 주세요." }, { status: 400 });
    }

    if (typeof body?.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true });
    }

    const parsed = leadCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "입력 내용을 다시 확인해 주세요.",
          fieldErrors: toFieldErrors(parsed.error)
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const leadScore = calculateLeadScore(input);
    const now = new Date();
    const quoteRules = await prisma.quoteRule.findMany({
      where: { isActive: true },
      orderBy: [{ boxType: "asc" }, { quantityRange: "asc" }, { updatedAt: "desc" }]
    });
    const quote = calculateReferenceQuote(input, quoteRules.map(toQuoteRuleConfig));

    const lead = await prisma.lead.create({
      data: {
        customerName: input.customerName,
        companyName: input.companyName ?? null,
        phone: input.phone,
        email: input.email ?? null,
        kakaoId: input.kakaoId ?? null,
        industry: input.industry,
        boxType: input.boxType,
        widthMm: input.widthMm ?? null,
        depthMm: input.depthMm ?? null,
        heightMm: input.heightMm ?? null,
        quantityRange: input.quantityRange,
        printOption: input.printOption,
        finishingOptions: JSON.stringify(input.finishingOptions ?? []),
        desiredDeliveryDate: input.desiredDeliveryDate ? new Date(input.desiredDeliveryDate) : null,
        budgetRange: input.budgetRange ?? null,
        referenceNote: input.referenceNote ?? null,
        message: input.message ?? null,
        packageType: input.packageType ?? null,
        packageStructure: input.packageStructure ?? null,
        quantity: input.quantity ?? null,
        sizeInfo: input.sizeInfo ?? null,
        hasPhysicalProduct: input.hasPhysicalProduct ?? null,
        hasDesignFile: input.hasDesignFile ?? null,
        hasDieline: input.hasDieline ?? null,
        desiredDueDate: input.desiredDueDate ?? null,
        isUrgent: input.isUrgent ?? false,
        readinessChecklist: stringifyFlexibleField(input.readinessChecklist),
        readinessScore: input.readinessScore ?? null,
        consultationNotes: input.consultationNotes ?? null,
        privacyConsent: input.privacyConsent,
        privacyConsentAt: now,
        marketingConsent: input.marketingConsent,
        marketingConsentAt: input.marketingConsent ? now : null,
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
        utmTerm: input.utmTerm ?? null,
        utmContent: input.utmContent ?? null,
        referrer: input.referrer ?? null,
        landingPath: input.landingPath ?? null,
        sourceCaseSlug: input.sourceCaseSlug ?? null,
        sourceCaseTitle: input.sourceCaseTitle ?? null,
        estimatedUnitPriceMinKrw: quote.estimatedUnitPriceMinKrw,
        estimatedUnitPriceMaxKrw: quote.estimatedUnitPriceMaxKrw,
        estimatedTotalPriceMinKrw: quote.estimatedTotalPriceMinKrw,
        estimatedTotalPriceMaxKrw: quote.estimatedTotalPriceMaxKrw,
        estimateLabel: quote.estimateLabel,
        estimateDisclaimer: quote.estimateDisclaimer,
        quoteComplexityLevel: quote.complexityLevel,
        quoteConfidenceLevel: quote.confidenceLevel,
        quoteCalculationNotes: stringifyStringList(quote.calculationNotes),
        quoteMissingFields: stringifyStringList(quote.missingFields),
        estimatedPriceRange: `${quote.estimateLabel}. ${quote.estimateDisclaimer}`,
        leadScore
      }
    });

    await notifyLeadCreated(lead);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
