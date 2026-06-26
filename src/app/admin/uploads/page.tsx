import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import {
  buildUploadProjectListQuery,
  formatDateTime,
  formatOptionalText,
  getPrintFileReviewStatusLabel,
  getUploadStatusBadgeClass
} from "@/lib/admin-uploads";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PRINT_FILE_REVIEW_STATUSES,
  PRINT_FILE_REVIEW_STATUS_LABELS,
  UPLOADED_FILE_STATUS_UPLOADED
} from "@/lib/print-file-upload-schema";

export const dynamic = "force-dynamic";

function getLatestUploadedAt(files: { uploadedAt: Date | null }[]) {
  return files.reduce<Date | null>((latest, file) => {
    if (!file.uploadedAt) return latest;
    if (!latest || file.uploadedAt > latest) return file.uploadedAt;
    return latest;
  }, null);
}

export default async function AdminUploadsPage({
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
  const { where, orderBy, q, status } = buildUploadProjectListQuery(urlSearchParams);
  const projects = await prisma.uploadProject.findMany({
    where,
    orderBy,
    include: {
      files: {
        where: { uploadStatus: UPLOADED_FILE_STATUS_UPLOADED },
        select: {
          id: true,
          uploadedAt: true
        }
      }
    },
    take: 100
  });

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/uploads" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">인쇄파일 업로드 관리</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              고객 정보와 주문번호를 기준으로 접수된 인쇄파일과 검수 상태를 확인합니다.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-[1fr_220px_auto]">
          <label className="block">
            <span className="label-base">검색</span>
            <input name="q" defaultValue={q} className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">상태</span>
            <select name="status" defaultValue={status} className="input-base mt-2">
              <option value="">전체</option>
              {PRINT_FILE_REVIEW_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {PRINT_FILE_REVIEW_STATUS_LABELS[option]}
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
            <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase text-charcoal">
                <tr>
                  <th className="px-4 py-3 [white-space:nowrap]">접수번호</th>
                  <th className="px-4 py-3 [white-space:nowrap]">Cafe24 주문</th>
                  <th className="px-4 py-3 [white-space:nowrap]">주문번호</th>
                  <th className="px-4 py-3 [white-space:nowrap]">고객명</th>
                  <th className="px-4 py-3 [white-space:nowrap]">상품명</th>
                  <th className="px-4 py-3 [white-space:nowrap]">업로드 파일 수</th>
                  <th className="px-4 py-3 [white-space:nowrap]">업로드 상태</th>
                  <th className="px-4 py-3 [white-space:nowrap]">검수 상태</th>
                  <th className="px-4 py-3 [white-space:nowrap]">최근 업로드</th>
                  <th className="px-4 py-3 [white-space:nowrap]">상세 보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-neutral-500">
                      조건에 맞는 업로드 프로젝트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => {
                    const latestUploadedAt = getLatestUploadedAt(project.files);

                    return (
                      <tr key={project.id} className="align-top">
                        <td className="px-4 py-3 font-semibold text-ink [white-space:nowrap]">{formatOptionalText(project.uploadCode)}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">
                          {formatOptionalText(project.cafe24OrderNo)}
                          {project.linkSource ? <span className="mt-1 block text-xs text-neutral-500">{project.linkSource}</span> : null}
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink [white-space:nowrap]">{formatOptionalText(project.cafe24OrderNumber)}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">
                          {project.companyName ?? project.customerName}
                          {project.contactName ? <span className="mt-1 block text-xs text-neutral-500">담당자 {project.contactName}</span> : null}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{formatOptionalText(project.productName)}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{project.files.length}</td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getUploadStatusBadgeClass(project.status)}`}>
                            {getPrintFileReviewStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getUploadStatusBadgeClass(project.reviewStatus)}`}>
                            {getPrintFileReviewStatusLabel(project.reviewStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{formatDateTime(latestUploadedAt)}</td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <Link
                            href={`/admin/uploads/${project.id}`}
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
