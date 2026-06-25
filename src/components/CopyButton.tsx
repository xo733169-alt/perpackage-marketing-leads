"use client";

import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="focus-ring inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
    >
      {copied ? "복사됨" : label}
    </button>
  );
}
