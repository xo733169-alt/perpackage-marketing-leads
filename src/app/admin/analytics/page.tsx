import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import {
  calculateCostMetrics,
  calculateDailyLeadTrend,
  calculateFollowUpSummary,
  calculateLeadFunnel,
  calculateLeadKpis,
  formatKrw,
  formatPercent,
  getDateRangeLabel,
  groupLeadsByBoxType,
  groupLeadsByCampaign,
  groupLeadsByIndustry,
  groupLeadsByPortfolioCase,
  groupLeadsBySource,
  parseDateRange,
  sumCampaignCosts,
  type AnalyticsCost,
  type AnalyticsLead
} from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const rangeLinks = [
  { label: "최근 7일", href: "/admin/analytics?range=7d" },
  { label: "최근 30일", href: "/admin/analytics?range=30d" },
  { label: "최근 90일", href: "/admin/analytics?range=90d" },
  { label: "이번 달", href: "/admin/analytics?range=this-month" },
  { label: "지난 달", href: "/admin/analytics?range=last-month" }
];

function toDateInput(value: Date) {
  const timezoneOffsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function KpiCard({
  label,
  value,
  helper
}: {
  label: string;
  value: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-xs font-bold text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-neutral-500">{helper}</p> : null}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-sm text-neutral-500">{message}</div>;
}

function formatScore(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function PerformanceTable({
  rows,
  firstHeader
}: {
  rows: ReturnType<typeof groupLeadsBySource>;
  firstHeader: string;
}) {
  if (rows.length === 0) {
    return <EmptyState message="표시할 데이터가 아직 없습니다." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead className="bg-ivory text-xs font-bold text-charcoal">
            <tr>
              <th className="px-4 py-3 [white-space:nowrap]">{firstHeader}</th>
              <th className="px-4 py-3 [white-space:nowrap]">문의 수</th>
              <th className="px-4 py-3 [white-space:nowrap]">평균 리드 점수</th>
              <th className="px-4 py-3 [white-space:nowrap]">고점수 문의 수</th>
              <th className="px-4 py-3 [white-space:nowrap]">상담중 이상</th>
              <th className="px-4 py-3 [white-space:nowrap]">견적완료 이상</th>
              <th className="px-4 py-3 [white-space:nowrap]">주문확정</th>
              <th className="px-4 py-3 [white-space:nowrap]">주문 전환율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-3 font-bold text-ink">{row.label}</td>
                <td className="px-4 py-3 text-neutral-700">{row.count}</td>
                <td className="px-4 py-3 text-neutral-700">{formatScore(row.averageLeadScore)}</td>
                <td className="px-4 py-3 text-neutral-700">{row.highScoreCount}</td>
                <td className="px-4 py-3 text-neutral-700">{row.contactingOrAboveCount}</td>
                <td className="px-4 py-3 text-neutral-700">{row.quotedOrAboveCount}</td>
                <td className="px-4 py-3 text-neutral-700">{row.orderConfirmedCount}</td>
                <td className="px-4 py-3 font-semibold text-ink">{formatPercent(row.orderConversionRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const range = parseDateRange(searchParams);
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: {
        gte: range.from,
        lte: range.to
      }
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      leadScore: true,
      marketingConsent: true,
      nextFollowUpAt: true,
      industry: true,
      boxType: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      referrer: true,
      sourceCaseSlug: true,
      sourceCaseTitle: true,
      confirmedOrderAmountKrw: true
    },
    orderBy: [{ createdAt: "asc" }]
  });

  const costs = await prisma.marketingCost.findMany({
    where: {
      costDate: {
        gte: range.from,
        lte: range.to
      }
    },
    select: {
      costDate: true,
      channel: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      amountKrw: true
    }
  });

  const analyticsLeads: AnalyticsLead[] = leads;
  const analyticsCosts: AnalyticsCost[] = costs;
  const kpis = calculateLeadKpis(analyticsLeads);
  const funnel = calculateLeadFunnel(analyticsLeads);
  const trend = calculateDailyLeadTrend(analyticsLeads, range);
  const sourceRows = groupLeadsBySource(analyticsLeads);
  const campaignRows = groupLeadsByCampaign(analyticsLeads);
  const portfolioRows = groupLeadsByPortfolioCase(analyticsLeads);
  const industryRows = groupLeadsByIndustry(analyticsLeads);
  const boxTypeRows = groupLeadsByBoxType(analyticsLeads);
  const followUp = calculateFollowUpSummary(analyticsLeads);
  const maxFunnel = Math.max(...funnel.map((item) => item.count), 1);
  const maxDaily = Math.max(...trend.map((item) => item.count), 1);

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/analytics" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">마케팅 성과 대시보드</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
              {getDateRangeLabel(range)} 기준의 집계입니다. 광고비와 매출 지표는 수동 입력 데이터 기준의 참고용 성과입니다.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {rangeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <form className="mt-3 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-[180px_180px_auto]">
          <label className="block">
            <span className="label-base">시작일</span>
            <input type="date" name="from" defaultValue={toDateInput(range.from)} className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">종료일</span>
            <input type="date" name="to" defaultValue={toDateInput(range.to)} className="input-base mt-2" />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="focus-ring min-h-11 w-full rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              직접 선택
            </button>
          </div>
        </form>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="전체 문의 수" value={`${kpis.total.toLocaleString("ko-KR")}건`} />
          <KpiCard label="신규 문의 수" value={`${kpis.newLeads.toLocaleString("ko-KR")}건`} />
          <KpiCard label="상담중 문의 수" value={`${kpis.contacting.toLocaleString("ko-KR")}건`} />
          <KpiCard label="견적완료 수" value={`${kpis.quoted.toLocaleString("ko-KR")}건`} />
          <KpiCard label="주문확정 수" value={`${kpis.orderConfirmed.toLocaleString("ko-KR")}건`} />
          <KpiCard label="보류/종료 수" value={`${kpis.onHoldClosed.toLocaleString("ko-KR")}건`} />
          <KpiCard label="평균 리드 점수" value={formatScore(kpis.averageLeadScore)} />
          <KpiCard label="고점수 리드 수" value={`${kpis.highScoreLeads.toLocaleString("ko-KR")}건`} helper="리드 점수 50점 이상" />
          <KpiCard label="제작사례 유입 문의 수" value={`${kpis.portfolioLeads.toLocaleString("ko-KR")}건`} />
          <KpiCard label="후속 연락 필요 수" value={`${kpis.followUpNeeded.toLocaleString("ko-KR")}건`} />
          <KpiCard label="마케팅 수신 동의 수" value={`${kpis.marketingConsentLeads.toLocaleString("ko-KR")}건`} />
          <KpiCard label="상담 전환율" value={formatPercent(kpis.consultationConversionRate)} />
          <KpiCard label="견적 전환율" value={formatPercent(kpis.quoteConversionRate)} />
          <KpiCard label="주문 전환율" value={formatPercent(kpis.orderConversionRate)} />
          {kpis.hasConfirmedOrderAmount ? (
            <KpiCard label="확정 주문 금액 합계" value={formatKrw(kpis.confirmedOrderAmountTotal)} helper="관리자 내부 기록 기준" />
          ) : null}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">문의 전환 퍼널</h2>
            <div className="mt-5 space-y-4">
              {funnel.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-ink">{item.label}</span>
                    <span className="text-neutral-600">{item.count.toLocaleString("ko-KR")}건</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-ivory">
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${Math.max((item.count / maxFunnel) * 100, item.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">후속 연락 요약</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <KpiCard label="오늘 후속 연락 필요" value={`${followUp.todayDue}건`} />
              <KpiCard label="기한 지난 후속 연락" value={`${followUp.overdue}건`} />
              <KpiCard label="NEW 상태 2일 이상" value={`${followUp.staleNew}건`} />
            </div>
            <Link
              href="/admin/leads?followUp=due"
              className="focus-ring mt-5 inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ink"
            >
              후속 연락 필요 리드 보기
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-bold text-ink">일별 문의 추이</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold text-charcoal">
                <tr>
                  <th className="px-4 py-3">날짜</th>
                  <th className="px-4 py-3">문의 수</th>
                  <th className="px-4 py-3">고점수 문의 수</th>
                  <th className="px-4 py-3">제작사례 유입 문의 수</th>
                  <th className="px-4 py-3">추이</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {trend.map((row) => (
                  <tr key={row.date}>
                    <td className="px-4 py-3 font-semibold text-ink">{row.date}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.count}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.highScoreCount}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.portfolioCount}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-ivory">
                        <div
                          className="h-full rounded-full bg-brass"
                          style={{ width: `${Math.max((row.count / maxDaily) * 100, row.count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-bold text-ink">유입 출처 성과</h2>
          <PerformanceTable rows={sourceRows} firstHeader="유입 출처" />
        </section>

        <section className="mt-10 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink">캠페인 성과</h2>
            <p className="mt-1 text-sm text-neutral-600">
              광고비, 문의당 비용, 주문당 비용, 참고 ROAS는 수동 입력 비용과 저장된 확정 주문 금액 기준입니다.
            </p>
          </div>
          {campaignRows.length === 0 ? (
            <EmptyState message="캠페인 유입 데이터가 아직 없습니다." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[1160px] w-full border-collapse text-left text-sm">
                  <thead className="bg-ivory text-xs font-bold text-charcoal">
                    <tr>
                      <th className="px-4 py-3">utm_source</th>
                      <th className="px-4 py-3">utm_medium</th>
                      <th className="px-4 py-3">utm_campaign</th>
                      <th className="px-4 py-3">문의 수</th>
                      <th className="px-4 py-3">평균 리드 점수</th>
                      <th className="px-4 py-3">견적완료 이상</th>
                      <th className="px-4 py-3">주문확정</th>
                      <th className="px-4 py-3">연결 광고비</th>
                      <th className="px-4 py-3">문의당 비용</th>
                      <th className="px-4 py-3">주문당 비용</th>
                      <th className="px-4 py-3">참고 ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {campaignRows.map((row) => {
                      const costKrw = sumCampaignCosts(analyticsCosts, row);
                      const revenue = row.leads.reduce((sum, lead) => sum + (lead.confirmedOrderAmountKrw ?? 0), 0);
                      const costMetrics = calculateCostMetrics({
                        costKrw,
                        leadCount: row.count,
                        orderCount: row.orderConfirmedCount,
                        confirmedOrderAmountKrw: revenue
                      });

                      return (
                        <tr key={row.key}>
                          <td className="px-4 py-3 font-semibold text-ink">{row.utmSource}</td>
                          <td className="px-4 py-3 text-neutral-700">{row.utmMedium}</td>
                          <td className="px-4 py-3 text-neutral-700">{row.utmCampaign}</td>
                          <td className="px-4 py-3 text-neutral-700">{row.count}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatScore(row.averageLeadScore)}</td>
                          <td className="px-4 py-3 text-neutral-700">{row.quotedOrAboveCount}</td>
                          <td className="px-4 py-3 text-neutral-700">{row.orderConfirmedCount}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatKrw(costMetrics.costKrw)}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatKrw(costMetrics.costPerLeadKrw)}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatKrw(costMetrics.costPerOrderKrw)}</td>
                          <td className="px-4 py-3 text-neutral-700">
                            {costMetrics.referenceRoas ? `${costMetrics.referenceRoas.toFixed(1)}배` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-bold text-ink">제작 사례 성과</h2>
          {portfolioRows.length === 0 ? (
            <EmptyState message="제작 사례를 통한 문의 데이터가 아직 없습니다." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[880px] w-full border-collapse text-left text-sm">
                  <thead className="bg-ivory text-xs font-bold text-charcoal">
                    <tr>
                      <th className="px-4 py-3">제작 사례</th>
                      <th className="px-4 py-3">문의 수</th>
                      <th className="px-4 py-3">평균 리드 점수</th>
                      <th className="px-4 py-3">견적완료 이상</th>
                      <th className="px-4 py-3">주문확정</th>
                      <th className="px-4 py-3">주문 전환율</th>
                      <th className="px-4 py-3">공개 페이지</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {portfolioRows.map((row) => (
                      <tr key={row.key}>
                        <td className="px-4 py-3 font-bold text-ink">{row.label}</td>
                        <td className="px-4 py-3 text-neutral-700">{row.count}</td>
                        <td className="px-4 py-3 text-neutral-700">{formatScore(row.averageLeadScore)}</td>
                        <td className="px-4 py-3 text-neutral-700">{row.quotedOrAboveCount}</td>
                        <td className="px-4 py-3 text-neutral-700">{row.orderConfirmedCount}</td>
                        <td className="px-4 py-3 text-neutral-700">{formatPercent(row.orderConversionRate)}</td>
                        <td className="px-4 py-3">
                          {row.sourceCaseSlug ? (
                            <Link href={`/portfolio/${row.sourceCaseSlug}`} className="font-semibold underline underline-offset-4">
                              보기
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">업종별 성과</h2>
            <PerformanceTable rows={industryRows} firstHeader="업종" />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">박스 종류별 성과</h2>
            <PerformanceTable rows={boxTypeRows} firstHeader="박스 종류" />
          </div>
        </section>
      </section>
    </main>
  );
}
