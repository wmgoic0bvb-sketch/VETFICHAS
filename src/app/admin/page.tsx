import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { AdminVeterinariosPanel } from "@/components/admin/admin-veterinarios-panel";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
      <DashboardNav />
      <main className="flex-1">
        <AdminUsersPanel />
        <div className="border-t border-[#e8e0d8] bg-[#faf8f5]">
          <AdminVeterinariosPanel />
        </div>
      </main>
    </div>
  );
}
