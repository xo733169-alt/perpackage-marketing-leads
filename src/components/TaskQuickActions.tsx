"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SalesTaskCandidate } from "@/lib/sales-task";

type ClientSalesTaskCandidate = Omit<SalesTaskCandidate, "dueAt"> & {
  dueAt?: string | null;
};

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleClick() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" })
      });
      if (!response.ok) window.alert("업무 완료 처리에 실패했습니다.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isSaving}
      onClick={handleClick}
      className="focus-ring rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 disabled:opacity-60"
    >
      완료
    </button>
  );
}

export function CreateTaskFromCandidateButton({
  candidate,
  label = "업무 만들기"
}: {
  candidate: ClientSalesTaskCandidate;
  label?: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleClick() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "TODO", ...candidate })
      });
      if (!response.ok) window.alert("업무 생성에 실패했습니다.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isSaving}
      onClick={handleClick}
      className="focus-ring rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink hover:border-ink disabled:opacity-60"
    >
      {isSaving ? "생성 중..." : label}
    </button>
  );
}
