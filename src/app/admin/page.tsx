import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
      <DashboardNav />
      <main className="flex-1">
        <AdminUsersPanel />
      </main>
    </div>
  );
}
