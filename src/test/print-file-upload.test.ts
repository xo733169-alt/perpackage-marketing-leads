import { describe, expect, it } from "vitest";
import { buildUploadProjectListQuery, formatDateTime, getReviewLogActorLabel } from "@/lib/admin-uploads";
import {
  DEFAULT_UPLOAD_ALLOWED_EXTENSIONS,
  formatFileSize,
  getPrintFileValidationError,
  getProjectTotalLimitError,
  getUploadLimitConfig,
  hasUnsafeFilenamePath,
  isSvgPrintFile,
  prepareUploadFileSchema,
  uploadProjectCreateSchema
} from "@/lib/print-file-upload-schema";
import { buildPrintFileStorageKey, createSafeStoredFilename } from "@/lib/storage/upload-path";
import { createNaverObjectStorageAdapter } from "@/lib/storage/naver-object-storage";
import {
  assertSafePrintFileStorageKey,
  createLocalPrintFileToken,
  verifyLocalPrintFileToken
} from "@/lib/storage/local-print-file-storage";
import { StorageConfigurationError } from "@/lib/storage/storage-adapter";

describe("print file upload validation", () => {
  it("keeps the expected default extension allowlist", () => {
    expect(DEFAULT_UPLOAD_ALLOWED_EXTENSIONS).toEqual([
      "ai",
      "pdf",
      "eps",
      "svg",
      "dxf",
      "psd",
      "zip",
      "jpg",
      "jpeg",
      "png"
    ]);
  });

  it("accepts print file extensions and rejects unsupported extensions", () => {
    const allowedFiles = [
      { name: "design.ai", type: "application/octet-stream" },
      { name: "proof.pdf", type: "application/pdf" },
      { name: "dieline.eps", type: "application/postscript" },
      { name: "logo.svg", type: "image/svg+xml" },
      { name: "dieline.dxf", type: "application/dxf" },
      { name: "source.psd", type: "image/vnd.adobe.photoshop" },
      { name: "archive.zip", type: "application/zip" },
      { name: "photo.jpg", type: "image/jpeg" },
      { name: "photo.jpeg", type: "image/jpeg" },
      { name: "preview.png", type: "image/png" }
    ];
    const blockedFiles = ["index.html", "script.js", "malware.exe", "run.bat", "run.cmd", "shell.sh", "upload.php"];

    for (const file of allowedFiles) {
      expect(getPrintFileValidationError({ name: file.name, size: 1024, type: file.type })).toBeNull();
    }

    for (const name of blockedFiles) {
      expect(getPrintFileValidationError({ name, size: 1024, type: "application/octet-stream" })).toContain("보안상");
    }
  });

  it("blocks dangerous mime types and mismatched extension mime pairs", () => {
    expect(getPrintFileValidationError({ name: "proof.pdf", size: 1024, type: "text/html" })).toContain("보안상");
    expect(getPrintFileValidationError({ name: "proof.pdf", size: 1024, type: "image/png" })).toContain("맞지 않습니다");
    expect(getPrintFileValidationError({ name: "image.png", size: 1024, type: "image/png" })).toBeNull();
  });

  it("blocks path traversal style filenames before storage or DB lookup", () => {
    expect(hasUnsafeFilenamePath("../../escape.pdf")).toBe(true);
    expect(hasUnsafeFilenamePath("folder\\escape.pdf")).toBe(true);
    expect(getPrintFileValidationError({ name: "../escape.pdf", size: 1024, type: "application/pdf" })).toContain("경로 문자");
    expect(
      prepareUploadFileSchema.safeParse({
        projectId: "project123",
        originalFilename: "../escape.pdf",
        fileSize: 1024,
        fileType: "application/pdf"
      }).success
    ).toBe(false);
  });

  it("applies separate zip and non-zip file size limits", () => {
    const limits = getUploadLimitConfig({
      UPLOAD_ALLOWED_EXTENSIONS: "pdf,zip",
      UPLOAD_MAX_FILE_SIZE_MB: "1",
      UPLOAD_MAX_ZIP_SIZE_MB: "3",
      UPLOAD_MAX_PROJECT_SIZE_MB: "10",
      UPLOAD_SIGNED_URL_EXPIRES_SECONDS: "60"
    } as unknown as NodeJS.ProcessEnv);

    expect(getPrintFileValidationError({ name: "large.pdf", size: 2 * 1024 * 1024, type: "application/pdf" }, limits)).toContain("PDF 파일");
    expect(getPrintFileValidationError({ name: "large.zip", size: 2 * 1024 * 1024, type: "application/zip" }, limits)).toBeNull();
    expect(getPrintFileValidationError({ name: "too-large.zip", size: 4 * 1024 * 1024, type: "application/zip" }, limits)).toContain("ZIP 파일");
  });

  it("detects project total size overflow", () => {
    const limits = getUploadLimitConfig({
      UPLOAD_MAX_PROJECT_SIZE_MB: "1"
    } as unknown as NodeJS.ProcessEnv);

    expect(getProjectTotalLimitError(700 * 1024, 400 * 1024, limits)).toContain("전체 파일 용량");
    expect(getProjectTotalLimitError(300 * 1024, 400 * 1024, limits)).toBeNull();
  });

  it("formats file sizes for Korean UI copy", () => {
    expect(formatFileSize(1024)).toBe("1KB");
    expect(formatFileSize(1024 * 1024)).toBe("1MB");
    expect(formatFileSize(1536 * 1024)).toBe("1.5MB");
  });

  it("detects svg files for production review guidance", () => {
    expect(isSvgPrintFile("logo.svg")).toBe(true);
    expect(isSvgPrintFile("logo.pdf")).toBe(false);
  });

  it("requires customer contact fields and privacy agreement", () => {
    const basePayload = {
      customerName: "페르패키지",
      phone: "010-1234-5678",
      email: "customer@example.com",
      privacyConsent: true
    };

    expect(uploadProjectCreateSchema.safeParse(basePayload).success).toBe(true);
    expect(uploadProjectCreateSchema.safeParse({ ...basePayload, contactName: "" }).success).toBe(true);
    expect(uploadProjectCreateSchema.safeParse({ ...basePayload, customerName: "" }).success).toBe(false);
    expect(uploadProjectCreateSchema.safeParse({ ...basePayload, privacyConsent: false }).success).toBe(false);
    expect(
      uploadProjectCreateSchema.safeParse({
        ...basePayload,
        cafe24OrderNumber: "20260626-001",
        companyName: "페르패키지",
        productName: "단상자",
        contactMethod: "문자 우선 연락"
      }).success
    ).toBe(true);
  });

  it("keeps order number and product name optional for customer uploads", () => {
    const parsed = uploadProjectCreateSchema.safeParse({
      cafe24OrderNumber: "",
      customerName: "페르패키지",
      phone: "010-1234-5678",
      productName: "",
      privacyConsent: true
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cafe24OrderNumber).toBeUndefined();
      expect(parsed.data.productName).toBeUndefined();
      expect(parsed.data.kakaoId).toBeUndefined();
    }
  });
});

describe("print file upload storage paths", () => {
  it("creates a safe stored filename without user-controlled path segments", () => {
    const filename = createSafeStoredFilename("../../한글 파일 이름.ai");

    expect(filename).toMatch(/^print-file-[A-Za-z0-9_-]{10}\.ai$/);
    expect(filename).not.toContain("..");
    expect(filename).not.toContain("/");
    expect(filename).not.toContain("\\");
  });

  it("builds object keys by project id and version", () => {
    expect(
      buildPrintFileStorageKey({
        projectId: "project123",
        version: 2,
        storedFilename: "print-file-test.pdf"
      })
    ).toBe("print-files/project123/2/print-file-test.pdf");
  });

  it("rejects unsafe storage path inputs", () => {
    expect(() =>
      buildPrintFileStorageKey({
        projectId: "../project",
        version: 1,
        storedFilename: "print-file-test.pdf"
      })
    ).toThrow();
    expect(() =>
      buildPrintFileStorageKey({
        projectId: "project",
        version: 0,
        storedFilename: "print-file-test.pdf"
      })
    ).toThrow();
    expect(() =>
      buildPrintFileStorageKey({
        projectId: "project",
        version: 1,
        storedFilename: "../print-file-test.pdf"
      })
    ).toThrow();
  });

  it("rejects unsafe local storage keys and verifies signed local tokens", () => {
    const key = "print-files/project123/1/print-file-test.pdf";
    const expires = Math.floor(Date.now() / 1000) + 60;
    const token = createLocalPrintFileToken({ method: "GET", key, expires, filename: "원본.pdf" });

    expect(() => assertSafePrintFileStorageKey(key)).not.toThrow();
    expect(() => assertSafePrintFileStorageKey("../print-files/project123/1/test.pdf")).toThrow();
    expect(() => assertSafePrintFileStorageKey("print-files/project123/../test.pdf")).toThrow();
    expect(verifyLocalPrintFileToken({ method: "GET", key, expires, filename: "원본.pdf", token })).toBe(true);
    expect(verifyLocalPrintFileToken({ method: "PUT", key, expires, filename: "원본.pdf", token })).toBe(false);
    expect(verifyLocalPrintFileToken({ method: "GET", key, expires: 1, filename: "원본.pdf", token })).toBe(false);
  });
});

describe("print file upload admin time display", () => {
  it("searches upload projects by order, company, contact, customer, and product fields", () => {
    const query = buildUploadProjectListQuery(new URLSearchParams({ q: "페르패키지" }));
    const serializedWhere = JSON.stringify(query.where);

    expect(serializedWhere).toContain("cafe24OrderNumber");
    expect(serializedWhere).toContain("companyName");
    expect(serializedWhere).toContain("contactName");
    expect(serializedWhere).toContain("customerName");
    expect(serializedWhere).toContain("productName");
  });

  it("formats upload and review log times in Korea time", () => {
    const now = new Date("2026-06-25T06:40:00.000Z");

    expect(formatDateTime(new Date("2026-06-25T06:32:00.000Z"), { now })).toBe("오늘 15:32");
    expect(formatDateTime(new Date("2026-06-24T09:10:00.000Z"), { now })).toBe("어제 18:10");
    expect(formatDateTime(new Date("2026-06-23T06:32:00.000Z"), { now })).toBe("2026.06.23 15:32");
  });

  it("labels admin review log actors as 담당자", () => {
    expect(getReviewLogActorLabel("admin")).toBe("담당자");
    expect(getReviewLogActorLabel("print-team")).toBe("print-team");
    expect(getReviewLogActorLabel(null)).toBe("기록");
  });
});

describe("naver object storage config", () => {
  it("throws a safe configuration error when required keys are missing", () => {
    expect(() => createNaverObjectStorageAdapter({} as NodeJS.ProcessEnv)).toThrow(StorageConfigurationError);
  });
});
