import Link from "next/link";
import { AdminLogoutButton } from "./AdminLogoutButton";

const links = [
  { href: "/admin/today", label: "오늘 할 일" },
  { href: "/admin/tasks", label: "업무 관리" },
  { href: "/admin/leads", label: "리드 관리" },
  { href: "/admin/portfolio", label: "제작 사례" },
  { href: "/admin/analytics", label: "성과 대시보드" },
  { href: "/admin/marketing-costs", label: "마케팅 비용" },
  { href: "/admin/quote-proposals", label: "견적안" },
  { href: "/admin/quote-rules", label: "견적 룰" },
  { href: "/admin/quote-calculator", label: "견적 계산기" },
  { href: "/admin/quote-calibration", label: "견적 보정" },
  { href: "/admin/checklist", label: "운영 체크리스트" }
];

export function AdminNav({ currentPath }: { currentPath?: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="관리자 메뉴">
      {links.map((link) => {
        const isActive = currentPath === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? "focus-ring rounded-md border border-ink bg-ink px-3 py-2 text-xs font-semibold text-white transition"
                : "focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
            }
          >
            {link.label}
          </Link>
        );
      })}
      <AdminLogoutButton />
    </nav>
  );
}
