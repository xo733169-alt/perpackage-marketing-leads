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
