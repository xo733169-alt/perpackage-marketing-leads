-- CreateTable
CREATE TABLE "LeadCommunicationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "contactedAt" DATETIME NOT NULL,
    "nextFollowUpAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeadCommunicationLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuoteProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "proposalNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "revisionGroupId" TEXT,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "parentProposalId" TEXT,
    "supersededByProposalId" TEXT,
    "isLatestRevision" BOOLEAN NOT NULL DEFAULT true,
    "revisionReason" TEXT,
    "revisedFromCustomerResponseId" TEXT,
    "supersededAt" DATETIME,
    "title" TEXT NOT NULL,
    "customerNameSnapshot" TEXT NOT NULL,
    "companyNameSnapshot" TEXT,
    "phoneSnapshot" TEXT,
    "emailSnapshot" TEXT,
    "kakaoIdSnapshot" TEXT,
    "boxType" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "quantityLabel" TEXT,
    "quantityCount" INTEGER,
    "specificationSummary" TEXT,
    "productionNotes" TEXT,
    "deliveryEstimateText" TEXT,
    "paymentTerms" TEXT,
    "validUntil" DATETIME,
    "subtotalAmountKrw" INTEGER NOT NULL DEFAULT 0,
    "vatAmountKrw" INTEGER NOT NULL DEFAULT 0,
    "totalAmountKrw" INTEGER NOT NULL DEFAULT 0,
    "vatIncluded" BOOLEAN NOT NULL DEFAULT false,
    "customerMessage" TEXT,
    "internalMemo" TEXT,
    "basedOnEstimateLabel" TEXT,
    "basedOnUnitPriceMinKrw" INTEGER,
    "basedOnUnitPriceMaxKrw" INTEGER,
    "basedOnTotalPriceMinKrw" INTEGER,
    "basedOnTotalPriceMaxKrw" INTEGER,
    "estimateComparisonStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteProposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuoteProposal" ("basedOnEstimateLabel", "basedOnTotalPriceMaxKrw", "basedOnTotalPriceMinKrw", "basedOnUnitPriceMaxKrw", "basedOnUnitPriceMinKrw", "boxType", "companyNameSnapshot", "createdAt", "customerMessage", "customerNameSnapshot", "deliveryEstimateText", "emailSnapshot", "estimateComparisonStatus", "id", "industry", "internalMemo", "kakaoIdSnapshot", "leadId", "paymentTerms", "phoneSnapshot", "productionNotes", "proposalNumber", "quantityCount", "quantityLabel", "specificationSummary", "status", "subtotalAmountKrw", "title", "totalAmountKrw", "updatedAt", "validUntil", "vatAmountKrw", "vatIncluded") SELECT "basedOnEstimateLabel", "basedOnTotalPriceMaxKrw", "basedOnTotalPriceMinKrw", "basedOnUnitPriceMaxKrw", "basedOnUnitPriceMinKrw", "boxType", "companyNameSnapshot", "createdAt", "customerMessage", "customerNameSnapshot", "deliveryEstimateText", "emailSnapshot", "estimateComparisonStatus", "id", "industry", "internalMemo", "kakaoIdSnapshot", "leadId", "paymentTerms", "phoneSnapshot", "productionNotes", "proposalNumber", "quantityCount", "quantityLabel", "specificationSummary", "status", "subtotalAmountKrw", "title", "totalAmountKrw", "updatedAt", "validUntil", "vatAmountKrw", "vatIncluded" FROM "QuoteProposal";
DROP TABLE "QuoteProposal";
ALTER TABLE "new_QuoteProposal" RENAME TO "QuoteProposal";
CREATE UNIQUE INDEX "QuoteProposal_proposalNumber_key" ON "QuoteProposal"("proposalNumber");
CREATE INDEX "QuoteProposal_leadId_idx" ON "QuoteProposal"("leadId");
CREATE INDEX "QuoteProposal_status_idx" ON "QuoteProposal"("status");
CREATE INDEX "QuoteProposal_proposalNumber_idx" ON "QuoteProposal"("proposalNumber");
CREATE INDEX "QuoteProposal_revisionGroupId_idx" ON "QuoteProposal"("revisionGroupId");
CREATE INDEX "QuoteProposal_revisionNumber_idx" ON "QuoteProposal"("revisionNumber");
CREATE INDEX "QuoteProposal_parentProposalId_idx" ON "QuoteProposal"("parentProposalId");
CREATE INDEX "QuoteProposal_supersededByProposalId_idx" ON "QuoteProposal"("supersededByProposalId");
CREATE INDEX "QuoteProposal_isLatestRevision_idx" ON "QuoteProposal"("isLatestRevision");
CREATE INDEX "QuoteProposal_revisedFromCustomerResponseId_idx" ON "QuoteProposal"("revisedFromCustomerResponseId");
CREATE INDEX "QuoteProposal_createdAt_idx" ON "QuoteProposal"("createdAt");
CREATE INDEX "QuoteProposal_validUntil_idx" ON "QuoteProposal"("validUntil");
CREATE INDEX "QuoteProposal_boxType_idx" ON "QuoteProposal"("boxType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LeadCommunicationLog_leadId_idx" ON "LeadCommunicationLog"("leadId");

-- CreateIndex
CREATE INDEX "LeadCommunicationLog_channel_idx" ON "LeadCommunicationLog"("channel");

-- CreateIndex
CREATE INDEX "LeadCommunicationLog_direction_idx" ON "LeadCommunicationLog"("direction");

-- CreateIndex
CREATE INDEX "LeadCommunicationLog_contactedAt_idx" ON "LeadCommunicationLog"("contactedAt");

-- CreateIndex
CREATE INDEX "LeadCommunicationLog_nextFollowUpAt_idx" ON "LeadCommunicationLog"("nextFollowUpAt");
