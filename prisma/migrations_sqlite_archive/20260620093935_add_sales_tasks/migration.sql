-- CreateTable
CREATE TABLE "SalesTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "quoteProposalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "assignedTo" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesTask_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SalesTask_leadId_idx" ON "SalesTask"("leadId");

-- CreateIndex
CREATE INDEX "SalesTask_quoteProposalId_idx" ON "SalesTask"("quoteProposalId");

-- CreateIndex
CREATE INDEX "SalesTask_type_idx" ON "SalesTask"("type");

-- CreateIndex
CREATE INDEX "SalesTask_priority_idx" ON "SalesTask"("priority");

-- CreateIndex
CREATE INDEX "SalesTask_status_idx" ON "SalesTask"("status");

-- CreateIndex
CREATE INDEX "SalesTask_dueAt_idx" ON "SalesTask"("dueAt");

-- CreateIndex
CREATE INDEX "SalesTask_sourceType_idx" ON "SalesTask"("sourceType");

-- CreateIndex
CREATE INDEX "SalesTask_sourceId_idx" ON "SalesTask"("sourceId");

-- CreateIndex
CREATE INDEX "SalesTask_createdAt_idx" ON "SalesTask"("createdAt");
