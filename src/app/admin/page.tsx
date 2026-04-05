import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { AdminVeterinariosPanel } from "@/components/admin/admin-veterinarios-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminPage() {
  return (
    <AppShell>
      <main className="flex-1">
        <AdminUsersPanel />
        <div className="border-t border-[#e8e0d8] bg-[#faf8f5]">
          <AdminVeterinariosPanel />
        </div>
      </main>
    </AppShell>
  );
}
