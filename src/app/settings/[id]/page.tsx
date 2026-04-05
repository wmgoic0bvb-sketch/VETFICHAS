import { AppShell } from "@/components/layout/app-shell";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default function SettingsPage() {
  return (
    <AppShell>
      <main className="flex-1">
        <SettingsPanel />
      </main>
    </AppShell>
  );
}
