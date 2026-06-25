-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "estimateDisclaimer" TEXT;
ALTER TABLE "Lead" ADD COLUMN "estimateLabel" TEXT;
ALTER TABLE "Lead" ADD COLUMN "estimatedTotalPriceMaxKrw" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "estimatedTotalPriceMinKrw" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "estimatedUnitPriceMaxKrw" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "estimatedUnitPriceMinKrw" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "quoteCalculationNotes" TEXT;
ALTER TABLE "Lead" ADD COLUMN "quoteComplexityLevel" TEXT;
ALTER TABLE "Lead" ADD COLUMN "quoteConfidenceLevel" TEXT;
ALTER TABLE "Lead" ADD COLUMN "quoteMissingFields" TEXT;

-- CreateTable
CREATE TABLE "QuoteRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "boxType" TEXT NOT NULL,
    "quantityRange" TEXT NOT NULL,
    "minQuantity" INTEGER,
    "maxQuantity" INTEGER,
    "baseUnitPriceMinKrw" INTEGER NOT NULL,
    "baseUnitPriceMaxKrw" INTEGER NOT NULL,
    "sizeSmallThreshold" INTEGER NOT NULL DEFAULT 500000,
    "sizeMediumThreshold" INTEGER NOT NULL DEFAULT 2000000,
    "sizeLargeThreshold" INTEGER NOT NULL DEFAULT 6000000,
    "smallSizeMultiplier" REAL NOT NULL DEFAULT 0.9,
    "mediumSizeMultiplier" REAL NOT NULL DEFAULT 1,
    "largeSizeMultiplier" REAL NOT NULL DEFAULT 1.25,
    "extraLargeSizeMultiplier" REAL NOT NULL DEFAULT 1.55,
    "printNoneMultiplier" REAL NOT NULL DEFAULT 1,
    "printOneColorMultiplier" REAL NOT NULL DEFAULT 1.08,
    "printFullColorMultiplier" REAL NOT NULL DEFAULT 1.18,
    "printFoilEmbossMultiplier" REAL NOT NULL DEFAULT 1.3,
    "finishingBaseAddMinKrw" INTEGER NOT NULL DEFAULT 0,
    "finishingBaseAddMaxKrw" INTEGER NOT NULL DEFAULT 0,
    "complexityLowMultiplier" REAL NOT NULL DEFAULT 0.95,
    "complexityNormalMultiplier" REAL NOT NULL DEFAULT 1,
    "complexityHighMultiplier" REAL NOT NULL DEFAULT 1.18,
    "complexityVeryHighMultiplier" REAL NOT NULL DEFAULT 1.35,
    "minOrderPriceKrw" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRule_name_key" ON "QuoteRule"("name");

-- CreateIndex
CREATE INDEX "QuoteRule_isActive_idx" ON "QuoteRule"("isActive");

-- CreateIndex
CREATE INDEX "QuoteRule_boxType_idx" ON "QuoteRule"("boxType");

-- CreateIndex
CREATE INDEX "QuoteRule_quantityRange_idx" ON "QuoteRule"("quantityRange");
