"use client";

import Link from "next/link";

export function DashboardNav({ onNewPatient }: { onNewPatient?: () => void }) {
  return (
    <header className="sticky top-0 z-[100] flex h-14 shrink-0 items-center justify-between border-b border-[#e8e0d8] bg-white px-5">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9ece2] text-[#2d6a4f] hover:bg-[#f0faf5]"
          title="Ir al inicio"
          aria-label="Ir al inicio"
        >
          🏠
        </Link>
        <div className="flex items-center gap-2 text-xl font-bold text-[#2d6a4f]">
          <span className="text-[22px]" aria-hidden>
            🐾
          </span>
          VetFichas
        </div>
      </div>
      {onNewPatient ? (
        <button
          type="button"
          onClick={onNewPatient}
          className="rounded-full bg-[#2d6a4f] px-[18px] py-2 text-sm font-medium text-white hover:bg-[#1b4332]"
        >
          + Nuevo paciente
        </button>
      ) : (
        <div />
      )}
    </header>
  );
}
