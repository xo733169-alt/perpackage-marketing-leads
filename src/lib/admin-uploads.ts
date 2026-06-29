import type { Prisma } from "@prisma/client";
import {
  PRINT_FILE_REVIEW_STATUSES,
  PRINT_FILE_REVIEW_STATUS_LABELS,
  UPLOADED_FILE_STATUS_PREPARED,
  UPLOADED_FILE_STATUS_UPLOADED,
  type PrintFileReviewStatus
} from "@/lib/print-file-upload-schema";

export function isPrintFileReviewStatus(value: string): value is PrintFileReviewStatus {
  return (PRINT_FILE_REVIEW_STATUSES as readonly string[]).includes(value);
}

export function getPrintFileReviewStatusLabel(status: string) {
  if (status === "LINKED_TO_ORDER") return "Cafe24 주문 연결";
  return isPrintFileReviewStatus(status) ? PRINT_FILE_REVIEW_STATUS_LABELS[status] : status;
}

export function getUploadedFileStatusLabel(status: string) {
  if (status === UPLOADED_FILE_STATUS_UPLOADED) return "업로드 완료";
  if (status === UPLOADED_FILE_STATUS_PREPARED) return "전송 확인 전";
  return status;
}

export function getUploadStatusBadgeClass(status: string) {
  switch (status) {
    case "uploaded":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "reviewing":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "revision_requested":
      return "border-red-200 bg-red-50 text-red-700";
    case "file_confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ready_for_production":
      return "border-ink bg-ink text-white";
    case "LINKED_TO_ORDER":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "on_hold":
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
    default:
      return "border-line bg-white text-neutral-700";
  }
}

export function buildUploadProjectListQuery(searchParams: URLSearchParams): {
  where: Prisma.UploadProjectWhereInput;
  orderBy: Prisma.UploadProjectOrderByWithRelationInput[];
  q: string;
  status: string;
} {
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const where: Prisma.UploadProjectWhereInput = {};

  if (q) {
    where.OR = [
      { uploadCode: { contains: q, mode: "insensitive" } },
      { cafe24OrderNumber: { contains: q, mode: "insensitive" } },
      { cafe24OrderNo: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { productName: { contains: q, mode: "insensitive" } },
      { productOptionText: { contains: q, mode: "insensitive" } }
    ];
  }

  if (isPrintFileReviewStatus(status)) {
    where.reviewStatus = status;
  }

  return {
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    q,
    status
  };
}

const KOREA_TIME_ZONE = "Asia/Seoul";
const DAY_MS = 24 * 60 * 60 * 1000;

type KoreaDateTimeParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  daySerial: number;
};

function toValidDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getKoreaDateTimeParts(value: Date): KoreaDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(value).map((part) => [part.type, part.value]));
  const year = parts.year ?? "0000";
  const month = parts.month ?? "01";
  const day = parts.day ?? "01";
  const daySerial = Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY_MS);

  return {
    year,
    month,
    day,
    hour: parts.hour ?? "00",
    minute: parts.minute ?? "00",
    daySerial
  };
}

export function formatDateTime(
  value: Date | string | null | undefined,
  options: { now?: Date } = {}
) {
  const date = toValidDate(value);
  if (!date) return "-";

  const now = options.now ?? new Date();
  const valueParts = getKoreaDateTimeParts(date);
  const nowParts = getKoreaDateTimeParts(now);
  const dayDiff = nowParts.daySerial - valueParts.daySerial;
  const time = `${valueParts.hour}:${valueParts.minute}`;

  if (dayDiff === 0) return `오늘 ${time}`;
  if (dayDiff === 1) return `어제 ${time}`;

  return `${valueParts.year}.${valueParts.month}.${valueParts.day} ${time}`;
}

export function getReviewLogActorLabel(createdBy: string | null | undefined) {
  if (createdBy === "admin") return "담당자";
  return createdBy?.trim() || "기록";
}

export function formatOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "-";
}
