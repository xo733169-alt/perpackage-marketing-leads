-- CreateTable
CREATE TABLE "QuoteProposalShareLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteProposalId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPreview" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "firstViewedAt" DATETIME,
    "lastViewedAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteProposalShareLink_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteProposalCustomerResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteProposalId" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "message" TEXT,
    "responderName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteProposalCustomerResponse_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteProposalCustomerResponse_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "QuoteProposalShareLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "quoteProposalId" TEXT,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteActivityLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuoteActivityLog_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteProposalShareLink_tokenHash_key" ON "QuoteProposalShareLink"("tokenHash");

-- CreateIndex
CREATE INDEX "QuoteProposalShareLink_quoteProposalId_idx" ON "QuoteProposalShareLink"("quoteProposalId");

-- CreateIndex
CREATE INDEX "QuoteProposalShareLink_status_idx" ON "QuoteProposalShareLink"("status");

-- CreateIndex
CREATE INDEX "QuoteProposalShareLink_expiresAt_idx" ON "QuoteProposalShareLink"("expiresAt");

-- CreateIndex
CREATE INDEX "QuoteProposalShareLink_createdAt_idx" ON "QuoteProposalShareLink"("createdAt");

-- CreateIndex
CREATE INDEX "QuoteProposalCustomerResponse_quoteProposalId_idx" ON "QuoteProposalCustomerResponse"("quoteProposalId");

-- CreateIndex
CREATE INDEX "QuoteProposalCustomerResponse_responseType_idx" ON "QuoteProposalCustomerResponse"("responseType");

-- CreateIndex
CREATE INDEX "QuoteProposalCustomerResponse_createdAt_idx" ON "QuoteProposalCustomerResponse"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteProposalCustomerResponse_shareLinkId_key" ON "QuoteProposalCustomerResponse"("shareLinkId");

-- CreateIndex
CREATE INDEX "QuoteActivityLog_leadId_idx" ON "QuoteActivityLog"("leadId");

-- CreateIndex
CREATE INDEX "QuoteActivityLog_quoteProposalId_idx" ON "QuoteActivityLog"("quoteProposalId");

-- CreateIndex
CREATE INDEX "QuoteActivityLog_type_idx" ON "QuoteActivityLog"("type");

-- CreateIndex
CREATE INDEX "QuoteActivityLog_actor_idx" ON "QuoteActivityLog"("actor");

-- CreateIndex
CREATE INDEX "QuoteActivityLog_createdAt_idx" ON "QuoteActivityLog"("createdAt");
