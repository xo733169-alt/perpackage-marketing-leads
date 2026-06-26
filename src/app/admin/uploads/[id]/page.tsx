import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AdminUploadReviewPanel } from "@/components/AdminUploadReviewPanel";
import {
  formatDateTime,
  formatOptionalText,
  getPrintFileReviewStatusLabel,
  getReviewLogActorLabel,
  getUploadStatusBadgeClass,
  isPrintFileReviewStatus
} from "@/lib/admin-uploads";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatFileSize,
  UPLOADED_FILE_STATUS_UPLOADED,
  type PrintFileReviewStatus
} from "@/lib/print-file-upload-schema";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <dt className="text-xs font-bold text-neutral-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink">{value || "-"}</dd>
    </div>
  );
}

export default async function AdminUploadDetailPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const project = await prisma.uploadProject.findUnique({
    where: { id: params.id },
    include: {
      files: {
        orderBy: [{ version: "asc" }, { createdAt: "asc" }]
      },
      reviewLogs: {
        include: {
          file: {
            select: {
              id: true,
              originalFilename: true,
              version: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      }
    }
  });

  if (!project) {
    notFound();
  }

  const panelStatus: PrintFileReviewStatus = isPrintFileReviewStatus(project.reviewStatus)
    ? project.reviewStatus
    : "upload_waiting";
  const uploadedFiles = project.files.filter((file) => file.uploadStatus === UPLOADED_FILE_STATUS_UPLOADED);
  const pageTitle = project.cafe24OrderNumber || project.companyName || project.customerName;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/uploads" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/admin/uploads" className="text-sm font-semibold text-neutral-600 hover:text-ink">
                업로드 목록으로 돌아가기
              </Link>
              <h1 className="mt-3 text-3xl font-black text-ink">{pageTitle} 인쇄파일</h1>
            </div>
            <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${getUploadStatusBadgeClass(project.reviewStatus)}`}>
              {getPrintFileReviewStatusLabel(project.reviewStatus)}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">주문 및 고객 정보</h2>
              <dl className="mt-4 grid gap-x-6 md:grid-cols-2">
                <Row label="업로드 접수번호" value={formatOptionalText(project.uploadCode)} />
                <Row label="Cafe24 주문번호" value={formatOptionalText(project.cafe24OrderNo)} />
                <Row label="Cafe24 mallId" value={formatOptionalText(project.cafe24MallId)} />
                <Row label="Cafe24 orderId" value={formatOptionalText(project.cafe24OrderId)} />
                <Row label="Cafe24 연결 출처" value={formatOptionalText(project.linkSource)} />
                <Row label="Cafe24 연결 시각" value={formatDateTime(project.linkedAt)} />
                <Row label="Cafe24 최근 동기화" value={formatDateTime(project.orderSyncedAt)} />
                <Row label="Cafe24 주문 메모" value={formatOptionalText(project.cafe24OrderMemo)} />
                <Row label="주문번호" value={formatOptionalText(project.cafe24OrderNumber)} />
                <Row label="업체명" value={formatOptionalText(project.companyName)} />
                <Row label="업체명 또는 고객명" value={project.customerName} />
                <Row label="담당자명" value={formatOptionalText(project.contactName)} />
                <Row label="연락처" value={project.phone} />
                <Row label="이메일" value={formatOptionalText(project.email)} />
                <Row label="카카오톡 아이디" value={formatOptionalText(project.kakaoId)} />
                <Row label="기타 연락 방법" value={formatOptionalText(project.contactMethod)} />
                <Row label="상품명" value={formatOptionalText(project.productName)} />
                <Row label="상품 옵션" value={formatOptionalText(project.productOptionText)} />
                <Row label="개인정보 동의" value={project.privacyAgreed ? "동의" : "확인 필요"} />
                <Row label="업로드 상태" value={getPrintFileReviewStatusLabel(project.status)} />
                <Row label="검수 상태" value={getPrintFileReviewStatusLabel(project.reviewStatus)} />
                <Row label="요청사항" value={formatOptionalText(project.requestMemo)} />
                <Row label="접수일" value={formatDateTime(project.createdAt)} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">업로드 파일 목록</h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full border-collapse text-left text-sm">
                    <thead className="bg-ivory text-xs font-bold uppercase text-charcoal">
                      <tr>
                        <th className="px-4 py-3">파일명</th>
                        <th className="px-4 py-3 [white-space:nowrap]">크기</th>
                        <th className="px-4 py-3 [white-space:nowrap]">형식</th>
                        <th className="px-4 py-3 [white-space:nowrap]">버전</th>
                        <th className="px-4 py-3 [white-space:nowrap]">검수 상태</th>
                        <th className="px-4 py-3 [white-space:nowrap]">업로드 일시</th>
                        <th className="px-4 py-3 [white-space:nowrap]">다운로드</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {project.files.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                            업로드 파일이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        project.files.map((file) => (
                          <tr key={file.id} className="align-top">
                            <td className="px-4 py-3 font-semibold text-ink">{file.originalFilename}</td>
                            <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{formatFileSize(file.fileSize)}</td>
                            <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">
                              {file.fileExtension.toUpperCase()}
                              {file.fileType ? <span className="block text-xs text-neutral-500">{file.fileType}</span> : null}
                            </td>
                            <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">
                              버전 {file.version}
                              <span className="mt-1 block text-xs text-neutral-500">{formatDateTime(file.uploadedAt)}</span>
                            </td>
                            <td className="px-4 py-3 [white-space:nowrap]">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getUploadStatusBadgeClass(file.reviewStatus)}`}>
                                {getPrintFileReviewStatusLabel(file.reviewStatus)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">업로드: {formatDateTime(file.uploadedAt)}</td>
                            <td className="px-4 py-3 [white-space:nowrap]">
                              {file.uploadStatus === UPLOADED_FILE_STATUS_UPLOADED ? (
                                <a
                                  href={`/api/admin/uploads/${project.id}/files/${file.id}/download`}
                                  className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-ink transition hover:border-ink"
                                >
                                  받기
                                </a>
                              ) : (
                                <span className="text-xs text-neutral-500">전송 확인 전</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">검수 기록</h2>
              <div className="mt-4 space-y-3">
                {project.reviewLogs.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    검수 기록이 없습니다.
                  </p>
                ) : (
                  project.reviewLogs.map((log) => (
                    <article key={log.id} className="rounded-md border border-line p-4 text-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-ink">
                            {getPrintFileReviewStatusLabel(log.status)} · {formatDateTime(log.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {getReviewLogActorLabel(log.createdBy)} · {log.file ? `버전 ${log.file.version} ${log.file.originalFilename}` : "프로젝트 전체"}
                          </p>
                        </div>
                      </div>
                      {log.message ? <p className="mt-3 whitespace-pre-wrap leading-6 text-neutral-700">{log.message}</p> : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <AdminUploadReviewPanel
              projectId={project.id}
              initialReviewStatus={panelStatus}
              initialAdminMemo={project.adminMemo ?? ""}
              files={uploadedFiles.map((file) => ({
                id: file.id,
                originalFilename: file.originalFilename,
                version: file.version
              }))}
            />

            <section className="rounded-lg border border-line bg-ivory p-5 text-sm leading-7 text-charcoal">
              <h2 className="text-base font-bold text-ink">운영 메모</h2>
              <p className="mt-3">
                다운로드 링크는 관리자 인증 후 서버에서 짧은 시간 동안 사용할 수 있는 주소를 발급합니다. 고객 화면에는
                관리자 경로나 다운로드 주소가 표시되지 않습니다.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
