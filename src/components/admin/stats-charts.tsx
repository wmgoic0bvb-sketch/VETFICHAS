"use client";

import type { DashboardStats } from "@/lib/stats";

type BarRow = { label: string; count: number };

function BarList({ rows, empty }: { rows: BarRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-[#999]">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const pct = Math.round((r.count / max) * 100);
        return (
          <li key={r.label}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="truncate pr-2 text-[#444]">{r.label}</span>
              <span className="shrink-0 font-semibold text-[#1a1a1a]">
                {r.count}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f0ebe4]">
              <div
                className="h-full rounded-full bg-[#5c1838]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e8e0d8] bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-[#888]">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function WeekdayBars({
  rows,
}: {
  rows: Array<{ dow: number; label: string; count: number }>;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {rows.map((r) => {
        const h = Math.round((r.count / max) * 100);
        return (
          <div
            key={r.dow}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-[11px] font-semibold text-[#1a1a1a]">
              {r.count}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-[#5c1838]"
                style={{ height: `${Math.max(h, 2)}%` }}
              />
            </div>
            <span className="text-[11px] text-[#666]">{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyLine({ rows }: { rows: Array<{ ym: string; count: number }> }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-[#999]">Sin datos</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="flex h-32 items-end gap-1">
      {rows.map((r) => {
        const h = Math.round((r.count / max) * 100);
        return (
          <div key={r.ym} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-[#8a3a5e]"
                title={`${r.ym}: ${r.count}`}
                style={{ height: `${Math.max(h, 2)}%` }}
              />
            </div>
            <span className="text-[9px] text-[#888]">{r.ym.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StatsCharts({ stats }: { stats: DashboardStats }) {
  const { consultas, internacion, demografia, estudios } = stats;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Consultas por día de semana" subtitle="Según fecha de consulta">
        <WeekdayBars rows={consultas.porDiaSemana} />
      </Card>

      <Card title="Consultas por mes" subtitle="Últimos 12 meses">
        <MonthlyLine rows={consultas.porMes} />
      </Card>

      <Card title="Consultas por sucursal">
        <BarList
          rows={consultas.porSucursal.map((r) => ({
            label: r.sucursal,
            count: r.count,
          }))}
          empty="Sin consultas en el rango"
        />
      </Card>

      <Card title="Consultas por veterinario" subtitle="Top 10">
        <BarList
          rows={consultas.porVeterinario.map((r) => ({
            label: r.veterinario,
            count: r.count,
          }))}
          empty="Sin datos"
        />
      </Card>

      <Card title="Top motivos de consulta" subtitle="Top 10 (texto libre)">
        <BarList
          rows={consultas.topMotivos.map((r) => ({
            label: r.motivo,
            count: r.count,
          }))}
          empty="Sin motivos registrados"
        />
      </Card>

      <Card title="Top diagnósticos — internación" subtitle="Histórico">
        <BarList
          rows={internacion.topDiagnosticos.map((r) => ({
            label: r.diagnostico,
            count: r.count,
          }))}
          empty="Sin internaciones históricas"
        />
      </Card>

      <Card
        title="Top medicamentos — internación"
        subtitle="Órdenes históricas (ambulatorio pendiente)"
      >
        <BarList
          rows={internacion.topMedsInternacion.map((r) => ({
            label: r.medicamento,
            count: r.count,
          }))}
          empty="Sin órdenes registradas"
        />
      </Card>

      <Card
        title="Ingresos a internación por mes"
        subtitle={`Últimos 12 meses · mortalidad ${
          internacion.mortalidadPct == null
            ? "—"
            : `${internacion.mortalidadPct}%`
        }`}
      >
        <MonthlyLine rows={internacion.ingresosPorMes} />
      </Card>

      <Card title="Demografía — especie">
        <BarList
          rows={demografia.porEspecie.map((r) => ({
            label: r.especie,
            count: r.count,
          }))}
          empty="Sin pacientes"
        />
      </Card>

      <Card title="Demografía — rango etario">
        <BarList
          rows={demografia.porRangoEdad.map((r) => ({
            label: r.rango,
            count: r.count,
          }))}
          empty="Sin datos"
        />
      </Card>

      <Card title="Demografía — sexo">
        <BarList
          rows={demografia.porSexo.map((r) => ({
            label: r.sexo,
            count: r.count,
          }))}
          empty="Sin datos"
        />
      </Card>

      <Card title="Altas de pacientes por mes" subtitle="Últimos 12 meses">
        <MonthlyLine rows={demografia.altasPorMes} />
      </Card>

      <Card title="Estudios por categoría" subtitle="En el rango seleccionado">
        <BarList
          rows={estudios.porCategoria.map((r) => ({
            label: r.categoria,
            count: r.count,
          }))}
          empty="Sin estudios en el rango"
        />
      </Card>
    </div>
  );
}
