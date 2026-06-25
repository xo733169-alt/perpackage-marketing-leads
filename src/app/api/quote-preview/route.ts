import { NextResponse } from "next/server";
import { z } from "zod";
import { FINISHING_OPTION_OPTIONS } from "@/lib/lead-options";
import { calculateReferenceQuote, toPublicReferenceQuotePreview } from "@/lib/quote-engine";
import { toQuoteRuleConfig } from "@/lib/quote-rule-utils";
import { prisma } from "@/lib/prisma";

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().int().positive().optional());

const previewSchema = z.object({
  boxType: z.string().max(80).optional().nullable(),
  quantityRange: z.string().max(80).optional().nullable(),
  widthMm: optionalNumber,
  depthMm: optionalNumber,
  heightMm: optionalNumber,
  printOption: z.string().max(80).optional().nullable(),
  finishingOptions: z.array(z.enum(FINISHING_OPTION_OPTIONS)).optional().default([])
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = previewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "입력 내용을 확인해 주세요." }, { status: 400 });
  }

  const rules = await prisma.quoteRule.findMany({
    where: { isActive: true },
    orderBy: [{ boxType: "asc" }, { quantityRange: "asc" }, { updatedAt: "desc" }]
  });

  const result = calculateReferenceQuote(parsed.data, rules.map(toQuoteRuleConfig));

  return NextResponse.json({
    quote: toPublicReferenceQuotePreview(result)
  });
}
