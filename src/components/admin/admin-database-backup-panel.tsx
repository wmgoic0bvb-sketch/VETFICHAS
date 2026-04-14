"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LottieSpinner } from "@/components/ui/lottie-loading";

function parseFilenameFromDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;\s]+)/i.exec(
    cd,
  );
  if (m?.[1]) return decodeURIComponent(m[1].trim());
  if (m?.[2]) return m[2].trim();
  if (m?.[3]) return m[3].trim();
  return null;
}

export function AdminDatabaseBackupPanel() {
  const [loading, setLoading] = useState(false);

  async function downloadBackup() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          typeof j.error === "string" ? j.error : "No se pudo generar el respaldo",
        );
      }
      const blob = await res.blob();
      const name =
        parseFilenameFromDisposition(res.headers.get("Content-Disposition")) ??
        `vetfichas-backup-${Date.now()}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Respaldo descargado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al respaldar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 border-t border-[#e8e0d8] bg-[#faf8f5]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Respaldo de base de datos</h2>
        <p className="mt-1 text-sm text-[#666]">
          Genera un ZIP con los mismos JSON que el comando{" "}
          <code className="text-xs bg-[#eee8e0] px-1.5 py-0.5 rounded">npm run backup-db</code>
          : un archivo por colección (EJSON) y <code className="text-xs bg-[#eee8e0] px-1.5 py-0.5 rounded">_manifest.json</code>.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void downloadBackup()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b4332] disabled:opacity-60 disabled:pointer-events-none"
      >
        {loading ? (
          <>
            <LottieSpinner size={28} />
            Generando respaldo…
          </>
        ) : (
          <>Descargar respaldo (ZIP)</>
        )}
      </button>
      <p className="mt-3 text-xs text-[#888]">
        En bases muy grandes el proceso puede tardar; no cierres la pestaña hasta que termine la descarga.
      </p>
    </div>
  );
}
