"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
    >
      로그아웃
    </button>
  );
}
