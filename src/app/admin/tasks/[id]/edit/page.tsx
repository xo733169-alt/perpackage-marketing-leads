import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { SalesTaskForm } from "@/components/SalesTaskForm";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateTimeInput(value: Date | null) {
  if (!value) return "";
  const timezoneOffsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

export default async function EditSalesTaskPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const task = await prisma.salesTask.findUnique({ where: { id: params.id } });

  if (!task) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/tasks" />
          <div>
            <Link href="/admin/tasks" className="text-sm font-semibold text-neutral-600 hover:text-ink">
              업무 목록으로 돌아가기
            </Link>
            <h1 className="mt-3 text-3xl font-black text-ink">업무 수정</h1>
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          <SalesTaskForm
            mode="edit"
            taskId={task.id}
            initialValues={{
              leadId: task.leadId,
              quoteProposalId: task.quoteProposalId,
              title: task.title,
              description: task.description,
              type: task.type,
              priority: task.priority,
              status: task.status,
              dueAt: formatDateTimeInput(task.dueAt),
              assignedTo: task.assignedTo,
              sourceType: task.sourceType,
              sourceId: task.sourceId
            }}
          />
        </div>
      </section>
    </main>
  );
}
