import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteAccessLoginForm } from "@/components/SiteAccessLoginForm";
import {
  getSiteAccessCookieName,
  isSiteAccessEnabled,
  sanitizeSiteAccessNextPath,
  verifySiteAccessCookieValue
} from "@/lib/site-access";

export const dynamic = "force-dynamic";

export default async function SiteAccessPage({
  searchParams
}: {
  searchParams?: { next?: string };
}) {
  const nextPath = sanitizeSiteAccessNextPath(searchParams?.next);

  if (!isSiteAccessEnabled()) {
    redirect("/");
  }

  const cookieValue = cookies().get(getSiteAccessCookieName())?.value;
  const hasValidAccess = await verifySiteAccessCookieValue(cookieValue);

  if (hasValidAccess) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-bold tracking-[0.18em] text-brass">PERPACKAGE</p>
          <h1 className="mt-3 text-2xl font-black text-ink">비공개 테스트 페이지입니다.</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            현재 페르패키지 마케팅 관리 시스템은 테스트 중입니다. 접근 비밀번호를 입력해 주세요.
          </p>
          <div className="mt-6">
            <SiteAccessLoginForm nextPath={nextPath} />
          </div>
        </div>
      </section>
    </main>
  );
}
