"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteAccessFieldErrors } from "@/lib/site-access-schema";

export function SiteAccessLoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SiteAccessFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/site-access/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next: nextPath })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        next?: string;
        fieldErrors?: SiteAccessFieldErrors;
      };

      if (!response.ok || !data.ok) {
        setMessage(data.message ?? "비밀번호가 올바르지 않습니다.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      router.push(data.next ?? "/");
      router.refresh();
    } catch {
      setMessage("접속 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="label-base">접근 비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input-base mt-2"
          autoComplete="current-password"
        />
        {fieldErrors.password ? <p className="mt-1.5 text-sm text-red-700">{fieldErrors.password}</p> : null}
      </label>

      {message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring inline-flex w-full justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "접속 확인 중..." : "접속하기"}
      </button>
    </form>
  );
}
