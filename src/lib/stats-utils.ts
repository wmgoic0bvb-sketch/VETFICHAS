import { todayISODate } from "./date-utils";

export type Sucursal = "AVENIDA" | "VILLEGAS" | "MITRE";
export const SUCURSALES: Sucursal[] = ["AVENIDA", "VILLEGAS", "MITRE"];

export type StatsFilters = {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
  sucursal: Sucursal | null;
};

export const DOW_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MES_RANGE = 12;

function isValidIso(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function normalizeFilters(input: Partial<StatsFilters>): StatsFilters {
  const today = todayISODate();
  const defaultFrom = shiftIsoDate(today, -30);
  const from = isValidIso(input.from) ? input.from! : defaultFrom;
  const to = isValidIso(input.to) ? input.to! : today;
  const sucursal = SUCURSALES.includes(input.sucursal as Sucursal)
    ? (input.sucursal as Sucursal)
    : null;
  return { from, to, sucursal };
}

export function monthsBack(n: number): string {
  const now = new Date();
  const dt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n + 1, 1),
  );
  return dt.toISOString().slice(0, 7);
}

export function computeEdadRango(fnac: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fnac)) return "Sin dato";
  const nac = new Date(fnac);
  if (Number.isNaN(nac.getTime())) return "Sin dato";
  const hoy = new Date();
  const años =
    hoy.getFullYear() -
    nac.getFullYear() -
    (hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
      ? 1
      : 0);
  if (años < 1) return "< 1 año";
  if (años <= 2) return "1-2 años";
  if (años <= 6) return "3-6 años";
  if (años <= 10) return "7-10 años";
  return "> 10 años";
}
