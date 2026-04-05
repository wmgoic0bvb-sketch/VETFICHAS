"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  "flex items-center justify-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-colors md:justify-start";
const inactiveClass = `${itemClass} text-[#555] hover:bg-[#efe8e0] hover:text-[#5c1838]`;
const activeClass = `${itemClass} bg-[#5c1838]/10 text-[#5c1838]`;

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const internacionesActive = pathname === "/internaciones";
  const pacientesActive =
    pathname === "/" || pathname.startsWith("/patient/");

  return (
    <aside
      className="flex w-[72px] shrink-0 flex-col border-r border-[#e8e0d8] bg-white pt-3 md:w-[200px] md:px-2"
      aria-label="Navegación principal"
    >
      <nav className="flex flex-col gap-1 px-1.5">
        <Link
          href="/internaciones"
          className={internacionesActive ? activeClass : inactiveClass}
          title="Internaciones"
          aria-current={internacionesActive ? "page" : undefined}
        >
          <InternacionesIcon className="h-[22px] w-[22px] shrink-0" />
          <span className="hidden min-w-0 truncate md:inline">Internaciones</span>
        </Link>
        <Link
          href="/"
          className={pacientesActive ? activeClass : inactiveClass}
          title="Pacientes"
          aria-current={pacientesActive ? "page" : undefined}
        >
          <PacientesIcon className="h-[22px] w-[22px] shrink-0" />
          <span className="hidden min-w-0 truncate md:inline">Pacientes</span>
        </Link>
      </nav>
    </aside>
  );
}
