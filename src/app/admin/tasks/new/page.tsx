import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { SalesTaskForm } from "@/components/SalesTaskForm";
import { addDays } from "@/lib/sales-task";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDateTimeInput(value: Date | null) {
  if (!value) return "";
  const timezoneOffsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

export default function NewSalesTaskPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const getParam = (key: string) => {
    const value = searchParams?.[key];
    return typeof value === "string" ? value : "";
  };

  const dueAt = getParam("dueAt") || formatDateTimeInput(addDays(new Date(), 1));

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/tasks" />
          <div>
            <Link href="/admin/tasks" className="text-sm font-semibold text-neutral-600 hover:text-ink">
              업무 목록으로 돌아가기
            </Link>
            <h1 className="mt-3 text-3xl font-black text-ink">업무 추가</h1>
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          <SalesTaskForm
            mode="create"
            initialValues={{
              leadId: getParam("leadId"),
              quoteProposalId: getParam("quoteProposalId"),
              title: getParam("title"),
              type: getParam("type") || "GENERAL",
              priority: getParam("priority") || "NORMAL",
              status: "TODO",
              dueAt,
              sourceType: getParam("sourceType"),
              sourceId: getParam("sourceId")
            }}
          />
        </div>
      </section>
    </main>
  );
}
