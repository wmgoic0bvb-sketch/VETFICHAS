"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] text-[#2d6a4f]"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserAvatarButton({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={36}
        height={36}
        className="h-full w-full object-cover"
      />
    );
  }
  return <UserIcon />;
}

export function DashboardNav({ onNewPatient }: { onNewPatient?: () => void }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const imageUrl = session?.user?.image;
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="sticky top-0 z-[100] flex h-14 shrink-0 items-center justify-between border-b border-[#e8e0d8] bg-white px-5">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-[#2d6a4f] hover:opacity-80"
          title="Ir al inicio"
          aria-label="Ir al inicio"
        >
          <Image
            src="/only_logo_png.png"
            alt=""
            width={38}
            height={38}
            className="object-contain"
            priority
          />
          VetFichas
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className="hidden text-sm font-medium text-[#555] hover:text-[#2d6a4f] sm:inline"
          >
            Administración
          </Link>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {onNewPatient ? (
          <button
            type="button"
            onClick={onNewPatient}
            className="rounded-full bg-[#2d6a4f] px-[18px] py-2 text-sm font-medium text-white hover:bg-[#1b4332]"
          >
            + Nuevo paciente
          </button>
        ) : null}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Menú de cuenta"
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e8e0d8] bg-[#f5f0eb] ring-offset-2 transition hover:border-[#ccc] hover:bg-[#efe8e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f]/40"
          >
            <UserAvatarButton imageUrl={imageUrl} />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-[110] mt-1 min-w-[180px] rounded-lg border border-[#e8e0d8] bg-white py-1 shadow-md"
            >
              {isAdmin ? (
                <Link
                  href="/admin"
                  role="menuitem"
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-[#333] hover:bg-[#f5f0eb] sm:hidden"
                  onClick={() => setMenuOpen(false)}
                >
                  Administración
                </Link>
              ) : null}
              {userId ? (
                <Link
                  href={`/settings/${userId}`}
                  role="menuitem"
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-[#333] hover:bg-[#f5f0eb]"
                  onClick={() => setMenuOpen(false)}
                >
                  Configuración
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-[#333] hover:bg-[#f5f0eb]"
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
