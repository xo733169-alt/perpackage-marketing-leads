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
