"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("이 문의를 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?");
    if (!confirmed) return;

    setIsDeleting(true);
    const response = await fetch(`/api/admin/leads/${leadId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      router.push("/admin/leads");
      router.refresh();
      return;
    }

    setIsDeleting(false);
    window.alert("삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="focus-ring rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "삭제 중..." : "문의 삭제"}
    </button>
  );
}
