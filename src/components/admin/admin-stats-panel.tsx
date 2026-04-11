"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { StatsKpis } from "./stats-kpis";
import { StatsCharts } from "./stats-charts";
import type { DashboardStats } from "@/lib/stats";

const SUCURSALES = ["AVENIDA", "VILLEGAS", "MITRE"] as const;
type Sucursal = (typeof SUCURSALES)[number];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AdminStatsPanel() {
  const defaultTo = useMemo(() => todayIso(), []);
  const defaultFrom = useMemo(() => shiftDays(defaultTo, -30), [defaultTo]);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [sucursal, setSucursal] = useState<Sucursal | "">("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from, to });
      if (sucursal) qs.set("sucursal", sucursal);
      const res = await fetch(`/api/admin/stats?${qs.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          typeof j.error === "string" ? j.error : "Error al cargar stats",
        );
      }
      const data = (await res.json()) as DashboardStats;
      setStats(data);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Error al cargar estadísticas",
      );
    } finally {
      setLoading(false);
    }
  }, [from, to, sucursal]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Estadísticas</h1>
        <p className="mt-1 text-sm text-[#666]">
          Panel operativo del funcionamiento de la clínica.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[#e8e0d8] bg-white p-4 shadow-sm">
        <label className="flex flex-col text-xs font-medium text-[#666]">
          Desde
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-[#e0d8cf] bg-white px-3 py-2 text-sm text-[#1a1a1a]"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-[#666]">
          Hasta
          <input
            type="date"
            value={to}
            min={from}
            max={defaultTo}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-[#e0d8cf] bg-white px-3 py-2 text-sm text-[#1a1a1a]"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-[#666]">
          Sucursal
          <select
            value={sucursal}
            onChange={(e) => setSucursal(e.target.value as Sucursal | "")}
            className="mt-1 rounded-lg border border-[#e0d8cf] bg-white px-3 py-2 text-sm text-[#1a1a1a]"
          >
            <option value="">Todas</option>
            {SUCURSALES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto rounded-full bg-[#5c1838] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#401127] disabled:opacity-50"
        >
          Actualizar
        </button>
      </div>

      {loading && !stats ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#e8e0d8] bg-white p-10"
          role="status"
          aria-label="Cargando estadísticas"
        >
          <LottieSpinner />
          <p className="text-sm text-[#666]">Cargando…</p>
        </div>
      ) : stats ? (
        <>
          <StatsKpis stats={stats} />
          <StatsCharts stats={stats} />
        </>
      ) : null}
    </div>
  );
}
