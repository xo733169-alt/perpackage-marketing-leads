export const UPLOAD_CODE_PREFIX = "PP-UP";
export const UPLOAD_CODE_PATTERN = /\b(?:PP|TEMP)-UP-(?:\d{8}|TEST)-\d{3,}\b/i;

const KOREA_TIME_ZONE = "Asia/Seoul";

export function normalizeUploadCode(value: string): string {
  return value.trim().toUpperCase();
}

export function extractUploadCodeFromText(value: string | null | undefined): string | null {
  const match = value?.match(UPLOAD_CODE_PATTERN);
  return match ? normalizeUploadCode(match[0]) : null;
}

export function formatKoreaDateForUploadCode(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: KOREA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(now).map((part) => [part.type, part.value])
  );

  return `${parts.year}${parts.month}${parts.day}`;
}

export function getUploadCodeDailyPrefix(now: Date = new Date()): string {
  return `${UPLOAD_CODE_PREFIX}-${formatKoreaDateForUploadCode(now)}-`;
}

export function buildUploadCode(sequence: number, now: Date = new Date()): string {
  const safeSequence = Math.max(1, Math.trunc(sequence));
  return `${getUploadCodeDailyPrefix(now)}${String(safeSequence).padStart(3, "0")}`;
}
