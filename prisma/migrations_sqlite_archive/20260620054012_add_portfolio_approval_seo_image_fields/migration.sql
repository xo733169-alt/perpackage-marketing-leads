-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PortfolioCase" (
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
    "publicApprovedAt" DATETIME,
    "publicApprovalBy" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PortfolioCase" ("boardThickness", "boxType", "clientName", "createdAt", "depthMm", "featured", "finishingOptions", "heightMm", "id", "imageUrls", "industry", "isClientNamePublic", "mainImageUrl", "paperType", "printOption", "productName", "productionPoint", "projectOverview", "publishedAt", "quantityRange", "seoDescription", "seoTitle", "shortDescription", "slug", "sortOrder", "specificationSummary", "status", "tags", "title", "updatedAt", "widthMm") SELECT "boardThickness", "boxType", "clientName", "createdAt", "depthMm", "featured", "finishingOptions", "heightMm", "id", "imageUrls", "industry", "isClientNamePublic", "mainImageUrl", "paperType", "printOption", "productName", "productionPoint", "projectOverview", "publishedAt", "quantityRange", "seoDescription", "seoTitle", "shortDescription", "slug", "sortOrder", "specificationSummary", "status", "tags", "title", "updatedAt", "widthMm" FROM "PortfolioCase";
DROP TABLE "PortfolioCase";
ALTER TABLE "new_PortfolioCase" RENAME TO "PortfolioCase";
CREATE UNIQUE INDEX "PortfolioCase_slug_key" ON "PortfolioCase"("slug");
CREATE INDEX "PortfolioCase_status_idx" ON "PortfolioCase"("status");
CREATE INDEX "PortfolioCase_publicApprovalConfirmed_idx" ON "PortfolioCase"("publicApprovalConfirmed");
CREATE INDEX "PortfolioCase_featured_idx" ON "PortfolioCase"("featured");
CREATE INDEX "PortfolioCase_sortOrder_idx" ON "PortfolioCase"("sortOrder");
CREATE INDEX "PortfolioCase_publishedAt_idx" ON "PortfolioCase"("publishedAt");
CREATE INDEX "PortfolioCase_industry_idx" ON "PortfolioCase"("industry");
CREATE INDEX "PortfolioCase_boxType_idx" ON "PortfolioCase"("boxType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
