import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { CompleteTaskButton } from "@/components/TaskQuickActions";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatTaskDueLabel,
  getTaskPriorityLabel,
  getTaskStatusLabel,
  getTaskTypeLabel,
  isTaskOverdue
} from "@/lib/sales-task";
import { SALES_TASK_PRIORITIES, SALES_TASK_STATUSES, SALES_TASK_TYPES } from "@/lib/sales-task-schema";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(value);
}

function buildTaskQuery(searchParams: URLSearchParams) {
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const type = searchParams.get("type")?.trim();
  const priority = searchParams.get("priority")?.trim();
  const dueState = searchParams.get("dueState")?.trim();
  const sort = searchParams.get("sort")?.trim();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const where: Prisma.SalesTaskWhereInput = {};

  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }, { assignedTo: { contains: q } }];
  }
  if (status) where.status = status;
  if (type) where.type = type;
  if (priority) where.priority = priority;

  if (dueState === "today") {
    where.status = { in: ["TODO", "IN_PROGRESS"] };
    where.dueAt = { lte: todayEnd };
  } else if (dueState === "overdue") {
    where.status = { in: ["TODO", "IN_PROGRESS"] };
    where.dueAt = { lt: todayStart };
  } else if (dueState === "upcoming") {
    where.status = { in: ["TODO", "IN_PROGRESS"] };
    where.dueAt = { gt: todayEnd };
  } else if (dueState === "done") {
    where.status = "DONE";
  }

  const orderBy =
    sort === "priority"
      ? [{ priority: "desc" as const }, { dueAt: "asc" as const }]
      : sort === "newest"
        ? [{ createdAt: "desc" as const }]
        : [{ dueAt: "asc" as const }, { createdAt: "desc" as const }];

  return { where, orderBy, q, status, type, priority, dueState, sort };
}

export default async function AdminTasksPage({
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

  const { where, orderBy, q, status, type, priority, dueState, sort } = buildTaskQuery(urlSearchParams);
  const tasks = await prisma.salesTask.findMany({
    where,
    orderBy,
    include: {
      lead: { select: { id: true, customerName: true, companyName: true } },
      quoteProposal: { select: { id: true, proposalNumber: true } }
    },
    take: 200
  });
  const now = new Date();

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/tasks" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-brass">관리자</p>
              <h1 className="mt-2 text-3xl font-black text-ink">업무 관리</h1>
            </div>
            <Link href="/admin/tasks/new" className="focus-ring w-fit rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
              업무 추가
            </Link>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-[1fr_150px_160px_140px_140px_150px_auto]">
          <label className="block">
            <span className="label-base">검색</span>
            <input name="q" defaultValue={q} placeholder="제목, 설명, 담당자" className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">상태</span>
            <select name="status" defaultValue={status} className="input-base mt-2">
              <option value="">전체</option>
              {SALES_TASK_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {getTaskStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">유형</span>
            <select name="type" defaultValue={type} className="input-base mt-2">
              <option value="">전체</option>
              {SALES_TASK_TYPES.map((option) => (
                <option key={option} value={option}>
                  {getTaskTypeLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">우선순위</span>
            <select name="priority" defaultValue={priority} className="input-base mt-2">
              <option value="">전체</option>
              {SALES_TASK_PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {getTaskPriorityLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">기한</span>
            <select name="dueState" defaultValue={dueState} className="input-base mt-2">
              <option value="">전체</option>
              <option value="today">오늘</option>
              <option value="overdue">기한 지남</option>
              <option value="upcoming">예정</option>
              <option value="done">완료</option>
            </select>
          </label>
          <label className="block">
            <span className="label-base">정렬</span>
            <select name="sort" defaultValue={sort} className="input-base mt-2">
              <option value="">기한 빠른순</option>
              <option value="priority">우선순위순</option>
              <option value="newest">최신순</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="focus-ring min-h-11 w-full rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
              적용
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold text-charcoal">
                <tr>
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3">유형</th>
                  <th className="px-4 py-3">우선순위</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">기한</th>
                  <th className="px-4 py-3">연결 리드</th>
                  <th className="px-4 py-3">연결 견적안</th>
                  <th className="px-4 py-3">작성일</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-neutral-500">
                      조건에 맞는 업무가 없습니다.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className={isTaskOverdue(task, now) ? "align-top bg-red-50/40" : "align-top"}>
                      <td className="px-4 py-3 font-bold text-ink">{task.title}</td>
                      <td className="px-4 py-3">{getTaskTypeLabel(task.type)}</td>
                      <td className="px-4 py-3">{getTaskPriorityLabel(task.priority)}</td>
                      <td className="px-4 py-3">{getTaskStatusLabel(task.status)}</td>
                      <td className="px-4 py-3">
                        <span className="block font-semibold">{formatTaskDueLabel(task.dueAt, now)}</span>
                        <span className="text-xs text-neutral-500">{formatDateTime(task.dueAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {task.lead ? (
                          <Link href={`/admin/leads/${task.lead.id}`} className="font-semibold underline underline-offset-4">
                            {task.lead.customerName}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {task.quoteProposal ? (
                          <Link href={`/admin/quote-proposals/${task.quoteProposal.id}`} className="font-semibold underline underline-offset-4">
                            {task.quoteProposal.proposalNumber}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{formatDateTime(task.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {task.status !== "DONE" && task.status !== "CANCELLED" ? <CompleteTaskButton taskId={task.id} /> : null}
                          <Link href={`/admin/tasks/${task.id}/edit`} className="focus-ring rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink">
                            수정
                          </Link>
                        </div>
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
