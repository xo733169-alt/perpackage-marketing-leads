import { z } from "zod";

export const PRINT_FILE_UPLOAD_STATUSES = [
  "upload_waiting",
  "uploaded",
  "reviewing",
  "revision_requested",
  "file_confirmed",
  "ready_for_production",
  "on_hold"
] as const;

export const PRINT_FILE_REVIEW_STATUSES = [
  "upload_waiting",
  "uploaded",
  "reviewing",
  "revision_requested",
  "file_confirmed",
  "ready_for_production",
  "on_hold"
] as const;

export const PRINT_FILE_UPLOAD_STATUS_LABELS: Record<PrintFileUploadStatus, string> = {
  upload_waiting: "업로드 대기",
  uploaded: "업로드 완료",
  reviewing: "검수중",
  revision_requested: "수정 요청",
  file_confirmed: "파일 확인 완료",
  ready_for_production: "제작 진행 가능",
  on_hold: "보류"
};

export const PRINT_FILE_REVIEW_STATUS_LABELS: Record<PrintFileReviewStatus, string> =
  PRINT_FILE_UPLOAD_STATUS_LABELS;

export const UPLOADED_FILE_STATUS_PREPARED = "prepared";
export const UPLOADED_FILE_STATUS_UPLOADED = "uploaded";

export const DEFAULT_UPLOAD_ALLOWED_EXTENSIONS = [
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
] as const;

const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  "html",
  "htm",
  "js",
  "mjs",
  "cjs",
  "exe",
  "bat",
  "cmd",
  "sh",
  "php",
  "jar",
  "msi",
  "scr",
  "ps1"
]);

const BLOCKED_MIME_TYPES = new Set([
  "text/html",
  "application/javascript",
  "text/javascript",
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-sh",
  "application/x-php"
]);

const MIME_TYPES_BY_EXTENSION: Record<string, string[]> = {
  ai: ["application/postscript", "application/pdf", "application/octet-stream"],
  pdf: ["application/pdf", "application/octet-stream"],
  eps: ["application/postscript", "application/eps", "application/octet-stream"],
  svg: ["image/svg+xml", "application/xml", "text/xml", "application/octet-stream"],
  dxf: ["application/dxf", "image/vnd.dxf", "application/octet-stream", "text/plain"],
  psd: ["image/vnd.adobe.photoshop", "application/octet-stream"],
  zip: ["application/zip", "application/x-zip-compressed", "multipart/x-zip", "application/octet-stream"],
  jpg: ["image/jpeg", "application/octet-stream"],
  jpeg: ["image/jpeg", "application/octet-stream"],
  png: ["image/png", "application/octet-stream"]
};

export type PrintFileUploadStatus = (typeof PRINT_FILE_UPLOAD_STATUSES)[number];
export type PrintFileReviewStatus = (typeof PRINT_FILE_REVIEW_STATUSES)[number];

export type UploadLimitConfig = {
  allowedExtensions: string[];
  maxFileSizeBytes: number;
  maxZipSizeBytes: number;
  maxProjectSizeBytes: number;
  signedUrlExpiresSeconds: number;
};

export type PrintFileFieldErrors = Partial<
  Record<
    | "cafe24OrderNumber"
    | "companyName"
    | "contactName"
    | "customerName"
    | "phone"
    | "email"
    | "kakaoId"
    | "contactMethod"
    | "productName"
    | "productOptionText"
    | "requestMemo"
    | "privacyConsent"
    | "file",
    string
  >
>;

const MB = 1024 * 1024;

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, `최대 ${max}자까지 입력할 수 있습니다.`).optional());

const optionalOrderNumber = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(80, "주문번호는 80자 이하로 입력해 주세요.")
    .regex(/^[A-Za-z0-9\-_]+$/, "주문번호는 영문, 숫자, 하이픈, 밑줄만 입력해 주세요.")
    .optional()
);

const booleanFromForm = z.preprocess((value) => {
  if (value === "on" || value === "true" || value === true) return true;
  if (value === "false" || value === false || value === undefined || value === null || value === "") return false;
  return value;
}, z.boolean());

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getUploadLimitConfig(env: NodeJS.ProcessEnv = process.env): UploadLimitConfig {
  const allowedExtensions = (env.UPLOAD_ALLOWED_EXTENSIONS || DEFAULT_UPLOAD_ALLOWED_EXTENSIONS.join(","))
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);

  return {
    allowedExtensions: allowedExtensions.length ? Array.from(new Set(allowedExtensions)) : [...DEFAULT_UPLOAD_ALLOWED_EXTENSIONS],
    maxFileSizeBytes: readPositiveInt(env.UPLOAD_MAX_FILE_SIZE_MB, 100) * MB,
    maxZipSizeBytes: readPositiveInt(env.UPLOAD_MAX_ZIP_SIZE_MB, 300) * MB,
    maxProjectSizeBytes: readPositiveInt(env.UPLOAD_MAX_PROJECT_SIZE_MB, 1024) * MB,
    signedUrlExpiresSeconds: readPositiveInt(env.UPLOAD_SIGNED_URL_EXPIRES_SECONDS, 900)
  };
}

export function getFileExtension(filename: string): string {
  const normalized = filename.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === normalized.length - 1) {
    return "";
  }

  return normalized.slice(dotIndex + 1);
}

export function hasUnsafeFilenamePath(filename: string): boolean {
  const normalized = filename.trim();

  return normalized.includes("/") || normalized.includes("\\") || normalized.includes("..");
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0MB";
  if (bytes >= MB) return `${Math.round((bytes / MB) * 10) / 10}MB`;
  return `${Math.ceil(bytes / 1024)}KB`;
}

export function getPrintFileValidationError(
  file: Pick<File, "name" | "size" | "type"> | { name: string; size: number; type?: string },
  limits: UploadLimitConfig = getUploadLimitConfig()
): string | null {
  const extension = getFileExtension(file.name);
  const mimeType = file.type?.trim().toLowerCase() ?? "";

  if (!file.name || file.size <= 0) {
    return "업로드할 인쇄파일을 선택해 주세요.";
  }

  if (hasUnsafeFilenamePath(file.name)) {
    return "파일명에 경로 문자를 포함할 수 없습니다. 파일명을 바꾼 뒤 다시 업로드해 주세요.";
  }

  if (extension && BLOCKED_UPLOAD_EXTENSIONS.has(extension)) {
    return "보안상 업로드할 수 없는 파일 형식입니다. 인쇄용 파일만 업로드해 주세요.";
  }

  if (!extension || !limits.allowedExtensions.includes(extension)) {
    return `업로드 가능한 파일 형식은 ${limits.allowedExtensions.map((item) => item.toUpperCase()).join(", ")}입니다.`;
  }

  if (mimeType && BLOCKED_MIME_TYPES.has(mimeType)) {
    return "보안상 업로드할 수 없는 파일 형식입니다. 인쇄용 파일인지 확인해 주세요.";
  }

  const allowedMimeTypes = MIME_TYPES_BY_EXTENSION[extension] ?? [];
  if (mimeType && allowedMimeTypes.length && !allowedMimeTypes.includes(mimeType)) {
    return `${extension.toUpperCase()} 파일 형식과 실제 파일 정보가 맞지 않습니다. 파일을 다시 확인해 주세요.`;
  }

  const maxSize = extension === "zip" ? limits.maxZipSizeBytes : limits.maxFileSizeBytes;
  if (file.size > maxSize) {
    return `${extension.toUpperCase()} 파일은 최대 ${formatFileSize(maxSize)}까지 업로드할 수 있습니다.`;
  }

  return null;
}

export function getProjectTotalLimitError(currentTotalBytes: number, nextFileSizeBytes: number, limits = getUploadLimitConfig()) {
  if (currentTotalBytes + nextFileSizeBytes <= limits.maxProjectSizeBytes) return null;
  return `한 주문번호 업로드 프로젝트의 전체 파일 용량은 ${formatFileSize(limits.maxProjectSizeBytes)} 이하로 준비해 주세요.`;
}

export function isSvgPrintFile(filename: string): boolean {
  return getFileExtension(filename) === "svg";
}

export const uploadProjectCreateSchema = z.object({
  cafe24OrderNumber: optionalOrderNumber,
  companyName: optionalText(120),
  contactName: z.string().trim().min(1, "담당자명을 입력해 주세요.").max(80, "담당자명은 80자 이하로 입력해 주세요."),
  customerName: z.string().trim().min(1, "업체명 또는 고객명을 입력해 주세요.").max(120, "업체명 또는 고객명은 120자 이하로 입력해 주세요."),
  phone: z
    .string()
    .trim()
    .min(1, "연락처를 입력해 주세요.")
    .regex(/^[0-9+\-\s()]{7,20}$/, "연락처 형식을 확인해 주세요."),
  email: z.preprocess(emptyToUndefined, z.string().trim().email("올바른 이메일 주소를 입력해 주세요.").optional()),
  kakaoId: optionalText(80),
  contactMethod: optionalText(120),
  productName: optionalText(160),
  productOptionText: optionalText(300),
  requestMemo: optionalText(2000),
  privacyConsent: booleanFromForm.refine((value) => value === true, {
    message: "개인정보 수집 및 이용에 동의해 주세요."
  })
});

export const prepareUploadFileSchema = z.object({
  projectId: z.string().trim().min(1, "업로드 프로젝트를 먼저 생성해 주세요."),
  originalFilename: z
    .string()
    .trim()
    .min(1, "파일명을 확인해 주세요.")
    .max(260, "파일명이 너무 깁니다.")
    .refine((filename) => !hasUnsafeFilenamePath(filename), "파일명에 경로 문자를 포함할 수 없습니다."),
  fileSize: z.coerce.number().int("파일 크기를 확인해 주세요.").positive("파일 크기를 확인해 주세요."),
  fileType: optionalText(200)
});

export const completeUploadFileSchema = z.object({
  projectId: z.string().trim().min(1, "업로드 프로젝트를 확인해 주세요."),
  fileId: z.string().trim().min(1, "업로드 파일을 확인해 주세요.")
});

export const adminUploadStatusSchema = z.object({
  reviewStatus: z.enum(PRINT_FILE_REVIEW_STATUSES, {
    invalid_type_error: "검수 상태를 확인해 주세요.",
    required_error: "검수 상태를 선택해 주세요."
  }),
  adminMemo: z.string().trim().max(5000, "관리자 메모는 5000자 이하로 입력해 주세요.").optional()
});

export const reviewLogCreateSchema = z.object({
  fileId: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  status: z.enum(PRINT_FILE_REVIEW_STATUSES, {
    invalid_type_error: "검수 상태를 확인해 주세요.",
    required_error: "검수 상태를 선택해 주세요."
  }),
  message: z.string().trim().min(1, "수정 요청 또는 검수 메모를 입력해 주세요.").max(3000, "메모는 3000자 이하로 입력해 주세요.")
});

export type UploadProjectCreateInput = z.infer<typeof uploadProjectCreateSchema>;
export type PrepareUploadFileInput = z.infer<typeof prepareUploadFileSchema>;

export function toPrintFileFieldErrors(error: z.ZodError<UploadProjectCreateInput>): PrintFileFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as PrintFileFieldErrors;
}
