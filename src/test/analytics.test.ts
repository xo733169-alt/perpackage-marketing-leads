import { describe, expect, it } from "vitest";
import {
  calculateCostMetrics,
  calculateLeadFunnel,
  calculateLeadKpis,
  calculateConversionRate,
  formatKrw,
  formatPercent,
  groupLeadsByCampaign,
  groupLeadsByPortfolioCase,
  groupLeadsBySource,
  parseDateRange,
  sumCampaignCosts,
  type AnalyticsCost,
  type AnalyticsLead
} from "@/lib/analytics";

const now = new Date("2026-06-20T12:00:00");

const leads: AnalyticsLead[] = [
  {
    id: "lead-1",
    createdAt: new Date("2026-06-18T10:00:00"),
    status: "NEW",
    leadScore: 10,
    marketingConsent: true,
    industry: "화장품",
    boxType: "싸바리박스"
  },
  {
    id: "lead-2",
    createdAt: new Date("2026-06-19T10:00:00"),
    status: "CONTACTING",
    leadScore: 50,
    industry: "화장품",
    boxType: "자석박스",
    utmSource: "naver",
    utmMedium: "cpc",
    utmCampaign: "premium-box",
    sourceCaseSlug: "cosmetic-magnetic-box",
    sourceCaseTitle: "화장품 자석박스 제작 사례"
  },
  {
    id: "lead-3",
    createdAt: new Date("2026-06-20T09:00:00"),
    status: "QUOTED",
    leadScore: 30,
    referrer: "https://blog.example.com",
    industry: "식품",
    boxType: "상하짝박스"
  },
  {
    id: "lead-4",
    createdAt: new Date("2026-06-20T11:00:00"),
    status: "ORDER_CONFIRMED",
    leadScore: 80,
    industry: "선물세트",
    boxType: "싸바리박스",
    utmSource: "naver",
    utmMedium: "cpc",
    utmCampaign: "premium-box",
    confirmedOrderAmountKrw: 2_000_000
  },
  {
    id: "lead-5",
    createdAt: new Date("2026-06-10T11:00:00"),
    status: "CLOSED",
    leadScore: 20,
    nextFollowUpAt: new Date("2026-06-19T10:00:00"),
    industry: "기타",
    boxType: "아직 모르겠음"
  }
];

describe("analytics helpers", () => {
  it("parses preset date ranges", () => {
    const range = parseDateRange(new URLSearchParams("range=7d"), now);

    expect(range.preset).toBe("7d");
    expect(range.from.getDate()).toBe(14);
    expect(range.to.getDate()).toBe(20);
  });

  it("calculates KPI counts and conversion rates", () => {
    const kpis = calculateLeadKpis(leads, now);

    expect(kpis.total).toBe(5);
    expect(kpis.newLeads).toBe(1);
    expect(kpis.contacting).toBe(1);
    expect(kpis.quoted).toBe(1);
    expect(kpis.orderConfirmed).toBe(1);
    expect(kpis.onHoldClosed).toBe(1);
    expect(kpis.highScoreLeads).toBe(2);
    expect(kpis.portfolioLeads).toBe(1);
    expect(kpis.marketingConsentLeads).toBe(1);
    expect(kpis.consultationConversionRate).toBe(3 / 5);
    expect(kpis.quoteConversionRate).toBe(2 / 5);
    expect(kpis.orderConversionRate).toBe(1 / 5);
    expect(kpis.confirmedOrderAmountTotal).toBe(2_000_000);
  });

  it("calculates funnel as reached stages", () => {
    expect(calculateLeadFunnel(leads)).toEqual([
      { label: "문의 접수", count: 5 },
      { label: "상담중", count: 3 },
      { label: "견적완료", count: 2 },
      { label: "주문확정", count: 1 }
    ]);
  });

  it("groups leads by source, campaign, and portfolio case", () => {
    const sourceRows = groupLeadsBySource(leads);
    const campaignRows = groupLeadsByCampaign(leads);
    const portfolioRows = groupLeadsByPortfolioCase(leads);

    expect(sourceRows.find((row) => row.label === "naver")?.count).toBe(2);
    expect(sourceRows.find((row) => row.label === "외부 유입")?.count).toBe(1);
    expect(sourceRows.find((row) => row.label === "직접 유입")?.count).toBe(2);
    expect(campaignRows).toHaveLength(1);
    expect(campaignRows[0].quotedOrAboveCount).toBe(1);
    expect(campaignRows[0].orderConfirmedCount).toBe(1);
    expect(portfolioRows[0].label).toBe("화장품 자석박스 제작 사례");
  });

  it("calculates conversion and cost metrics", () => {
    const costs: AnalyticsCost[] = [
      {
        costDate: new Date("2026-06-20T00:00:00"),
        channel: "네이버 검색광고",
        utmSource: "naver",
        utmMedium: "cpc",
        utmCampaign: "premium-box",
        amountKrw: 100_000
      }
    ];
    const campaign = groupLeadsByCampaign(leads)[0];
    const costKrw = sumCampaignCosts(costs, campaign);
    const metrics = calculateCostMetrics({
      costKrw,
      leadCount: campaign.count,
      orderCount: campaign.orderConfirmedCount,
      confirmedOrderAmountKrw: 2_000_000
    });

    expect(calculateConversionRate(1, 4)).toBe(0.25);
    expect(costKrw).toBe(100_000);
    expect(metrics.costPerLeadKrw).toBe(50_000);
    expect(metrics.costPerOrderKrw).toBe(100_000);
    expect(metrics.referenceRoas).toBe(20);
  });

  it("formats KRW and percent values", () => {
    expect(formatKrw(1234567)).toBe("1,234,567원");
    expect(formatKrw(null)).toBe("-");
    expect(formatPercent(0.125)).toBe("12.5%");
  });
});
