-- AlterTable
ALTER TABLE "PortfolioCase" ADD COLUMN "casePurpose" TEXT;
ALTER TABLE "PortfolioCase" ADD COLUMN "packageStructure" TEXT;

-- CreateIndex
CREATE INDEX "PortfolioCase_packageStructure_idx" ON "PortfolioCase"("packageStructure");

-- CreateIndex
CREATE INDEX "PortfolioCase_casePurpose_idx" ON "PortfolioCase"("casePurpose");
