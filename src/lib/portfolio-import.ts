import { portfolioCaseSchema, type PortfolioCaseInput } from "./portfolio-schema";

export function preparePortfolioImportRecord(input: unknown): PortfolioCaseInput {
  if (!input || typeof input !== "object") {
    return portfolioCaseSchema.parse(input);
  }

  return portfolioCaseSchema.parse({
    status: "DRAFT",
    featured: false,
    sortOrder: 0,
    publicApprovalConfirmed: false,
    ...input
  });
}

export function preparePortfolioImportRecords(input: unknown): PortfolioCaseInput[] {
  const records = Array.isArray(input)
    ? input
    : input && typeof input === "object" && "cases" in input && Array.isArray(input.cases)
      ? input.cases
      : [];

  return records.map((record) => preparePortfolioImportRecord(record));
}
