import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCafe24OrderLookupPanel } from "@/components/AdminCafe24OrderLookupPanel";
import { AdminNav } from "@/components/AdminNav";
import { formatDateTime, formatOptionalText } from "@/lib/admin-uploads";
import { isAdminAuthenticated } from "@/lib/auth";
import { getCafe24ConfigStatus, getCafe24WebhookDebugInfo } from "@/lib/cafe24";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700"}>
      {label}: {ok ? "설정됨" : "필요"}
    </span>
  );
}

export default async function AdminCafe24Page({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const config = getCafe24ConfigStatus();
  const fallbackMallId = process.env.CAFE24_MALL_ID?.trim() || null;
  const token = config.hasMallId
    ? await prisma.cafe24Token.findUnique({
      where: { mallId: fallbackMallId || "" }
    })
    : null;
  const webhookEvents = await prisma.cafe24WebhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      uploadProject: {
        select: {
          id: true,
          uploadCode: true,
          cafe24OrderNo: true,
          customerName: true,
          companyName: true
        }
      }
    }
  });
  const error = typeof searchParams?.error === "string" ? searchParams.error : "";
  const isExpired = token ? token.expiresAt.getTime() <= Date.now() : false;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/cafe24" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-brass">관리자</p>
              <h1 className="mt-2 text-3xl font-black text-ink">Cafe24 연동 상태</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                Cafe24 OAuth 연결, Webhook 수신 로그, 업로드 접수번호 자동 연결 상태를 확인합니다.
              </p>
            </div>
            <Link
              href="/api/cafe24/oauth/start"
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              OAuth 연결 시작
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Cafe24 연동 처리 중 문제가 발생했습니다: {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">환경변수 설정</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge ok={config.hasMallId} label="Mall ID" />
              <StatusBadge ok={config.hasClientId} label="Client ID" />
              <StatusBadge ok={config.hasClientSecret} label="Client Secret" />
              <StatusBadge ok={config.hasRedirectUri} label="Redirect URI" />
              <StatusBadge ok={config.hasWebhookSecret} label="Webhook Secret" />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="font-bold text-neutral-500">API version</dt>
                <dd className="mt-1 text-ink">{config.apiVersion}</dd>
              </div>
              <div>
                <dt className="font-bold text-neutral-500">Scopes</dt>
                <dd className="mt-1 break-words text-ink">{config.scopes.join(", ")}</dd>
              </div>
              <div>
                <dt className="font-bold text-neutral-500">누락 항목</dt>
                <dd className="mt-1 text-ink">{config.missing.length ? config.missing.join(", ") : "없음"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">OAuth token 상태</h2>
            {token ? (
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-neutral-500">mallId</dt>
                  <dd className="mt-1 text-ink">{token.mallId}</dd>
                </div>
                <div>
                  <dt className="font-bold text-neutral-500">만료 시각</dt>
                  <dd className={isExpired ? "mt-1 font-bold text-red-700" : "mt-1 text-ink"}>{formatDateTime(token.expiresAt)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-neutral-500">연결 상태</dt>
                  <dd className="mt-1 text-ink">{isExpired ? "갱신 필요" : "연결됨"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-neutral-500">최근 갱신</dt>
                  <dd className="mt-1 text-ink">{formatDateTime(token.updatedAt)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                아직 Cafe24 OAuth token이 저장되지 않았습니다.
              </p>
            )}
          </section>
        </div>

        <AdminCafe24OrderLookupPanel mallId={fallbackMallId} />

        <section className="mt-6 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-bold text-ink">최근 Webhook 수신 로그</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
              <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
                <thead className="bg-ivory text-xs font-bold uppercase text-charcoal">
                  <tr>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">event type</th>
                    <th className="px-4 py-3">mall_id</th>
                    <th className="px-4 py-3">order_no</th>
                    <th className="px-4 py-3">order_id</th>
                    <th className="px-4 py-3">tokenLookupMallId</th>
                    <th className="px-4 py-3">주문 상세 조회</th>
                    <th className="px-4 py-3">접수번호</th>
                    <th className="px-4 py-3">연결 프로젝트</th>
                    <th className="px-4 py-3">received_at</th>
                    <th className="px-4 py-3">processed_at</th>
                    <th className="px-4 py-3">메시지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {webhookEvents.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-neutral-500">
                        아직 수신된 Webhook 로그가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    webhookEvents.map((event) => {
                      const debug = getCafe24WebhookDebugInfo(event, fallbackMallId);

                      return (
                        <tr key={event.id} className="align-top">
                          <td className="px-4 py-3 font-bold text-ink">{event.status}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatOptionalText(debug.eventType ?? event.eventType)}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatOptionalText(debug.mallId)}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatOptionalText(event.orderNo ?? event.orderId)}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatOptionalText(debug.orderId ?? event.orderId)}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatOptionalText(debug.tokenLookupMallId)}</td>
                          <td className="px-4 py-3 text-neutral-700">
                            <div className="font-semibold text-ink">{debug.orderDetailLookupStatus}</div>
                            <div className="mt-1 max-w-[260px] text-xs leading-5 text-neutral-500">{formatOptionalText(debug.orderDetailLookupMessage)}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-ink">{formatOptionalText(event.uploadCode)}</td>
                          <td className="px-4 py-3 text-neutral-700">
                            {event.uploadProject ? (
                              <Link href={`/admin/uploads/${event.uploadProject.id}`} className="font-semibold text-ink underline">
                                {event.uploadProject.uploadCode ?? event.uploadProject.companyName ?? event.uploadProject.customerName}
                              </Link>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{formatDateTime(event.createdAt)}</td>
                          <td className="px-4 py-3 text-neutral-700">{formatDateTime(event.processedAt)}</td>
                          <td className="px-4 py-3 text-red-700">{formatOptionalText(event.errorMessage ?? debug.orderDetailLookupMessage)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
