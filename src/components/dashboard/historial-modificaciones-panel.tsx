"use client";

import { useSession } from "next-auth/react";
import { formatFechaHoraDisplay } from "@/lib/internacion-utils";
import type { ModificacionPaciente } from "@/types/patient";

export function HistorialModificacionesPanel({
  items,
  className = "",
}: {
  items: ModificacionPaciente[] | undefined;
  className?: string;
}) {
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  if (session?.user?.role !== "admin") return null;

  const list = items ?? [];
  if (list.length === 0) {
    return (
      <div
        className={`rounded-xl border border-[#e8e0d8] bg-[#faf9f7] p-4 ${className}`}
      >
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5c1838]">
          Historial de modificaciones
        </h4>
        <p className="mt-2 text-[13px] text-[#888]">
          Aún no hay registro de cambios guardados en la ficha.
        </p>
      </div>
    );
  }
  const sorted = [...list].sort((a, b) =>
    b.fechaHora.localeCompare(a.fechaHora),
  );
  return (
    <div
      className={`rounded-xl border border-[#e8e0d8] bg-[#faf9f7] p-4 ${className}`}
    >
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5c1838]">
        Historial de modificaciones
      </h4>
      <ul className="mt-3 max-h-[min(24rem,70vh)] space-y-3 overflow-y-auto pr-1">
        {sorted.map((m) => (
          <li
            key={m.id}
            className="rounded-lg border border-[#ebe6df] bg-white px-3 py-2 text-[13px] text-[#333]"
          >
            <div className="font-medium text-[#1a1a1a]">
              {formatFechaHoraDisplay(m.fechaHora)}
            </div>
            <div className="mt-1 text-[12px] text-[#555]">
              {m.usuarioNombre
                ? `${m.usuarioNombre} (DNI ${m.usuarioDni ?? "—"})`
                : m.usuarioDni
                  ? `DNI ${m.usuarioDni}`
                  : `Usuario ${m.usuarioId}`}
            </div>
            <p className="mt-1.5 break-words text-[12px] leading-snug text-[#666]">
              {m.resumen}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
