"use client";

import Image from "next/image";
import Link from "next/link";

export function DashboardNav({ onNewPatient }: { onNewPatient?: () => void }) {
  return (
    <header className="sticky top-0 z-[100] flex h-14 shrink-0 items-center justify-between border-b border-[#e8e0d8] bg-white px-5">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-[#2d6a4f] hover:opacity-80"
          title="Ir al inicio"
          aria-label="Ir al inicio"
        >
          <Image src="/favicon.png" alt="" width={38} height={38} priority />
          VetFichas
        </Link>
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
