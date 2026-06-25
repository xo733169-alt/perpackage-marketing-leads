import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import { BOX_TYPE_OPTIONS } from "@/lib/lead-options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

export default async function AdminQuoteRulesPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const q = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const active = typeof searchParams?.active === "string" ? searchParams.active : "";
  const boxType = typeof searchParams?.boxType === "string" ? searchParams.boxType : "";
  const where: Prisma.QuoteRuleWhereInput = {};

  if (q) {
    where.OR = [{ name: { contains: q } }, { boxType: { contains: q } }, { quantityRange: { contains: q } }];
  }

  if (active === "active") where.isActive = true;
  if (active === "inactive") where.isActive = false;
  if (boxType) where.boxType = boxType;

  const quoteRules = await prisma.quoteRule.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { boxType: "asc" }, { quantityRange: "asc" }, { updatedAt: "desc" }],
    take: 200
  });

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-rules" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-brass">관리자</p>
              <h1 className="mt-2 text-3xl font-black text-ink">견적 룰 관리</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                견적 룰은 내부 참고 계산 기준입니다. 실제 견적은 종이, 구조, 공정, 일정 확인 후 상담을 통해 확정해야 합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/quote-rules/history"
                className="focus-ring w-fit rounded-md border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-ink"
              >
                변경 이력
              </Link>
              <Link
                href="/admin/quote-rules/new"
                className="focus-ring w-fit rounded-md bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-charcoal"
              >
                견적 룰 추가
              </Link>
            </div>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-[1fr_150px_180px_auto]">
          <label className="block">
            <span className="label-base">검색</span>
            <input name="q" defaultValue={q} placeholder="룰 이름, 박스 종류, 수량 구간" className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">활성 여부</span>
            <select name="active" defaultValue={active} className="input-base mt-2">
              <option value="">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </label>
          <label className="block">
            <span className="label-base">박스 종류</span>
            <select name="boxType" defaultValue={boxType} className="input-base mt-2">
              <option value="">전체</option>
              {BOX_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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

        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold text-charcoal">
                <tr>
                  <th className="px-4 py-3">룰 이름</th>
                  <th className="px-4 py-3">활성 여부</th>
                  <th className="px-4 py-3">박스 종류</th>
                  <th className="px-4 py-3">수량 구간</th>
                  <th className="px-4 py-3">기본 단가 범위</th>
                  <th className="px-4 py-3">최소 주문 금액</th>
                  <th className="px-4 py-3">수정일</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {quoteRules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                      조건에 맞는 견적 룰이 없습니다.
                    </td>
                  </tr>
                ) : (
                  quoteRules.map((rule) => (
                    <tr key={rule.id} className="align-top">
                      <td className="px-4 py-3 font-bold text-ink">{rule.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            rule.isActive
                              ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                              : "inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-bold text-neutral-700"
                          }
                        >
                          {rule.isActive ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{rule.boxType}</td>
                      <td className="px-4 py-3 text-neutral-700">{rule.quantityRange}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {formatKrw(rule.baseUnitPriceMinKrw)} ~ {formatKrw(rule.baseUnitPriceMaxKrw)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{formatKrw(rule.minOrderPriceKrw)}</td>
                      <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{formatDate(rule.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/quote-rules/${rule.id}/edit`}
                          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                        >
                          편집
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
