"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-line px-4 py-2 text-sm font-bold text-ink"
    >
      인쇄하기
    </button>
  );
}
