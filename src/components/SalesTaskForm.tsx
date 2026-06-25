"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SALES_TASK_PRIORITIES,
  SALES_TASK_PRIORITY_LABELS,
  SALES_TASK_STATUSES,
  SALES_TASK_STATUS_LABELS,
  SALES_TASK_TYPES,
  SALES_TASK_TYPE_LABELS,
  type SalesTaskFieldErrors,
  type SalesTaskPriority,
  type SalesTaskStatus,
  type SalesTaskType
} from "@/lib/sales-task-schema";

type SalesTaskFormProps = {
  mode: "create" | "edit";
  taskId?: string;
  initialValues?: {
    leadId?: string | null;
    quoteProposalId?: string | null;
    title?: string;
    description?: string | null;
    type?: string;
    priority?: string;
    status?: string;
    dueAt?: string;
    assignedTo?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
  };
};

export function SalesTaskForm({ mode, taskId, initialValues }: SalesTaskFormProps) {
  const router = useRouter();
  const initial = useMemo(() => initialValues ?? {}, [initialValues]);
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [type, setType] = useState<SalesTaskType>((initial.type as SalesTaskType) ?? "GENERAL");
  const [priority, setPriority] = useState<SalesTaskPriority>((initial.priority as SalesTaskPriority) ?? "NORMAL");
  const [status, setStatus] = useState<SalesTaskStatus>((initial.status as SalesTaskStatus) ?? "TODO");
  const [dueAt, setDueAt] = useState(initial.dueAt ?? "");
  const [assignedTo, setAssignedTo] = useState(initial.assignedTo ?? "");
  const [leadId, setLeadId] = useState(initial.leadId ?? "");
  const [quoteProposalId, setQuoteProposalId] = useState(initial.quoteProposalId ?? "");
  const [sourceType] = useState(initial.sourceType ?? "");
  const [sourceId] = useState(initial.sourceId ?? "");
  const [fieldErrors, setFieldErrors] = useState<SalesTaskFieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(nextStatus?: SalesTaskStatus) {
    setIsSaving(true);
    setMessage("");
    setFieldErrors({});

    try {
      const response = await fetch(mode === "edit" ? `/api/admin/tasks/${taskId}` : "/api/admin/tasks", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          status: nextStatus ?? status,
          dueAt,
          assignedTo,
          leadId,
          quoteProposalId,
          sourceType,
          sourceId
        })
      });
      const data = (await response.json()) as { message?: string; fieldErrors?: SalesTaskFieldErrors; task?: { id: string } };

      if (!response.ok) {
        setMessage(data.message ?? "업무 저장에 실패했습니다.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      router.push(mode === "create" ? "/admin/tasks" : `/admin/tasks/${taskId}/edit`);
      router.refresh();
    } catch {
      setMessage("업무 저장 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!taskId || !window.confirm("이 업무를 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?")) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, { method: "DELETE" });
      if (!response.ok) {
        window.alert("업무 삭제에 실패했습니다.");
        return;
      }
      router.push("/admin/tasks");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="rounded-lg border border-line bg-white p-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="label-base">제목</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="input-base mt-2" />
          {fieldErrors.title ? <p className="mt-1 text-xs text-red-700">{fieldErrors.title}</p> : null}
        </label>
        <label className="block">
          <span className="label-base">유형</span>
          <select value={type} onChange={(event) => setType(event.target.value as SalesTaskType)} className="input-base mt-2">
            {SALES_TASK_TYPES.map((option) => (
              <option key={option} value={option}>
                {SALES_TASK_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-base">우선순위</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as SalesTaskPriority)} className="input-base mt-2">
            {SALES_TASK_PRIORITIES.map((option) => (
              <option key={option} value={option}>
                {SALES_TASK_PRIORITY_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-base">상태</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as SalesTaskStatus)} className="input-base mt-2">
            {SALES_TASK_STATUSES.map((option) => (
              <option key={option} value={option}>
                {SALES_TASK_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-base">기한</span>
          <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="input-base mt-2" />
        </label>
        <label className="block">
          <span className="label-base">담당자</span>
          <input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="input-base mt-2" />
        </label>
        <label className="block">
          <span className="label-base">연결 리드 ID</span>
          <input value={leadId} onChange={(event) => setLeadId(event.target.value)} className="input-base mt-2" />
        </label>
        <label className="block">
          <span className="label-base">연결 견적안 ID</span>
          <input value={quoteProposalId} onChange={(event) => setQuoteProposalId(event.target.value)} className="input-base mt-2" />
        </label>
        <label className="block md:col-span-2">
          <span className="label-base">설명</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="input-base mt-2" />
        </label>
      </div>

      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving} className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isSaving ? "저장 중..." : "저장"}
        </button>
        {mode === "edit" ? (
          <>
            <button type="button" disabled={isSaving} onClick={() => void submit("DONE")} className="focus-ring rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              완료 처리
            </button>
            <button type="button" disabled={isSaving} onClick={() => void submit("CANCELLED")} className="focus-ring rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700">
              취소 처리
            </button>
            <button type="button" disabled={isSaving} onClick={handleDelete} className="focus-ring rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700">
              삭제
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}
