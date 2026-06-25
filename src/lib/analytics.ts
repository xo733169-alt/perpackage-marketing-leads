export const HIGH_SCORE_THRESHOLD = 50;

export const DATE_RANGE_PRESETS = ["7d", "30d", "90d", "this-month", "last-month", "custom"] as const;

export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export type AnalyticsLead = {
  id?: string;
  createdAt: Date;
  status: string;
  leadScore: number;
  marketingConsent?: boolean | null;
  nextFollowUpAt?: Date | null;
  industry?: string | null;
  boxType?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  sourceCaseSlug?: string | null;
  sourceCaseTitle?: string | null;
  confirmedOrderAmountKrw?: number | null;
};

export type AnalyticsCost = {
  costDate: Date;
  channel: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  amountKrw: number;
};

export type ParsedDateRange = {
  from: Date;
  to: Date;
  preset: DateRangePreset;
};

type QueryLike = URLSearchParams | Record<string, string | string[] | undefined> | undefined;

function getQueryValue(input: QueryLike, key: string): string | undefined {
  if (!input) return undefined;
  if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
  const value = input[key];
  return typeof value === "string" ? value : undefined;
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseDateInput(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function isPreset(value: string | undefined): value is DateRangePreset {
  return DATE_RANGE_PRESETS.includes(value as DateRangePreset);
}

export function parseDateRange(input?: QueryLike, now = new Date()): ParsedDateRange {
  const range = getQueryValue(input, "range");
  const fromInput = getQueryValue(input, "from");
  const toInput = getQueryValue(input, "to");

  if (fromInput || toInput) {
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 29);

    return {
      from: startOfDay(parseDateInput(fromInput, defaultFrom)),
      to: endOfDay(parseDateInput(toInput, now)),
      preset: "custom"
    };
  }

  const preset = isPreset(range) && range !== "custom" ? range : "30d";
  const to = endOfDay(now);
  const from = startOfDay(now);

  if (preset === "7d") {
    from.setDate(from.getDate() - 6);
  } else if (preset === "30d") {
    from.setDate(from.getDate() - 29);
  } else if (preset === "90d") {
    from.setDate(from.getDate() - 89);
  } else if (preset === "this-month") {
    from.setDate(1);
  } else if (preset === "last-month") {
    from.setDate(1);
    from.setMonth(from.getMonth() - 1);
    const lastMonthEnd = new Date(from);
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
    lastMonthEnd.setDate(0);
    return {
      from,
      to: endOfDay(lastMonthEnd),
      preset
    };
  }

  return { from, to, preset };
}

export function getDateRangeLabel(range: ParsedDateRange): string {
  if (range.preset === "7d") return "최근 7일";
  if (range.preset === "30d") return "최근 30일";
  if (range.preset === "90d") return "최근 90일";
  if (range.preset === "this-month") return "이번 달";
  if (range.preset === "last-month") return "지난 달";

  const formatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" });
  return `${formatter.format(range.from)} ~ ${formatter.format(range.to)}`;
}

export function calculateAverageLeadScore(leads: AnalyticsLead[]): number {
  if (leads.length === 0) return 0;
  const total = leads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0);
  return Math.round((total / leads.length) * 10) / 10;
}

export function calculateConversionRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function isContactingOrAbove(status: string): boolean {
  return ["CONTACTING", "QUOTED", "ORDER_CONFIRMED"].includes(status);
}

function isQuotedOrAbove(status: string): boolean {
  return ["QUOTED", "ORDER_CONFIRMED"].includes(status);
}

function isHighScore(lead: AnalyticsLead): boolean {
  return lead.leadScore >= HIGH_SCORE_THRESHOLD;
}

function isPortfolioLead(lead: AnalyticsLead): boolean {
  return Boolean(lead.sourceCaseSlug?.trim() || lead.sourceCaseTitle?.trim());
}

function uniqueLeadCount(leads: AnalyticsLead[]): number {
  const seen = new Set<string>();
  let anonymousCount = 0;

  leads.forEach((lead) => {
    if (lead.id) {
      seen.add(lead.id);
    } else {
      anonymousCount += 1;
    }
  });

  return seen.size + anonymousCount;
}

export function calculateFollowUpSummary(leads: AnalyticsLead[], now = new Date()) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const todayDue = leads.filter(
    (lead) => lead.nextFollowUpAt && lead.nextFollowUpAt >= todayStart && lead.nextFollowUpAt <= todayEnd
  );
  const overdue = leads.filter((lead) => lead.nextFollowUpAt && lead.nextFollowUpAt < todayStart);
  const staleNew = leads.filter((lead) => lead.status === "NEW" && lead.createdAt <= twoDaysAgo);
  const needed = leads.filter(
    (lead) => (lead.nextFollowUpAt && lead.nextFollowUpAt <= todayEnd) || (lead.status === "NEW" && lead.createdAt <= twoDaysAgo)
  );

  return {
    todayDue: todayDue.length,
    overdue: overdue.length,
    staleNew: staleNew.length,
    needed: uniqueLeadCount(needed)
  };
}

export function calculateLeadKpis(leads: AnalyticsLead[], now = new Date()) {
  const total = leads.length;
  const contactingOrAbove = leads.filter((lead) => isContactingOrAbove(lead.status)).length;
  const quotedOrAbove = leads.filter((lead) => isQuotedOrAbove(lead.status)).length;
  const orderConfirmed = leads.filter((lead) => lead.status === "ORDER_CONFIRMED").length;
  const revenueTotal = leads.reduce((sum, lead) => sum + (lead.confirmedOrderAmountKrw ?? 0), 0);
  const followUp = calculateFollowUpSummary(leads, now);

  return {
    total,
    newLeads: leads.filter((lead) => lead.status === "NEW").length,
    contacting: leads.filter((lead) => lead.status === "CONTACTING").length,
    quoted: leads.filter((lead) => lead.status === "QUOTED").length,
    orderConfirmed,
    onHoldClosed: leads.filter((lead) => lead.status === "ON_HOLD" || lead.status === "CLOSED").length,
    averageLeadScore: calculateAverageLeadScore(leads),
    highScoreLeads: leads.filter(isHighScore).length,
    portfolioLeads: leads.filter(isPortfolioLead).length,
    followUpNeeded: followUp.needed,
    marketingConsentLeads: leads.filter((lead) => lead.marketingConsent === true).length,
    consultationConversionRate: calculateConversionRate(contactingOrAbove, total),
    quoteConversionRate: calculateConversionRate(quotedOrAbove, total),
    orderConversionRate: calculateConversionRate(orderConfirmed, total),
    confirmedOrderAmountTotal: revenueTotal,
    hasConfirmedOrderAmount: revenueTotal > 0
  };
}

export function calculateLeadFunnel(leads: AnalyticsLead[]) {
  return [
    { label: "문의 접수", count: leads.length },
    { label: "상담중", count: leads.filter((lead) => isContactingOrAbove(lead.status)).length },
    { label: "견적완료", count: leads.filter((lead) => isQuotedOrAbove(lead.status)).length },
    { label: "주문확정", count: leads.filter((lead) => lead.status === "ORDER_CONFIRMED").length }
  ];
}

export function calculateDailyLeadTrend(leads: AnalyticsLead[], range: ParsedDateRange) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const rows: { date: string; count: number; highScoreCount: number; portfolioCount: number }[] = [];
  const cursor = startOfDay(range.from);
  const to = startOfDay(range.to);

  while (cursor <= to) {
    const dateKey = formatter.format(cursor);
    const dayLeads = leads.filter((lead) => formatter.format(lead.createdAt) === dateKey);
    rows.push({
      date: dateKey,
      count: dayLeads.length,
      highScoreCount: dayLeads.filter(isHighScore).length,
      portfolioCount: dayLeads.filter(isPortfolioLead).length
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
}

function blankToDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "-";
}

export function getAnalyticsSourceLabel(lead: Pick<AnalyticsLead, "utmSource" | "referrer">): string {
  if (lead.utmSource?.trim()) return lead.utmSource.trim();
  if (lead.referrer?.trim()) return "외부 유입";
  return "직접 유입";
}

type GroupAccumulator = {
  key: string;
  label: string;
  leads: AnalyticsLead[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sourceCaseSlug?: string;
  sourceCaseTitle?: string;
};

function toPerformanceRow(group: GroupAccumulator) {
  const total = group.leads.length;
  const orderConfirmed = group.leads.filter((lead) => lead.status === "ORDER_CONFIRMED").length;

  return {
    ...group,
    count: total,
    averageLeadScore: calculateAverageLeadScore(group.leads),
    highScoreCount: group.leads.filter(isHighScore).length,
    contactingOrAboveCount: group.leads.filter((lead) => isContactingOrAbove(lead.status)).length,
    quotedOrAboveCount: group.leads.filter((lead) => isQuotedOrAbove(lead.status)).length,
    orderConfirmedCount: orderConfirmed,
    orderConversionRate: calculateConversionRate(orderConfirmed, total)
  };
}

function groupBy(leads: AnalyticsLead[], getGroup: (lead: AnalyticsLead) => GroupAccumulator | null) {
  const groups = new Map<string, GroupAccumulator>();

  leads.forEach((lead) => {
    const group = getGroup(lead);
    if (!group) return;

    const existing = groups.get(group.key);
    if (existing) {
      existing.leads.push(lead);
    } else {
      groups.set(group.key, { ...group, leads: [lead] });
    }
  });

  return Array.from(groups.values())
    .map(toPerformanceRow)
    .sort((left, right) => right.count - left.count || right.averageLeadScore - left.averageLeadScore);
}

export function groupLeadsBySource(leads: AnalyticsLead[]) {
  return groupBy(leads, (lead) => ({
    key: getAnalyticsSourceLabel(lead),
    label: getAnalyticsSourceLabel(lead),
    leads: []
  }));
}

export function groupLeadsByCampaign(leads: AnalyticsLead[]) {
  return groupBy(leads, (lead) => {
    if (!lead.utmSource && !lead.utmMedium && !lead.utmCampaign) return null;
    const utmSource = blankToDash(lead.utmSource);
    const utmMedium = blankToDash(lead.utmMedium);
    const utmCampaign = blankToDash(lead.utmCampaign);

    return {
      key: `${utmSource}|${utmMedium}|${utmCampaign}`,
      label: [utmSource, utmMedium, utmCampaign].join(" / "),
      leads: [],
      utmSource,
      utmMedium,
      utmCampaign
    };
  });
}

export function groupLeadsByPortfolioCase(leads: AnalyticsLead[]) {
  return groupBy(leads, (lead) => {
    if (!lead.sourceCaseSlug && !lead.sourceCaseTitle) return null;
    const title = blankToDash(lead.sourceCaseTitle);
    const slug = blankToDash(lead.sourceCaseSlug);

    return {
      key: `${slug}|${title}`,
      label: title === "-" ? slug : title,
      leads: [],
      sourceCaseSlug: slug === "-" ? undefined : slug,
      sourceCaseTitle: title === "-" ? undefined : title
    };
  });
}

export function groupLeadsByIndustry(leads: AnalyticsLead[]) {
  return groupBy(leads, (lead) => ({
    key: blankToDash(lead.industry),
    label: blankToDash(lead.industry),
    leads: []
  }));
}

export function groupLeadsByBoxType(leads: AnalyticsLead[]) {
  return groupBy(leads, (lead) => ({
    key: blankToDash(lead.boxType),
    label: blankToDash(lead.boxType),
    leads: []
  }));
}

export function calculateCostMetrics({
  costKrw,
  leadCount,
  orderCount,
  confirmedOrderAmountKrw
}: {
  costKrw: number;
  leadCount: number;
  orderCount: number;
  confirmedOrderAmountKrw?: number;
}) {
  return {
    costKrw,
    costPerLeadKrw: leadCount > 0 ? Math.round(costKrw / leadCount) : null,
    costPerOrderKrw: orderCount > 0 ? Math.round(costKrw / orderCount) : null,
    referenceRoas:
      costKrw > 0 && confirmedOrderAmountKrw && confirmedOrderAmountKrw > 0
        ? confirmedOrderAmountKrw / costKrw
        : null
  };
}

export function sumCampaignCosts(
  costs: AnalyticsCost[],
  campaign: { utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null }
): number {
  const source = blankToDash(campaign.utmSource);
  const medium = blankToDash(campaign.utmMedium);
  const campaignName = blankToDash(campaign.utmCampaign);

  return costs
    .filter(
      (cost) =>
        blankToDash(cost.utmSource) === source &&
        blankToDash(cost.utmMedium) === medium &&
        blankToDash(cost.utmCampaign) === campaignName
    )
    .reduce((sum, cost) => sum + cost.amountKrw, 0);
}

export function sumSourceCosts(costs: AnalyticsCost[], sourceLabel: string): number {
  return costs
    .filter((cost) => cost.utmSource?.trim() === sourceLabel)
    .reduce((sum, cost) => sum + cost.amountKrw, 0);
}

export function formatKrw(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1
  }).format(value * 100)}%`;
}
