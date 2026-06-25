"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteLeadCommunicationButton({ communicationId }: { communicationId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("이 상담 이력을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/lead-communications/${communicationId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        window.alert("상담 이력 삭제에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("상담 이력 삭제 중 문제가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
      className="focus-ring rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      삭제
    </button>
  );
}
