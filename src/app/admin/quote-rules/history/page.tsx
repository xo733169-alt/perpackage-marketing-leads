import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  QUOTE_RULE_CHANGE_TYPES,
  QUOTE_RULE_CHANGE_TYPE_LABELS,
  type QuoteRuleChangeType
} from "@/lib/quote-rule-log";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(value);
}

export default async function QuoteRuleHistoryPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const q = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const changeType = typeof searchParams?.changeType === "string" ? searchParams.changeType : "";
  const where: Prisma.QuoteRuleChangeLogWhereInput = {};

  if (q) where.quoteRuleNameSnapshot = { contains: q };
  if (QUOTE_RULE_CHANGE_TYPES.includes(changeType as QuoteRuleChangeType)) where.changeType = changeType;

  const logs = await prisma.quoteRuleChangeLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-rules" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">견적 룰 변경 이력</h1>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-[1fr_180px_auto]">
          <label className="block">
            <span className="label-base">룰 이름 검색</span>
            <input name="q" defaultValue={q} className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">변경 유형</span>
            <select name="changeType" defaultValue={changeType} className="input-base mt-2">
              <option value="">전체</option>
              {QUOTE_RULE_CHANGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {QUOTE_RULE_CHANGE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="focus-ring min-h-11 w-full rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white">
              적용
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-ivory text-xs font-bold text-charcoal">
              <tr>
                <th className="px-4 py-3">변경일</th>
                <th className="px-4 py-3">룰 이름</th>
                <th className="px-4 py-3">변경 유형</th>
                <th className="px-4 py-3">변경 사유</th>
                <th className="px-4 py-3">변경자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    변경 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 font-bold">{log.quoteRuleNameSnapshot}</td>
                    <td className="px-4 py-3">
                      {QUOTE_RULE_CHANGE_TYPE_LABELS[log.changeType as QuoteRuleChangeType] ?? log.changeType}
                    </td>
                    <td className="px-4 py-3">{log.changeReason || "-"}</td>
                    <td className="px-4 py-3">{log.changedBy || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
