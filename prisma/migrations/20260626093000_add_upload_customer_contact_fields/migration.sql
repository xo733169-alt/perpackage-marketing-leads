-- Add optional customer contact fields for the print-file upload hub.
-- These nullable/defaulted columns keep existing upload_projects rows valid.
ALTER TABLE "upload_projects" ADD COLUMN "company_name" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "contact_name" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "kakao_id" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "contact_method" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "privacy_agreed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "upload_projects_company_name_idx" ON "upload_projects"("company_name");
CREATE INDEX "upload_projects_contact_name_idx" ON "upload_projects"("contact_name");
