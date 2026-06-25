-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "closedAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "confirmedOrderAmountKrw" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "lostReason" TEXT;
ALTER TABLE "Lead" ADD COLUMN "orderConfirmedAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "quotedAt" DATETIME;

-- CreateTable
CREATE TABLE "MarketingCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costDate" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "amountKrw" INTEGER NOT NULL,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "MarketingCost_costDate_idx" ON "MarketingCost"("costDate");

-- CreateIndex
CREATE INDEX "MarketingCost_channel_idx" ON "MarketingCost"("channel");

-- CreateIndex
CREATE INDEX "MarketingCost_utmSource_idx" ON "MarketingCost"("utmSource");

-- CreateIndex
CREATE INDEX "MarketingCost_utmCampaign_idx" ON "MarketingCost"("utmCampaign");

-- CreateIndex
CREATE INDEX "Lead_quotedAt_idx" ON "Lead"("quotedAt");

-- CreateIndex
CREATE INDEX "Lead_orderConfirmedAt_idx" ON "Lead"("orderConfirmedAt");

-- CreateIndex
CREATE INDEX "Lead_closedAt_idx" ON "Lead"("closedAt");

-- CreateIndex
CREATE INDEX "Lead_utmCampaign_idx" ON "Lead"("utmCampaign");
