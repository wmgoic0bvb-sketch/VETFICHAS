"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function InternacionesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
      <path d="M4 10h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" />
      <path d="M10 14h4" />
    </svg>
  );
}

function PacientesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const itemClass =
  "flex items-center justify-start gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-colors";
const inactiveClass = `${itemClass} text-[#555] hover:bg-[#efe8e0] hover:text-[#5c1838]`;
const activeClass = `${itemClass} bg-[#5c1838]/10 text-[#5c1838]`;

export function AppSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() ?? "";
  const internacionesActive =
    pathname === "/internaciones" || pathname.startsWith("/internaciones/");
  const pacientesActive =
    pathname === "/" || pathname.startsWith("/patient/");

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[80] bg-black/35 md:hidden"
          aria-label="Cerrar menú"
          onClick={onClose}
        />
      ) : null}
      <aside
        id="app-sidebar"
        className={[
          "flex w-[200px] shrink-0 flex-col border-r border-[#e8e0d8] bg-white px-2 pt-3",
          "fixed left-0 top-14 z-[90] h-[calc(100dvh-3.5rem)] transition-transform duration-200 ease-out",
          "md:relative md:top-0 md:z-auto md:h-auto md:min-h-0 md:w-[200px] md:translate-x-0 md:transition-none",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none md:pointer-events-auto md:translate-x-0",
        ].join(" ")}
        aria-label="Navegación principal"
      >
        <nav
          id="app-sidebar-nav"
          className="flex flex-col gap-1 px-0.5"
          aria-label="Secciones"
        >
          <Link
            href="/"
            className={pacientesActive ? activeClass : inactiveClass}
            title="Pacientes"
            aria-current={pacientesActive ? "page" : undefined}
            onClick={() => onClose()}
          >
            <PacientesIcon className="h-[22px] w-[22px] shrink-0" />
            <span className="min-w-0 truncate">Pacientes</span>
          </Link>
          <Link
            href="/internaciones"
            className={internacionesActive ? activeClass : inactiveClass}
            title="Internaciones"
            aria-current={internacionesActive ? "page" : undefined}
            onClick={() => onClose()}
          >
            <InternacionesIcon className="h-[22px] w-[22px] shrink-0" />
            <span className="min-w-0 truncate">Internaciones</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
