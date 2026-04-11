"use client";

import type { DashboardStats } from "@/lib/stats";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e0d8] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[#888]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-[#1a1a1a]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#888]">{hint}</p> : null}
    </div>
  );
}

export function StatsKpis({ stats }: { stats: DashboardStats }) {
  const { kpis, filters } = stats;
  const rango = `${filters.from} → ${filters.to}`;
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        label="Pacientes activos"
        value={kpis.pacientesActivos.toLocaleString("es-AR")}
        hint={filters.sucursal ?? "Todas las sucursales"}
      />
      <KpiCard
        label="Consultas"
        value={kpis.consultasEnRango.toLocaleString("es-AR")}
        hint={rango}
      />
      <KpiCard
        label="Internados ahora"
        value={kpis.internadosAhora.toLocaleString("es-AR")}
      />
      <KpiCard
        label="Asistencia a controles"
        value={
          kpis.asistenciaPct == null ? "—" : `${kpis.asistenciaPct}%`
        }
        hint={rango}
      />
    </div>
  );
}
