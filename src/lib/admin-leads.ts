import type { Prisma } from "@prisma/client";
import { isLeadStatus } from "./lead-options";

export type ParsedReadinessChecklistItem = {
  key: string;
  label: string;
  checked: boolean;
};

export type LeadConsultationSummaryInput = {
  packageType?: string | null;
  packageStructure?: string | null;
  quantity?: string | null;
  sizeInfo?: string | null;
  hasPhysicalProduct?: string | null;
  hasDesignFile?: string | null;
  hasDieline?: string | null;
  desiredDueDate?: string | null;
  isUrgent?: boolean | null;
  budgetRange?: string | null;
  finishingOptions?: string | null;
  readinessScore?: number | null;
  message?: string | null;
  referenceNote?: string | null;
  consultationNotes?: string | null;
  consultationSummaryTitle?: string | null;
  consultationSummaryOverview?: string | null;
  consultationPriorityNotes?: string | null;
  consultationMissingItems?: string | null;
  consultationRiskNotes?: string | null;
  consultationNextActions?: string | null;
};

export type LeadSummaryTone = "urgent" | "needs_discovery" | "ready" | "standard";

export type LeadConsultationSummary = {
  title: string;
  overview: string;
  priorityNotes: string[];
  missingItems: string[];
  riskNotes: string[];
  suggestedNextActions: string[];
};

export type DisplayConsultationSummary = {
  summary: LeadConsultationSummary;
  source: "manual" | "auto";
};

export const PACKAGE_TYPE_FILTER_OPTIONS = [
  "단상자",
  "쇼핑백",
  "싸바리박스",
  "골판지박스",
  "내부 트레이",
  "봉투/파우치",
  "스티커/라벨",
  "잘 모르겠어요",
  "기타"
] as const;

export const READINESS_FILTER_OPTIONS = ["0-30", "31-70", "71-100", "missing"] as const;

export type ReadinessFilter = (typeof READINESS_FILTER_OPTIONS)[number];

export const PACKAGE_INQUIRY_CSV_HEADERS = [
  "패키지 종류",
  "패키지 구조",
  "고객 입력 수량",
  "사이즈 정보",
  "제품 실물 여부",
  "디자인 파일 여부",
  "도면 여부",
  "희망 납기",
  "급건 여부",
  "예산 범위",
  "후가공",
  "제작 준비도 점수",
  "제작 준비 체크리스트",
  "내부 상담 메모"
] as const;

export function parseFinishingOptions(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function parseReadinessChecklist(value: string | null | undefined): ParsedReadinessChecklistItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item, index) => {
          if (typeof item === "string") {
            return {
              key: `item-${index}`,
              label: item,
              checked: true
            };
          }

          if (!item || typeof item !== "object") return null;

          const record = item as Record<string, unknown>;
          const label = typeof record.label === "string" && record.label.trim() ? record.label.trim() : "";
          if (!label) return null;

          return {
            key: typeof record.key === "string" && record.key.trim() ? record.key.trim() : `item-${index}`,
            label,
            checked: record.checked === true
          };
        })
        .filter((item): item is ParsedReadinessChecklistItem => Boolean(item));
    }

    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>).map(([key, checked]) => ({
        key,
        label: key,
        checked: Boolean(checked)
      }));
    }

    return [];
  } catch {
    return [];
  }
}

export function getReadinessStatusText(score: number | null | undefined) {
  if (score === null || score === undefined) return "미계산";
  if (score <= 30) return "상담 전 추가 확인이 많이 필요한 문의입니다.";
  if (score <= 70) return "기본 상담이 가능한 문의입니다.";
  return "상담 준비도가 높은 문의입니다.";
}

export function getReadinessListLabel(score: number | null | undefined) {
  if (score === null || score === undefined) return "미계산";
  if (score <= 30) return "준비 낮음";
  if (score <= 70) return "기본 상담 가능";
  return "준비 높음";
}

export function formatCsvEmptyValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseUnknownJsonString(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function hasMeaningfulManualSummaryValue(value: string | null | undefined) {
  const text = value?.trim();
  return Boolean(text && text !== "[]" && text !== "null");
}

function parseManualConsultationSummaryList(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) return [];

  const parsed = parseUnknownJsonString(text);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "number" || typeof item === "boolean") return String(item);

        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          if (typeof record.label === "string") return record.label.trim();
          if (typeof record.value === "string") return record.value.trim();
          if (typeof record.name === "string") return record.name.trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof parsed === "string") {
    return splitConsultationTextareaLines(parsed);
  }

  return splitConsultationTextareaLines(text);
}

function stringifyJsonArrayItem(item: unknown): string {
  if (typeof item === "string") return item.trim();
  if (typeof item === "number" || typeof item === "boolean") return String(item);

  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    if (typeof record.label === "string") return record.label.trim();
    if (typeof record.value === "string") return record.value.trim();
    if (typeof record.name === "string") return record.name.trim();
  }

  return "";
}

export function formatJsonArrayForCsv(value: string | null | undefined) {
  const text = formatCsvEmptyValue(value);
  if (!text) return "";

  const parsed = parseUnknownJsonString(text);

  if (Array.isArray(parsed)) {
    const values = parsed.map(stringifyJsonArrayItem).filter(Boolean);
    return values.length ? values.join(", ") : "";
  }

  if (typeof parsed === "string") return parsed;

  return text;
}

export function formatFinishingOptionsForCsv(value: string | null | undefined) {
  return formatJsonArrayForCsv(value);
}

export function formatReadinessChecklistForCsv(value: string | null | undefined) {
  const text = formatCsvEmptyValue(value);
  if (!text) return "";

  const parsed = parseUnknownJsonString(text);

  if (Array.isArray(parsed)) {
    const values = parsed
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          if (record.checked === false) return "";
          return typeof record.label === "string" ? record.label.trim() : "";
        }

        return "";
      })
      .filter(Boolean);

    return values.join(", ");
  }

  if (typeof parsed === "string") return parsed;

  return text;
}

export function formatUrgentForCsv(isUrgent: boolean) {
  return isUrgent ? "급건" : "일반 일정";
}

export function formatReadinessScoreForCsv(score: number | null | undefined) {
  return score === null || score === undefined ? "미계산" : String(score);
}

export function splitConsultationTextareaLines(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatConsultationSummaryListForTextarea(items: string[]) {
  return items.join("\n");
}

function normalizeLeadSummaryText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function isUnknownChoice(value: string | null | undefined) {
  const text = normalizeLeadSummaryText(value);
  return !text || text === "잘 모르겠어요" || text === "아직 모르겠음";
}

function isUnsetQuantity(value: string | null | undefined) {
  const text = normalizeLeadSummaryText(value);
  return !text || text === "아직 미정" || text === "잘 모르겠어요";
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function addUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

function getLeadContextText(lead: LeadConsultationSummaryInput) {
  return [lead.message, lead.referenceNote, lead.consultationNotes]
    .map(normalizeLeadSummaryText)
    .filter(Boolean)
    .join(" ");
}

function hasContentTraitInfo(lead: LeadConsultationSummaryInput) {
  const context = getLeadContextText(lead);
  return includesAny(context, ["무게", "중량", "내용물", "용량", "파손", "냉장", "냉동", "식품"]);
}

function hasSpecialFinishing(finishingOptions: string[]) {
  return finishingOptions.some((option) => includesAny(option, ["박", "형압", "엠보", "부분코팅", "창/PET", "PET"]));
}

export function getMissingConsultationItems(lead: LeadConsultationSummaryInput) {
  const missingItems: string[] = [];
  const finishingOptions = parseFinishingOptions(lead.finishingOptions);

  if (isUnknownChoice(lead.packageType)) addUnique(missingItems, "패키지 종류");
  if (isUnknownChoice(lead.packageStructure)) addUnique(missingItems, "패키지 구조");
  if (isUnsetQuantity(lead.quantity)) addUnique(missingItems, "수량");
  if (!normalizeLeadSummaryText(lead.sizeInfo)) addUnique(missingItems, "사이즈");

  const physicalProduct = normalizeLeadSummaryText(lead.hasPhysicalProduct);
  if (!physicalProduct || physicalProduct === "아직 없습니다" || physicalProduct === "잘 모르겠어요") {
    addUnique(missingItems, "제품 실물/이미지");
  }

  const designFile = normalizeLeadSummaryText(lead.hasDesignFile);
  if (!designFile || designFile === "디자인 의뢰 필요" || designFile === "아직 없음" || designFile === "잘 모르겠어요") {
    addUnique(missingItems, "디자인 파일");
  }

  const dieline = normalizeLeadSummaryText(lead.hasDieline);
  if (!dieline || dieline === "도면 제작 필요" || dieline === "잘 모르겠어요") {
    addUnique(missingItems, "도면");
  }

  if (!normalizeLeadSummaryText(lead.desiredDueDate)) addUnique(missingItems, "희망 납기");

  const budgetRange = normalizeLeadSummaryText(lead.budgetRange);
  if (!budgetRange || budgetRange === "아직 미정") addUnique(missingItems, "예산 범위");

  if (!finishingOptions.length || finishingOptions.includes("잘 모르겠어요")) addUnique(missingItems, "후가공");
  if (!hasContentTraitInfo(lead)) addUnique(missingItems, "제품 무게/내용물 특성");

  return missingItems;
}

export function getPriorityConsultationNotes(lead: LeadConsultationSummaryInput) {
  const notes: string[] = [];

  if (lead.isUrgent) {
    addUnique(notes, "급건 문의입니다. 희망 납기와 제작 가능 일정을 먼저 확인하세요.");
  }

  if (isUnknownChoice(lead.packageType)) {
    addUnique(notes, "패키지 종류가 명확하지 않습니다. 제품 특성과 사용 목적을 먼저 확인하세요.");
  }

  if (isUnknownChoice(lead.packageStructure)) {
    addUnique(notes, "패키지 구조가 정해지지 않았습니다. 단상자, 쇼핑백, 싸바리 등 적합한 구조 상담이 필요합니다.");
  }

  if (isUnsetQuantity(lead.quantity)) {
    addUnique(notes, "수량이 확정되지 않았습니다. 샘플, 소량, 본생산 중 어느 단계인지 확인하세요.");
  }

  if (!normalizeLeadSummaryText(lead.sizeInfo)) {
    addUnique(notes, "사이즈 정보가 없습니다. 제품 실측 또는 대략적인 가로 x 세로 x 높이 확인이 필요합니다.");
  }

  const designFile = normalizeLeadSummaryText(lead.hasDesignFile);
  if (["디자인 의뢰 필요", "아직 없음", "잘 모르겠어요"].includes(designFile)) {
    addUnique(notes, "디자인 파일 준비 상태를 확인하고, 디자인 의뢰 필요 여부를 안내하세요.");
  }

  const dieline = normalizeLeadSummaryText(lead.hasDieline);
  if (!dieline || ["도면 제작 필요", "잘 모르겠어요"].includes(dieline)) {
    addUnique(notes, "도면 준비 상태를 확인하고, 구조 설계 또는 도면 제작 필요 여부를 안내하세요.");
  }

  if (lead.readinessScore !== null && lead.readinessScore !== undefined && lead.readinessScore <= 30) {
    addUnique(notes, "상담 준비도가 낮습니다. 기본 제작 조건부터 차근차근 정리해야 합니다.");
  }

  if (lead.readinessScore !== null && lead.readinessScore !== undefined && lead.readinessScore >= 71) {
    addUnique(notes, "상담 준비도가 높은 문의입니다. 도면, 디자인 파일, 납기 조건을 중심으로 빠르게 검토할 수 있습니다.");
  }

  return notes;
}

export function getLeadSummaryTone(lead: LeadConsultationSummaryInput): LeadSummaryTone {
  if (lead.isUrgent) return "urgent";

  const missingItems = getMissingConsultationItems(lead);
  if ((lead.readinessScore !== null && lead.readinessScore !== undefined && lead.readinessScore <= 30) || missingItems.length >= 5) {
    return "needs_discovery";
  }

  if (lead.readinessScore !== null && lead.readinessScore !== undefined && lead.readinessScore >= 71 && missingItems.length <= 3) {
    return "ready";
  }

  return "standard";
}

function buildOverview(lead: LeadConsultationSummaryInput) {
  const packageType = normalizeLeadSummaryText(lead.packageType);
  const packageStructure = normalizeLeadSummaryText(lead.packageStructure);
  const quantity = normalizeLeadSummaryText(lead.quantity);
  const sizeInfo = normalizeLeadSummaryText(lead.sizeInfo);
  const physicalProduct = normalizeLeadSummaryText(lead.hasPhysicalProduct);
  const designFile = normalizeLeadSummaryText(lead.hasDesignFile);
  const dieline = normalizeLeadSummaryText(lead.hasDieline);
  const desiredDueDate = normalizeLeadSummaryText(lead.desiredDueDate);
  const finishingOptions = parseFinishingOptions(lead.finishingOptions);

  if (isUnknownChoice(packageType) && isUnsetQuantity(quantity)) {
    return "고객은 패키지 제작을 문의했지만, 패키지 종류와 수량 정보가 아직 충분히 입력되지 않았습니다. 상담을 통해 제품 종류, 수량, 사이즈를 먼저 확인하는 것이 좋습니다.";
  }

  const sentences: string[] = [];

  sentences.push(
    isUnknownChoice(packageType)
      ? "고객은 패키지 제작을 문의했지만, 패키지 종류는 아직 명확하지 않습니다."
      : `고객은 ${packageType} 제작을 문의했습니다.`
  );

  sentences.push(
    isUnsetQuantity(quantity) ? "수량은 아직 정해지지 않았습니다." : `수량은 ${quantity}로 입력했습니다.`
  );

  if (!isUnknownChoice(packageStructure)) sentences.push(`패키지 구조는 ${packageStructure}로 선택했습니다.`);
  if (sizeInfo) sentences.push(`사이즈 정보는 "${sizeInfo}"로 입력되어 있습니다.`);
  if (physicalProduct) sentences.push(`제품 실물 상태는 "${physicalProduct}"입니다.`);
  if (designFile) sentences.push(`디자인 파일 상태는 "${designFile}"입니다.`);
  if (dieline) sentences.push(`도면 상태는 "${dieline}"입니다.`);
  if (desiredDueDate) sentences.push(`희망 납기는 "${desiredDueDate}"입니다.`);
  if (lead.isUrgent) sentences.push("급건으로 표시된 문의입니다.");
  if (finishingOptions.length) sentences.push(`후가공은 ${finishingOptions.join(", ")} 항목을 참고해야 합니다.`);

  return sentences.join(" ");
}

function getRiskNotes(lead: LeadConsultationSummaryInput) {
  const riskNotes: string[] = [];
  const finishingOptions = parseFinishingOptions(lead.finishingOptions);

  if (lead.isUrgent) {
    addUnique(riskNotes, "급건은 샘플, 후가공, 건조 시간, 배송 일정에 제한이 있을 수 있습니다.");
  }

  if (hasSpecialFinishing(finishingOptions)) {
    addUnique(riskNotes, "후가공이 포함된 문의입니다. 제작 기간과 최소 수량, 도면 위치 확인이 필요합니다.");
  }

  const physicalProduct = normalizeLeadSummaryText(lead.hasPhysicalProduct);
  if (physicalProduct === "제품 이미지만 있습니다" || physicalProduct === "사이즈표만 있습니다") {
    addUnique(riskNotes, "실물 없이 진행하는 경우 실제 제품 핏, 여유 공간, 오차 확인에 제한이 있을 수 있습니다.");
  }

  if (normalizeLeadSummaryText(lead.hasDesignFile) === "이미지 파일만 있음") {
    addUnique(riskNotes, "이미지 파일만 있는 경우 인쇄용 원본 데이터 확인이 필요합니다.");
  }

  if (normalizeLeadSummaryText(lead.hasDieline) === "도면 제작 필요") {
    addUnique(riskNotes, "도면 제작이 필요한 문의입니다. 구조 상담과 샘플 확인 과정이 필요할 수 있습니다.");
  }

  return riskNotes;
}

function getSuggestedNextActions(lead: LeadConsultationSummaryInput, missingItems: string[]) {
  const actions: string[] = [];
  const finishingOptions = parseFinishingOptions(lead.finishingOptions);

  if (lead.isUrgent) {
    addUnique(actions, "희망 납기와 실제 제작 가능 일정을 먼저 확인한다.");
  }

  if (missingItems.includes("패키지 종류") || missingItems.includes("패키지 구조")) {
    addUnique(actions, "제품 특성과 사용 목적에 맞는 패키지 종류와 구조를 정리한다.");
  }

  if (missingItems.includes("사이즈") || missingItems.includes("제품 무게/내용물 특성")) {
    addUnique(actions, "제품의 실제 사이즈와 무게, 내용물 특성을 확인한다.");
  }

  if (missingItems.includes("수량") || missingItems.includes("희망 납기")) {
    addUnique(actions, "희망 수량과 납기일을 확인한다.");
  }

  if (missingItems.includes("디자인 파일")) {
    addUnique(actions, "디자인 파일 보유 여부와 파일 형식을 확인한다.");
  }

  if (missingItems.includes("도면")) {
    addUnique(actions, "도면 보유 여부와 구조 설계 필요 여부를 확인한다.");
  }

  if (missingItems.includes("후가공") || hasSpecialFinishing(finishingOptions)) {
    addUnique(actions, "후가공 위치와 제작 가능 여부를 확인한다.");
  }

  addUnique(actions, "상담 후 견적 검토 단계로 넘긴다.");

  return actions;
}

export function buildLeadConsultationSummary(lead: LeadConsultationSummaryInput): LeadConsultationSummary {
  const missingItems = getMissingConsultationItems(lead);
  const priorityNotes = getPriorityConsultationNotes(lead);
  const riskNotes = getRiskNotes(lead);
  const suggestedNextActions = getSuggestedNextActions(lead, missingItems);
  const tone = getLeadSummaryTone(lead);

  const titleByTone: Record<LeadSummaryTone, string> = {
    urgent: "급건 일정 우선 확인 필요",
    needs_discovery: "상담 전 기본 조건 확인 필요",
    ready: "빠른 사양 검토 가능",
    standard: "기본 상담 진행 가능"
  };

  return {
    title: titleByTone[tone],
    overview: buildOverview(lead),
    priorityNotes,
    missingItems,
    riskNotes,
    suggestedNextActions
  };
}

export function hasManualConsultationSummary(lead: LeadConsultationSummaryInput) {
  return (
    hasMeaningfulManualSummaryValue(lead.consultationSummaryTitle) ||
    hasMeaningfulManualSummaryValue(lead.consultationSummaryOverview) ||
    hasMeaningfulManualSummaryValue(lead.consultationPriorityNotes) ||
    hasMeaningfulManualSummaryValue(lead.consultationMissingItems) ||
    hasMeaningfulManualSummaryValue(lead.consultationRiskNotes) ||
    hasMeaningfulManualSummaryValue(lead.consultationNextActions)
  );
}

export function parseManualConsultationSummary(lead: LeadConsultationSummaryInput): LeadConsultationSummary | null {
  if (!hasManualConsultationSummary(lead)) return null;

  return {
    title: normalizeLeadSummaryText(lead.consultationSummaryTitle) || "수동 상담 요약",
    overview: normalizeLeadSummaryText(lead.consultationSummaryOverview),
    priorityNotes: parseManualConsultationSummaryList(lead.consultationPriorityNotes),
    missingItems: parseManualConsultationSummaryList(lead.consultationMissingItems),
    riskNotes: parseManualConsultationSummaryList(lead.consultationRiskNotes),
    suggestedNextActions: parseManualConsultationSummaryList(lead.consultationNextActions)
  };
}

export function getDisplayConsultationSummary(lead: LeadConsultationSummaryInput): DisplayConsultationSummary {
  const manualSummary = parseManualConsultationSummary(lead);

  if (manualSummary) {
    return {
      summary: manualSummary,
      source: "manual"
    };
  }

  return {
    summary: buildLeadConsultationSummary(lead),
    source: "auto"
  };
}

export function isPackageTypeFilter(value: string | null | undefined): value is (typeof PACKAGE_TYPE_FILTER_OPTIONS)[number] {
  return PACKAGE_TYPE_FILTER_OPTIONS.includes(value as (typeof PACKAGE_TYPE_FILTER_OPTIONS)[number]);
}

export function isReadinessFilter(value: string | null | undefined): value is ReadinessFilter {
  return READINESS_FILTER_OPTIONS.includes(value as ReadinessFilter);
}

export function buildLeadListQuery(searchParams: URLSearchParams) {
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort");
  const followUp = searchParams.get("followUp");
  const packageType = searchParams.get("packageType");
  const readiness = searchParams.get("readiness");

  const where: Prisma.LeadWhereInput = {};

  if (isLeadStatus(status)) {
    where.status = status;
  }

  if (isPackageTypeFilter(packageType)) {
    where.packageType = packageType;
  }

  if (isReadinessFilter(readiness)) {
    if (readiness === "missing") {
      where.readinessScore = null;
    } else if (readiness === "0-30") {
      where.readinessScore = { gte: 0, lte: 30 };
    } else if (readiness === "31-70") {
      where.readinessScore = { gte: 31, lte: 70 };
    } else {
      where.readinessScore = { gte: 71, lte: 100 };
    }
  }

  if (q) {
    where.OR = [
      { customerName: { contains: q } },
      { companyName: { contains: q } },
      { phone: { contains: q } },
      { packageType: { contains: q } },
      { quantity: { contains: q } }
    ];
  }

  const isFollowUpDue = followUp === "needed" || followUp === "due";

  if (isFollowUpDue) {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const followUpCondition: Prisma.LeadWhereInput = {
      OR: [
        {
          nextFollowUpAt: {
            not: null,
            lte: endOfToday
          }
        },
        {
          status: "NEW",
          createdAt: {
            lte: twoDaysAgo
          }
        }
      ]
    };

    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), followUpCondition];
  }

  const orderBy =
    sort === "score"
      ? [{ leadScore: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  return {
    where,
    orderBy,
    status: isLeadStatus(status) ? status : "",
    q: q ?? "",
    sort: sort ?? "",
    followUp: isFollowUpDue ? "due" : "",
    packageType: isPackageTypeFilter(packageType) ? packageType : "",
    readiness: isReadinessFilter(readiness) ? readiness : ""
  };
}
