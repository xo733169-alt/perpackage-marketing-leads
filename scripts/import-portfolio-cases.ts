// @ts-nocheck
const fs = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");

const prisma = new PrismaClient();

const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const portfolioImportSchema = z
  .object({
    title: z.string().trim().min(1),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    status: z.enum(statuses).optional().default("DRAFT"),
    featured: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
    industry: z.string().trim().min(1),
    boxType: z.string().trim().min(1),
    productName: z.string().trim().optional().default(""),
    clientName: z.string().trim().optional().default(""),
    isClientNamePublic: z.boolean().optional().default(false),
    quantityRange: z.string().trim().optional().default(""),
    widthMm: z.number().int().positive().optional(),
    depthMm: z.number().int().positive().optional(),
    heightMm: z.number().int().positive().optional(),
    paperType: z.string().trim().optional().default(""),
    boardThickness: z.string().trim().optional().default(""),
    printOption: z.string().trim().optional().default(""),
    finishingOptions: z.array(z.string().trim()).optional().default([]),
    mainImageUrl: z.string().trim().optional().default(""),
    mainImageAlt: z.string().trim().optional().default(""),
    imageCaption: z.string().trim().optional().default(""),
    imageUrls: z.array(z.string().trim()).optional().default([]),
    shortDescription: z.string().trim().min(1),
    projectOverview: z.string().trim().optional().default(""),
    productionPoint: z.string().trim().optional().default(""),
    specificationSummary: z.string().trim().optional().default(""),
    seoTitle: z.string().trim().optional().default(""),
    seoDescription: z.string().trim().optional().default(""),
    tags: z.array(z.string().trim()).optional().default([]),
    publicApprovalConfirmed: z.boolean().optional().default(false),
    publicApprovalMemo: z.string().trim().optional().default(""),
    publicApprovalBy: z.string().trim().optional().default("")
  })
  .superRefine((record, context) => {
    if (record.status === "PUBLISHED" && !record.publicApprovalConfirmed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publicApprovalConfirmed"],
        message: "PUBLISHED 상태로 import하려면 publicApprovalConfirmed가 true여야 합니다."
      });
    }
  });

function toNullable(value) {
  return value === undefined || value === null || value === "" ? null : value;
}

function stringifyList(value) {
  const cleaned = Array.from(new Set((value || []).map((item) => String(item).trim()).filter(Boolean)));
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function toPrismaData(record, existing) {
  const now = new Date();
  return {
    title: record.title,
    slug: record.slug,
    status: record.status,
    featured: record.featured,
    sortOrder: record.sortOrder,
    industry: record.industry,
    boxType: record.boxType,
    productName: toNullable(record.productName),
    clientName: toNullable(record.clientName),
    isClientNamePublic: record.isClientNamePublic,
    quantityRange: toNullable(record.quantityRange),
    widthMm: record.widthMm ?? null,
    depthMm: record.depthMm ?? null,
    heightMm: record.heightMm ?? null,
    paperType: toNullable(record.paperType),
    boardThickness: toNullable(record.boardThickness),
    printOption: toNullable(record.printOption),
    finishingOptions: stringifyList(record.finishingOptions),
    mainImageUrl: toNullable(record.mainImageUrl),
    mainImageAlt: toNullable(record.mainImageAlt),
    imageCaption: toNullable(record.imageCaption),
    imageUrls: stringifyList(record.imageUrls),
    shortDescription: record.shortDescription,
    projectOverview: toNullable(record.projectOverview),
    productionPoint: toNullable(record.productionPoint),
    specificationSummary: toNullable(record.specificationSummary),
    seoTitle: toNullable(record.seoTitle),
    seoDescription: toNullable(record.seoDescription),
    tags: stringifyList(record.tags),
    publicApprovalConfirmed: record.publicApprovalConfirmed,
    publicApprovalMemo: toNullable(record.publicApprovalMemo),
    publicApprovalBy: toNullable(record.publicApprovalBy),
    publicApprovedAt: record.publicApprovalConfirmed ? existing?.publicApprovedAt ?? now : null,
    publishedAt: record.status === "PUBLISHED" ? existing?.publishedAt ?? now : existing?.publishedAt ?? null
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filePath = args.find((arg) => arg !== "--dry-run");

  if (!filePath) {
    console.error("Usage: pnpm portfolio:import <json-file> [--dry-run]");
    process.exitCode = 1;
    return;
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsedJson = JSON.parse(raw);
  const sourceRecords = Array.isArray(parsedJson) ? parsedJson : parsedJson.cases;

  if (!Array.isArray(sourceRecords)) {
    throw new Error("JSON file must be an array or an object with a cases array.");
  }

  const summary = {
    totalRead: sourceRecords.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const [index, sourceRecord] of sourceRecords.entries()) {
    const parsed = portfolioImportSchema.safeParse(sourceRecord);

    if (!parsed.success) {
      summary.skipped += 1;
      summary.errors.push({
        index,
        title: sourceRecord?.title || "",
        errors: parsed.error.flatten().fieldErrors
      });
      continue;
    }

    const record = parsed.data;
    const existing = await prisma.portfolioCase.findUnique({
      where: { slug: record.slug },
      select: { id: true, publishedAt: true, publicApprovedAt: true }
    });

    if (dryRun) {
      if (existing) summary.updated += 1;
      else summary.created += 1;
      continue;
    }

    const data = toPrismaData(record, existing);

    if (existing) {
      await prisma.portfolioCase.update({
        where: { slug: record.slug },
        data
      });
      summary.updated += 1;
    } else {
      await prisma.portfolioCase.create({
        data
      });
      summary.created += 1;
    }
  }

  console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
