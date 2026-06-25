-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "consultationMissingItems" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationNextActions" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationPriorityNotes" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationRiskNotes" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationSummaryOverview" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationSummaryTitle" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationSummaryUpdatedAt" DATETIME;
