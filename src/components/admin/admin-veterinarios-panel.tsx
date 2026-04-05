"use client";

import { useCallback, useEffect, useState } from "react";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { toast } from "sonner";
import type { AdminUserRow } from "@/components/admin/admin-users-panel";

export function AdminVeterinariosPanel() {
  const [vets, setVets] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users?role=vet");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Error al cargar");
      }
      const data = (await res.json()) as { users: AdminUserRow[] };
      setVets(data.users);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar veterinarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            Médicos veterinarios
          </h2>
          <p className="mt-1 text-sm text-[#666]">
            Son usuarios con rol Veterinario: aparecen en el desplegable al cargar
            una nueva consulta. Los mismos permisos que un usuario normal. Para
            agregar o quitar veterinarios, editá el rol en la tabla de usuarios de
            arriba.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="shrink-0 rounded-full border border-[#e8e0d8] bg-white px-4 py-2 text-sm font-medium text-[#555] hover:bg-[#f5f0eb]"
        >
          Actualizar lista
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
        {loading ? (
          <div
            className="flex flex-col items-center justify-center gap-3 p-10"
            role="status"
            aria-label="Cargando veterinarios"
          >
            <LottieSpinner size={120} />
            <span className="text-sm text-[#888]">Cargando…</span>
          </div>
        ) : vets.length === 0 ? (
          <p className="p-8 text-center text-[#888]">
            No hay usuarios con rol Veterinario. Asigná ese rol en &quot;Administración
            de usuarios&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-[#e8e0d8] bg-[#f5f0eb]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#333]">DNI</th>
                  <th className="px-4 py-3 font-semibold text-[#333]">Nombre</th>
                </tr>
              </thead>
              <tbody>
                {vets.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[#f0ebe4] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-[#333]">{v.dni}</td>
                    <td className="px-4 py-3 text-[#555]">{v.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
