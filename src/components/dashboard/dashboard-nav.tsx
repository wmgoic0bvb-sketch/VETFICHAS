"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function DashboardNav({ onNewPatient }: { onNewPatient?: () => void }) {
  const { data: session } = useSession();

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
      <div className="flex items-center gap-2">
        {session?.user?.dni ? (
          <span className="hidden text-sm text-[#666] sm:inline">
            DNI {session.user.dni}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-full border border-[#ccc] px-3 py-1.5 text-sm text-[#444] hover:bg-[#f5f5f5]"
        >
          Salir
        </button>
        {onNewPatient ? (
          <button
            type="button"
            onClick={onNewPatient}
            className="rounded-full bg-[#2d6a4f] px-[18px] py-2 text-sm font-medium text-white hover:bg-[#1b4332]"
          >
            + Nuevo paciente
          </button>
        ) : null}
      </div>
    </header>
  );
}
