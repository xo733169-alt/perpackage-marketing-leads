import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";

export default function AdminLoginPage() {
  if (isAdminAuthenticated()) {
    redirect("/admin/leads");
  }

  const configured = isAdminPasswordConfigured();

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-bold text-brass">페르패키지 관리자</p>
          <h1 className="mt-3 text-2xl font-black text-ink">관리자 로그인</h1>
          {!configured ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
              개발 환경에서 `ADMIN_PASSWORD`가 설정되어 있지 않습니다. `.env` 또는 실행 환경 변수에 관리자
              비밀번호를 설정해주세요.
            </div>
          ) : null}
          <div className="mt-6">
            <AdminLoginForm disabled={!configured} />
          </div>
        </div>
      </section>
    </main>
  );
}
