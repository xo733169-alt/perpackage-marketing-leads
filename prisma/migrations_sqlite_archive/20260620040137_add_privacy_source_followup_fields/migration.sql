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
    "estimatedPriceRange" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "nextFollowUpAt" DATETIME,
    "lastContactedAt" DATETIME,
    "salesNote" TEXT,
    "adminMemo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Lead" ("adminMemo", "boxType", "budgetRange", "companyName", "createdAt", "customerName", "depthMm", "desiredDeliveryDate", "email", "estimatedPriceRange", "finishingOptions", "heightMm", "id", "industry", "kakaoId", "leadScore", "message", "phone", "printOption", "quantityRange", "referenceNote", "status", "updatedAt", "widthMm") SELECT "adminMemo", "boxType", "budgetRange", "companyName", "createdAt", "customerName", "depthMm", "desiredDeliveryDate", "email", "estimatedPriceRange", "finishingOptions", "heightMm", "id", "industry", "kakaoId", "leadScore", "message", "phone", "printOption", "quantityRange", "referenceNote", "status", "updatedAt", "widthMm" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_leadScore_idx" ON "Lead"("leadScore");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");
CREATE INDEX "Lead_lastContactedAt_idx" ON "Lead"("lastContactedAt");
CREATE INDEX "Lead_utmSource_idx" ON "Lead"("utmSource");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
