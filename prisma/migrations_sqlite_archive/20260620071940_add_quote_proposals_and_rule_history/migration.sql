-- CreateTable
CREATE TABLE "QuoteProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "proposalNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
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

-- CreateTable
CREATE TABLE "QuoteProposalItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteProposalId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceKrw" INTEGER NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteProposalItem_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteRuleChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteRuleId" TEXT,
    "quoteRuleNameSnapshot" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "changeReason" TEXT,
    "changedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteRuleChangeLog_quoteRuleId_fkey" FOREIGN KEY ("quoteRuleId") REFERENCES "QuoteRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteProposal_proposalNumber_key" ON "QuoteProposal"("proposalNumber");

-- CreateIndex
CREATE INDEX "QuoteProposal_leadId_idx" ON "QuoteProposal"("leadId");

-- CreateIndex
CREATE INDEX "QuoteProposal_status_idx" ON "QuoteProposal"("status");

-- CreateIndex
CREATE INDEX "QuoteProposal_proposalNumber_idx" ON "QuoteProposal"("proposalNumber");

-- CreateIndex
CREATE INDEX "QuoteProposal_createdAt_idx" ON "QuoteProposal"("createdAt");

-- CreateIndex
CREATE INDEX "QuoteProposal_validUntil_idx" ON "QuoteProposal"("validUntil");

-- CreateIndex
CREATE INDEX "QuoteProposal_boxType_idx" ON "QuoteProposal"("boxType");

-- CreateIndex
CREATE INDEX "QuoteProposalItem_quoteProposalId_idx" ON "QuoteProposalItem"("quoteProposalId");

-- CreateIndex
CREATE INDEX "QuoteProposalItem_sortOrder_idx" ON "QuoteProposalItem"("sortOrder");

-- CreateIndex
CREATE INDEX "QuoteRuleChangeLog_quoteRuleId_idx" ON "QuoteRuleChangeLog"("quoteRuleId");

-- CreateIndex
CREATE INDEX "QuoteRuleChangeLog_changeType_idx" ON "QuoteRuleChangeLog"("changeType");

-- CreateIndex
CREATE INDEX "QuoteRuleChangeLog_createdAt_idx" ON "QuoteRuleChangeLog"("createdAt");
