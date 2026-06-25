-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
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
    "desiredDeliveryDate" TIMESTAMP(3),
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
    "consultationSummaryTitle" TEXT,
    "consultationSummaryOverview" TEXT,
    "consultationPriorityNotes" TEXT,
    "consultationMissingItems" TEXT,
    "consultationRiskNotes" TEXT,
    "consultationNextActions" TEXT,
    "consultationSummaryUpdatedAt" TIMESTAMP(3),
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "privacyConsentAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
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
    "nextFollowUpAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "salesNote" TEXT,
    "quotedAt" TIMESTAMP(3),
    "orderConfirmedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "confirmedOrderAmountKrw" INTEGER,
    "lostReason" TEXT,
    "adminMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRule" (
    "id" TEXT NOT NULL,
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
    "smallSizeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "mediumSizeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "largeSizeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.25,
    "extraLargeSizeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.55,
    "printNoneMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "printOneColorMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.08,
    "printFullColorMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.18,
    "printFoilEmbossMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "finishingBaseAddMinKrw" INTEGER NOT NULL DEFAULT 0,
    "finishingBaseAddMaxKrw" INTEGER NOT NULL DEFAULT 0,
    "complexityLowMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "complexityNormalMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "complexityHighMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.18,
    "complexityVeryHighMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.35,
    "minOrderPriceKrw" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteProposal" (
    "id" TEXT NOT NULL,
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
    "supersededAt" TIMESTAMP(3),
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
    "validUntil" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteProposalItem" (
    "id" TEXT NOT NULL,
    "quoteProposalId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceKrw" INTEGER NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteProposalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteProposalShareLink" (
    "id" TEXT NOT NULL,
    "quoteProposalId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPreview" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteProposalShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteProposalCustomerResponse" (
    "id" TEXT NOT NULL,
    "quoteProposalId" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "message" TEXT,
    "responderName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteProposalCustomerResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteActivityLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "quoteProposalId" TEXT,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadCommunicationLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "contactedAt" TIMESTAMP(3) NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadCommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTask" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "quoteProposalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRuleChangeLog" (
    "id" TEXT NOT NULL,
    "quoteRuleId" TEXT,
    "quoteRuleNameSnapshot" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "changeReason" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRuleChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "industry" TEXT NOT NULL,
    "boxType" TEXT NOT NULL,
    "packageStructure" TEXT,
    "casePurpose" TEXT,
    "productName" TEXT,
    "clientName" TEXT,
    "isClientNamePublic" BOOLEAN NOT NULL DEFAULT false,
    "quantityRange" TEXT,
    "widthMm" INTEGER,
    "depthMm" INTEGER,
    "heightMm" INTEGER,
    "paperType" TEXT,
    "boardThickness" TEXT,
    "printOption" TEXT,
    "finishingOptions" TEXT,
    "mainImageUrl" TEXT,
    "mainImageAlt" TEXT,
    "imageCaption" TEXT,
    "imageUrls" TEXT,
    "shortDescription" TEXT NOT NULL,
    "projectOverview" TEXT,
    "productionPoint" TEXT,
    "specificationSummary" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "tags" TEXT,
    "publicApprovalConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "publicApprovalMemo" TEXT,
    "publicApprovedAt" TIMESTAMP(3),
    "publicApprovalBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCost" (
    "id" TEXT NOT NULL,
    "costDate" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "amountKrw" INTEGER NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_leadScore_idx" ON "Lead"("leadScore");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Lead_lastContactedAt_idx" ON "Lead"("lastContactedAt");

-- CreateIndex
CREATE INDEX "Lead_quotedAt_idx" ON "Lead"("quotedAt");

-- CreateIndex
CREATE INDEX "Lead_orderConfirmedAt_idx" ON "Lead"("orderConfirmedAt");

-- CreateIndex
CREATE INDEX "Lead_closedAt_idx" ON "Lead"("closedAt");

-- CreateIndex
CREATE INDEX "Lead_utmSource_idx" ON "Lead"("utmSource");

-- CreateIndex
CREATE INDEX "Lead_utmCampaign_idx" ON "Lead"("utmCampaign");

-- CreateIndex
CREATE INDEX "Lead_sourceCaseSlug_idx" ON "Lead"("sourceCaseSlug");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRule_name_key" ON "QuoteRule"("name");

-- CreateIndex
CREATE INDEX "QuoteRule_isActive_idx" ON "QuoteRule"("isActive");

-- CreateIndex
CREATE INDEX "QuoteRule_boxType_idx" ON "QuoteRule"("boxType");

-- CreateIndex
CREATE INDEX "QuoteRule_quantityRange_idx" ON "QuoteRule"("quantityRange");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteProposal_proposalNumber_key" ON "QuoteProposal"("proposalNumber");

-- CreateIndex
CREATE INDEX "QuoteProposal_leadId_idx" ON "QuoteProposal"("leadId");

-- CreateIndex
CREATE INDEX "QuoteProposal_status_idx" ON "QuoteProposal"("status");

-- CreateIndex
CREATE INDEX "QuoteProposal_proposalNumber_idx" ON "QuoteProposal"("proposalNumber");

-- CreateIndex
CREATE INDEX "QuoteProposal_revisionGroupId_idx" ON "QuoteProposal"("revisionGroupId");

-- CreateIndex
CREATE INDEX "QuoteProposal_revisionNumber_idx" ON "QuoteProposal"("revisionNumber");

-- CreateIndex
CREATE INDEX "QuoteProposal_parentProposalId_idx" ON "QuoteProposal"("parentProposalId");

-- CreateIndex
CREATE INDEX "QuoteProposal_supersededByProposalId_idx" ON "QuoteProposal"("supersededByProposalId");

-- CreateIndex
CREATE INDEX "QuoteProposal_isLatestRevision_idx" ON "QuoteProposal"("isLatestRevision");

-- CreateIndex
CREATE INDEX "QuoteProposal_revisedFromCustomerResponseId_idx" ON "QuoteProposal"("revisedFromCustomerResponseId");

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

-- CreateIndex
CREATE INDEX "QuoteRuleChangeLog_quoteRuleId_idx" ON "QuoteRuleChangeLog"("quoteRuleId");

-- CreateIndex
CREATE INDEX "QuoteRuleChangeLog_changeType_idx" ON "QuoteRuleChangeLog"("changeType");

-- CreateIndex
CREATE INDEX "QuoteRuleChangeLog_createdAt_idx" ON "QuoteRuleChangeLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCase_slug_key" ON "PortfolioCase"("slug");

-- CreateIndex
CREATE INDEX "PortfolioCase_status_idx" ON "PortfolioCase"("status");

-- CreateIndex
CREATE INDEX "PortfolioCase_publicApprovalConfirmed_idx" ON "PortfolioCase"("publicApprovalConfirmed");

-- CreateIndex
CREATE INDEX "PortfolioCase_featured_idx" ON "PortfolioCase"("featured");

-- CreateIndex
CREATE INDEX "PortfolioCase_sortOrder_idx" ON "PortfolioCase"("sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioCase_publishedAt_idx" ON "PortfolioCase"("publishedAt");

-- CreateIndex
CREATE INDEX "PortfolioCase_industry_idx" ON "PortfolioCase"("industry");

-- CreateIndex
CREATE INDEX "PortfolioCase_boxType_idx" ON "PortfolioCase"("boxType");

-- CreateIndex
CREATE INDEX "PortfolioCase_packageStructure_idx" ON "PortfolioCase"("packageStructure");

-- CreateIndex
CREATE INDEX "PortfolioCase_casePurpose_idx" ON "PortfolioCase"("casePurpose");

-- CreateIndex
CREATE INDEX "MarketingCost_costDate_idx" ON "MarketingCost"("costDate");

-- CreateIndex
CREATE INDEX "MarketingCost_channel_idx" ON "MarketingCost"("channel");

-- CreateIndex
CREATE INDEX "MarketingCost_utmSource_idx" ON "MarketingCost"("utmSource");

-- CreateIndex
CREATE INDEX "MarketingCost_utmCampaign_idx" ON "MarketingCost"("utmCampaign");

-- AddForeignKey
ALTER TABLE "QuoteProposal" ADD CONSTRAINT "QuoteProposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteProposalItem" ADD CONSTRAINT "QuoteProposalItem_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteProposalShareLink" ADD CONSTRAINT "QuoteProposalShareLink_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteProposalCustomerResponse" ADD CONSTRAINT "QuoteProposalCustomerResponse_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteProposalCustomerResponse" ADD CONSTRAINT "QuoteProposalCustomerResponse_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "QuoteProposalShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteActivityLog" ADD CONSTRAINT "QuoteActivityLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteActivityLog" ADD CONSTRAINT "QuoteActivityLog_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadCommunicationLog" ADD CONSTRAINT "LeadCommunicationLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_quoteProposalId_fkey" FOREIGN KEY ("quoteProposalId") REFERENCES "QuoteProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRuleChangeLog" ADD CONSTRAINT "QuoteRuleChangeLog_quoteRuleId_fkey" FOREIGN KEY ("quoteRuleId") REFERENCES "QuoteRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

