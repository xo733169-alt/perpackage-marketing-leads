-- CreateTable
CREATE TABLE "upload_projects" (
    "id" TEXT NOT NULL,
    "cafe24_order_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "product_name" TEXT NOT NULL,
    "product_option_text" TEXT,
    "request_memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upload_waiting',
    "review_status" TEXT NOT NULL DEFAULT 'upload_waiting',
    "admin_memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "stored_filename" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT,
    "file_extension" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "upload_status" TEXT NOT NULL DEFAULT 'prepared',
    "review_status" TEXT NOT NULL DEFAULT 'upload_waiting',
    "uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_review_logs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "file_id" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_projects_cafe24_order_number_idx" ON "upload_projects"("cafe24_order_number");

-- CreateIndex
CREATE INDEX "upload_projects_customer_name_idx" ON "upload_projects"("customer_name");

-- CreateIndex
CREATE INDEX "upload_projects_product_name_idx" ON "upload_projects"("product_name");

-- CreateIndex
CREATE INDEX "upload_projects_status_idx" ON "upload_projects"("status");

-- CreateIndex
CREATE INDEX "upload_projects_review_status_idx" ON "upload_projects"("review_status");

-- CreateIndex
CREATE INDEX "upload_projects_created_at_idx" ON "upload_projects"("created_at");

-- CreateIndex
CREATE INDEX "uploaded_files_project_id_idx" ON "uploaded_files"("project_id");

-- CreateIndex
CREATE INDEX "uploaded_files_project_id_version_idx" ON "uploaded_files"("project_id", "version");

-- CreateIndex
CREATE INDEX "uploaded_files_storage_key_idx" ON "uploaded_files"("storage_key");

-- CreateIndex
CREATE INDEX "uploaded_files_upload_status_idx" ON "uploaded_files"("upload_status");

-- CreateIndex
CREATE INDEX "uploaded_files_review_status_idx" ON "uploaded_files"("review_status");

-- CreateIndex
CREATE INDEX "uploaded_files_uploaded_at_idx" ON "uploaded_files"("uploaded_at");

-- CreateIndex
CREATE INDEX "file_review_logs_project_id_idx" ON "file_review_logs"("project_id");

-- CreateIndex
CREATE INDEX "file_review_logs_file_id_idx" ON "file_review_logs"("file_id");

-- CreateIndex
CREATE INDEX "file_review_logs_status_idx" ON "file_review_logs"("status");

-- CreateIndex
CREATE INDEX "file_review_logs_created_at_idx" ON "file_review_logs"("created_at");

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "upload_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_review_logs" ADD CONSTRAINT "file_review_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "upload_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_review_logs" ADD CONSTRAINT "file_review_logs_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add optional customer contact fields for the print-file upload hub.
-- These nullable/defaulted columns keep existing upload_projects rows valid.
ALTER TABLE "upload_projects" ADD COLUMN "company_name" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "contact_name" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "kakao_id" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "contact_method" TEXT;
ALTER TABLE "upload_projects" ADD COLUMN "privacy_agreed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "upload_projects_company_name_idx" ON "upload_projects"("company_name");
CREATE INDEX "upload_projects_contact_name_idx" ON "upload_projects"("contact_name");

-- Cafe24 OAuth/Webhook integration foundation.
-- Tokens are stored server-side only and must never be exposed in client code or reports.

ALTER TABLE "upload_projects"
  ADD COLUMN "upload_code" TEXT,
  ADD COLUMN "cafe24_mall_id" TEXT,
  ADD COLUMN "cafe24_order_id" TEXT,
  ADD COLUMN "cafe24_order_no" TEXT,
  ADD COLUMN "cafe24_member_id" TEXT,
  ADD COLUMN "cafe24_order_memo" TEXT,
  ADD COLUMN "linked_at" TIMESTAMP(3),
  ADD COLUMN "link_source" TEXT,
  ADD COLUMN "order_synced_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "upload_projects_upload_code_key" ON "upload_projects"("upload_code");
CREATE INDEX "upload_projects_upload_code_idx" ON "upload_projects"("upload_code");
CREATE INDEX "upload_projects_cafe24_mall_id_idx" ON "upload_projects"("cafe24_mall_id");
CREATE INDEX "upload_projects_cafe24_order_id_idx" ON "upload_projects"("cafe24_order_id");
CREATE INDEX "upload_projects_cafe24_order_no_idx" ON "upload_projects"("cafe24_order_no");

CREATE TABLE "cafe24_tokens" (
  "id" TEXT NOT NULL,
  "mall_id" TEXT NOT NULL,
  "access_token" TEXT NOT NULL,
  "refresh_token" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "scopes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "cafe24_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cafe24_tokens_mall_id_key" ON "cafe24_tokens"("mall_id");
CREATE INDEX "cafe24_tokens_expires_at_idx" ON "cafe24_tokens"("expires_at");

CREATE TABLE "cafe24_webhook_events" (
  "id" TEXT NOT NULL,
  "event_type" TEXT,
  "event_id" TEXT,
  "mall_id" TEXT,
  "order_id" TEXT,
  "order_no" TEXT,
  "upload_code" TEXT,
  "payload_json" JSONB NOT NULL,
  "processed_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "error_message" TEXT,
  "upload_project_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "cafe24_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cafe24_webhook_events_mall_id_event_id_key" ON "cafe24_webhook_events"("mall_id", "event_id");
CREATE INDEX "cafe24_webhook_events_event_type_idx" ON "cafe24_webhook_events"("event_type");
CREATE INDEX "cafe24_webhook_events_mall_id_idx" ON "cafe24_webhook_events"("mall_id");
CREATE INDEX "cafe24_webhook_events_order_id_idx" ON "cafe24_webhook_events"("order_id");
CREATE INDEX "cafe24_webhook_events_order_no_idx" ON "cafe24_webhook_events"("order_no");
CREATE INDEX "cafe24_webhook_events_upload_code_idx" ON "cafe24_webhook_events"("upload_code");
CREATE INDEX "cafe24_webhook_events_status_idx" ON "cafe24_webhook_events"("status");
CREATE INDEX "cafe24_webhook_events_created_at_idx" ON "cafe24_webhook_events"("created_at");

ALTER TABLE "cafe24_webhook_events"
  ADD CONSTRAINT "cafe24_webhook_events_upload_project_id_fkey"
  FOREIGN KEY ("upload_project_id") REFERENCES "upload_projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
