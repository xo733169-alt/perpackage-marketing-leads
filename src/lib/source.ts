type SourceInput = {
  utmSource?: string | null;
  referrer?: string | null;
};

export function getLeadSourceLabel(input: SourceInput): string {
  if (input.utmSource?.trim()) return input.utmSource.trim();
  if (input.referrer?.trim()) return "외부 유입";
  return "직접 유입";
}
