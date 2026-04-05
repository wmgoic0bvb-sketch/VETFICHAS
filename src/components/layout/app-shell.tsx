"use client";

import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  children,
  onNewPatient,
}: {
  children: ReactNode;
  onNewPatient?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
      <DashboardNav onNewPatient={onNewPatient} />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
