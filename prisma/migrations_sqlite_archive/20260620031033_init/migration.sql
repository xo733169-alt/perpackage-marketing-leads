-- CreateTable
CREATE TABLE "Lead" (
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
    "estimatedPriceRange" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminMemo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_leadScore_idx" ON "Lead"("leadScore");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
