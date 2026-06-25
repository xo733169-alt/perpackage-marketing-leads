-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "kakaoId" TEXT,
    "industry" TEXT NOT NULL,
    "boxType" TEXT NOT NULL,
    "widthMm" INTEGER,
    "depthMm" INTEGER,
    "heightMm" INTEGER,
    "quantityRange" TEXT NOT NULL,
    "printOption" TEXT NOT NULL,
    "finishingOptions" TEXT,
    "desiredDeliveryDate" DATETIME,
    "budgetRange" TEXT,
    "referenceNote" TEXT,
    "message" TEXT,
    "packageType" TEXT,
    "packageStructure" TEXT,
    "quantity" TEXT,
    "sizeInfo" TEXT,
    "hasPhysicalProduct" TEXT,
    "hasDesignFile" TEXT,
    "hasDieline" TEXT,
    "desiredDueDate" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "readinessChecklist" TEXT,
    "readinessScore" INTEGER,
    "consultationNotes" TEXT,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "privacyConsentAt" DATETIME,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" DATETIME,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "referrer" TEXT,
    "landingPath" TEXT,
    "sourceCaseSlug" TEXT,
    "sourceCaseTitle" TEXT,
    "estimatedUnitPriceMinKrw" INTEGER,
    "estimatedUnitPriceMaxKrw" INTEGER,
    "estimatedTotalPriceMinKrw" INTEGER,
    "estimatedTotalPriceMaxKrw" INTEGER,
    "estimateLabel" TEXT,
    "estimateDisclaimer" TEXT,
    "quoteComplexityLevel" TEXT,
    "quoteConfidenceLevel" TEXT,
    "quoteCalculationNotes" TEXT,
    "quoteMissingFields" TEXT,
    "estimatedPriceRange" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "nextFollowUpAt" DATETIME,
    "lastContactedAt" DATETIME,
    "salesNote" TEXT,
    "quotedAt" DATETIME,
    "orderConfirmedAt" DATETIME,
    "closedAt" DATETIME,
    "confirmedOrderAmountKrw" INTEGER,
    "lostReason" TEXT,
    "adminMemo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Lead" ("adminMemo", "boxType", "budgetRange", "closedAt", "companyName", "confirmedOrderAmountKrw", "createdAt", "customerName", "depthMm", "desiredDeliveryDate", "email", "estimateDisclaimer", "estimateLabel", "estimatedPriceRange", "estimatedTotalPriceMaxKrw", "estimatedTotalPriceMinKrw", "estimatedUnitPriceMaxKrw", "estimatedUnitPriceMinKrw", "finishingOptions", "heightMm", "id", "industry", "kakaoId", "landingPath", "lastContactedAt", "leadScore", "lostReason", "marketingConsent", "marketingConsentAt", "message", "nextFollowUpAt", "orderConfirmedAt", "phone", "printOption", "privacyConsent", "privacyConsentAt", "quantityRange", "quoteCalculationNotes", "quoteComplexityLevel", "quoteConfidenceLevel", "quoteMissingFields", "quotedAt", "referenceNote", "referrer", "salesNote", "sourceCaseSlug", "sourceCaseTitle", "status", "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm", "widthMm") SELECT "adminMemo", "boxType", "budgetRange", "closedAt", "companyName", "confirmedOrderAmountKrw", "createdAt", "customerName", "depthMm", "desiredDeliveryDate", "email", "estimateDisclaimer", "estimateLabel", "estimatedPriceRange", "estimatedTotalPriceMaxKrw", "estimatedTotalPriceMinKrw", "estimatedUnitPriceMaxKrw", "estimatedUnitPriceMinKrw", "finishingOptions", "heightMm", "id", "industry", "kakaoId", "landingPath", "lastContactedAt", "leadScore", "lostReason", "marketingConsent", "marketingConsentAt", "message", "nextFollowUpAt", "orderConfirmedAt", "phone", "printOption", "privacyConsent", "privacyConsentAt", "quantityRange", "quoteCalculationNotes", "quoteComplexityLevel", "quoteConfidenceLevel", "quoteMissingFields", "quotedAt", "referenceNote", "referrer", "salesNote", "sourceCaseSlug", "sourceCaseTitle", "status", "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm", "widthMm" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_leadScore_idx" ON "Lead"("leadScore");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");
CREATE INDEX "Lead_lastContactedAt_idx" ON "Lead"("lastContactedAt");
CREATE INDEX "Lead_quotedAt_idx" ON "Lead"("quotedAt");
CREATE INDEX "Lead_orderConfirmedAt_idx" ON "Lead"("orderConfirmedAt");
CREATE INDEX "Lead_closedAt_idx" ON "Lead"("closedAt");
CREATE INDEX "Lead_utmSource_idx" ON "Lead"("utmSource");
CREATE INDEX "Lead_utmCampaign_idx" ON "Lead"("utmCampaign");
CREATE INDEX "Lead_sourceCaseSlug_idx" ON "Lead"("sourceCaseSlug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
