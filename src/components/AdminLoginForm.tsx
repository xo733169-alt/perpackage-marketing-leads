"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "로그인에 실패했습니다.");
        return;
      }

      router.push("/admin/leads");
      router.refresh();
    } catch {
      setMessage("로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="label-base">관리자 비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled || isSubmitting}
          className="input-base mt-2"
          autoComplete="current-password"
        />
      </label>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className="focus-ring inline-flex w-full items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "로그인 중..." : "관리자 로그인"}
      </button>
    </form>
  );
}
