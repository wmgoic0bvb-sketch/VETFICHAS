import { AdminStatsPanel } from "@/components/admin/admin-stats-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminStatsPage() {
  return (
    <AppShell>
      <main className="flex-1">
        <AdminStatsPanel />
      </main>
    </AppShell>
  );
}
