import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { MarketingCostManager, type MarketingCostListItem } from "@/components/MarketingCostManager";
import { formatKrw, parseDateRange } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import { MARKETING_COST_CHANNELS } from "@/lib/marketing-cost-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function AdminMarketingCostsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const range = parseDateRange(searchParams);
  const channel = typeof searchParams?.channel === "string" ? searchParams.channel : "";
  const utmSource = typeof searchParams?.utmSource === "string" ? searchParams.utmSource.trim() : "";

  const costs = await prisma.marketingCost.findMany({
    where: {
      costDate: {
        gte: range.from,
        lte: range.to
      },
      ...(channel ? { channel } : {}),
      ...(utmSource ? { utmSource: { contains: utmSource } } : {})
    },
    orderBy: [{ costDate: "desc" }, { createdAt: "desc" }],
    take: 200
  });

  const totalCost = costs.reduce((sum, cost) => sum + cost.amountKrw, 0);
  const items: MarketingCostListItem[] = costs.map((cost) => ({
    id: cost.id,
    costDate: cost.costDate.toISOString(),
    channel: cost.channel,
    utmSource: cost.utmSource ?? "",
    utmMedium: cost.utmMedium ?? "",
    utmCampaign: cost.utmCampaign ?? "",
    amountKrw: cost.amountKrw,
    memo: cost.memo ?? ""
  }));

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/marketing-costs" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">마케팅 비용 관리</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
              광고 플랫폼과 자동 연동하지 않고, 운영자가 직접 입력한 비용을 기준으로 대시보드의 참고 비용 지표를 계산합니다.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-[160px_160px_180px_1fr_auto]">
          <label className="block">
            <span className="label-base">시작일</span>
            <input type="date" name="from" defaultValue={toDateInput(range.from)} className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">종료일</span>
            <input type="date" name="to" defaultValue={toDateInput(range.to)} className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">채널</span>
            <select name="channel" defaultValue={channel} className="input-base mt-2">
              <option value="">전체</option>
              {MARKETING_COST_CHANNELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">utm_source</span>
            <input name="utmSource" defaultValue={utmSource} placeholder="예: naver" className="input-base mt-2" />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="focus-ring min-h-11 w-full rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              적용
            </button>
          </div>
        </form>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="text-xs font-bold text-neutral-500">조회 기간 비용 합계</p>
            <p className="mt-2 text-2xl font-black text-ink">{formatKrw(totalCost)}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="text-xs font-bold text-neutral-500">비용 기록 수</p>
            <p className="mt-2 text-2xl font-black text-ink">{costs.length.toLocaleString("ko-KR")}건</p>
          </div>
        </div>

        <div className="mt-6">
          <MarketingCostManager costs={items} />
        </div>
      </section>
    </main>
  );
}
