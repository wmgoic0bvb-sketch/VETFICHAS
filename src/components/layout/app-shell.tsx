"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  children,
  onNewPatient,
}: {
  children: ReactNode;
  onNewPatient?: () => void;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(() => setMobileNavOpen((o) => !o), []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
      <DashboardNav
        onNewPatient={onNewPatient}
        mobileNavOpen={mobileNavOpen}
        onMobileNavToggle={toggleMobileNav}
      />
      <div className="flex min-h-0 flex-1">
        <AppSidebar mobileOpen={mobileNavOpen} onClose={closeMobileNav} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
