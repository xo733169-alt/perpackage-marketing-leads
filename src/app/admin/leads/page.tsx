import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { buildLeadListQuery, getReadinessListLabel, PACKAGE_TYPE_FILTER_OPTIONS } from "@/lib/admin-leads";
import { isAdminAuthenticated } from "@/lib/auth";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/lead-options";
import { prisma } from "@/lib/prisma";
import { getLeadSourceLabel } from "@/lib/source";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

function formatOptionalDate(value: Date | null) {
  return value ? formatDate(value) : "-";
}

function formatOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "미입력";
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "NEW":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "CONTACTING":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "QUOTED":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "ORDER_CONFIRMED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ON_HOLD":
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
    default:
      return "border-line bg-white text-neutral-700";
  }
}

function getReadinessBadgeClass(score: number | null) {
  if (score === null) return "border-neutral-200 bg-neutral-50 text-neutral-600";
  if (score <= 30) return "border-red-200 bg-red-50 text-red-700";
  if (score <= 70) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default async function AdminLeadsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const urlSearchParams = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (typeof value === "string") urlSearchParams.set(key, value);
  });

  const { where, orderBy, status, q, sort, followUp, packageType, readiness } = buildLeadListQuery(urlSearchParams);
  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    take: 100
  });

  const csvParams = new URLSearchParams();
  if (status) csvParams.set("status", status);
  if (q) csvParams.set("q", q);
  if (sort) csvParams.set("sort", sort);
  if (followUp) csvParams.set("followUp", followUp);
  if (packageType) csvParams.set("packageType", packageType);
  if (readiness) csvParams.set("readiness", readiness);

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/leads" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-brass">관리자</p>
              <h1 className="mt-2 text-3xl font-black text-ink">견적 문의 리드</h1>
            </div>
            <a
              href={`/api/admin/leads/export${csvParams.toString() ? `?${csvParams.toString()}` : ""}`}
              className="focus-ring w-fit rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
            >
              CSV 다운로드
            </a>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-2 xl:grid-cols-[1fr_150px_160px_150px_150px_150px_auto]">
          <label className="block">
            <span className="label-base">검색</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="고객명, 회사명, 연락처, 패키지 종류"
              className="input-base mt-2"
            />
          </label>
          <label className="block">
            <span className="label-base">상담 상태</span>
            <select name="status" defaultValue={status} className="input-base mt-2">
              <option value="">전체</option>
              {LEAD_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">후속 연락</span>
            <select name="followUp" defaultValue={followUp} className="input-base mt-2">
              <option value="">전체</option>
              <option value="due">후속 연락 필요</option>
            </select>
          </label>
          <label className="block">
            <span className="label-base">패키지 종류</span>
            <select name="packageType" defaultValue={packageType} className="input-base mt-2">
              <option value="">전체</option>
              {PACKAGE_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">상담 준비도</span>
            <select name="readiness" defaultValue={readiness} className="input-base mt-2">
              <option value="">전체</option>
              <option value="0-30">0~30</option>
              <option value="31-70">31~70</option>
              <option value="71-100">71~100</option>
              <option value="missing">미계산</option>
            </select>
          </label>
          <label className="block">
            <span className="label-base">정렬</span>
            <select name="sort" defaultValue={sort} className="input-base mt-2">
              <option value="">최신순</option>
              <option value="score">리드 점수 높은순</option>
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
            <table className="min-w-[1660px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase text-charcoal">
                <tr>
                  <th className="px-4 py-3 [white-space:nowrap]">접수일</th>
                  <th className="px-4 py-3 [white-space:nowrap]">고객명</th>
                  <th className="px-4 py-3 [white-space:nowrap]">회사명</th>
                  <th className="px-4 py-3 [white-space:nowrap]">연락처</th>
                  <th className="px-4 py-3 [white-space:nowrap]">유입</th>
                  <th className="px-4 py-3 [white-space:nowrap]">제작사례 유입</th>
                  <th className="px-4 py-3 [white-space:nowrap]">업종</th>
                  <th className="px-4 py-3 [white-space:nowrap]">박스 종류</th>
                  <th className="px-4 py-3 [white-space:nowrap]">패키지 정보</th>
                  <th className="px-4 py-3 [white-space:nowrap]">상담 준비도</th>
                  <th className="px-4 py-3 [white-space:nowrap]">제작 수량</th>
                  <th className="px-4 py-3 [white-space:nowrap]">리드 점수</th>
                  <th className="px-4 py-3 [white-space:nowrap]">상담 상태</th>
                  <th className="px-4 py-3 [white-space:nowrap]">다음 후속 연락일</th>
                  <th className="px-4 py-3 [white-space:nowrap]">마지막 연락일</th>
                  <th className="px-4 py-3 [white-space:nowrap]">상세 보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-4 py-10 text-center text-neutral-500">
                      조건에 맞는 문의가 없습니다.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const statusLabel = STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] ?? lead.status;
                    const isHighScore = lead.leadScore >= 50;

                    return (
                      <tr key={lead.id} className={isHighScore ? "align-top bg-amber-50/40" : "align-top"}>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{formatDate(lead.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold text-ink [white-space:nowrap]">{lead.customerName}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{lead.companyName ?? "-"}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{lead.phone}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{getLeadSourceLabel(lead)}</td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          {lead.sourceCaseSlug ? (
                            <span className="inline-flex rounded-full bg-ivory px-2 py-1 text-[11px] font-bold text-brass">
                              제작사례 유입
                            </span>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{lead.industry}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{lead.boxType}</td>
                        <td className="px-4 py-3">
                          <div className="flex max-w-[230px] flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex rounded-full border border-line bg-ivory px-2.5 py-1 text-xs font-bold text-ink">
                                {formatOptionalText(lead.packageType)}
                              </span>
                              {lead.isUrgent ? (
                                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                                  급건
                                </span>
                              ) : null}
                            </div>
                            <span className="text-xs leading-5 text-neutral-600">수량: {formatOptionalText(lead.quantity)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getReadinessBadgeClass(
                              lead.readinessScore
                            )}`}
                          >
                            {getReadinessListLabel(lead.readinessScore)}
                            {lead.readinessScore === null ? "" : ` · ${lead.readinessScore}점`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{lead.quantityRange}</td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span
                            className={
                              isHighScore
                                ? "inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900"
                                : "font-bold text-ink"
                            }
                          >
                            {lead.leadScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(
                              lead.status
                            )}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">
                          {formatOptionalDate(lead.nextFollowUpAt)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">
                          {formatOptionalDate(lead.lastContactedAt)}
                        </td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                          >
                            상세 보기
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
