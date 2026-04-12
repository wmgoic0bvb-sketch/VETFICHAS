import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { AdminVacunasPanel } from "@/components/admin/admin-vacunas-panel";
import { AdminVeterinariosPanel } from "@/components/admin/admin-veterinarios-panel";
import { AdminStoragePanel } from "@/components/admin/admin-storage-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminPage() {
  return (
    <AppShell>
      <main className="flex-1">
        <AdminUsersPanel />
        <div className="border-t border-[#e8e0d8] bg-[#faf8f5]">
          <AdminVacunasPanel />
        </div>
        <div className="border-t border-[#e8e0d8] bg-[#faf8f5]">
          <AdminVeterinariosPanel />
        </div>
        <div className="border-t border-[#e8e0d8] bg-[#faf8f5]">
          <AdminStoragePanel />
        </div>
      </main>
    </AppShell>
  );
}
