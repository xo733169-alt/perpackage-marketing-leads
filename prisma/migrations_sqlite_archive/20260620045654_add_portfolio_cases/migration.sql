-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "sourceCaseSlug" TEXT;
ALTER TABLE "Lead" ADD COLUMN "sourceCaseTitle" TEXT;

-- CreateTable
CREATE TABLE "PortfolioCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "industry" TEXT NOT NULL,
    "boxType" TEXT NOT NULL,
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
    "imageUrls" TEXT,
    "shortDescription" TEXT NOT NULL,
    "projectOverview" TEXT,
    "productionPoint" TEXT,
    "specificationSummary" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "tags" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCase_slug_key" ON "PortfolioCase"("slug");

-- CreateIndex
CREATE INDEX "PortfolioCase_status_idx" ON "PortfolioCase"("status");

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
CREATE INDEX "Lead_sourceCaseSlug_idx" ON "Lead"("sourceCaseSlug");
