export function formatFecha(f: string): string {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

export function calcularEdad(fnac: string): string {
  if (!fnac) return "—";
  const hoy = new Date();
  const nac = new Date(fnac);
  if (Number.isNaN(nac.getTime())) return "—";
  const años = hoy.getFullYear() - nac.getFullYear();
  const meses = hoy.getMonth() - nac.getMonth();
  if (años === 0) return meses <= 0 ? "Menos de 1 mes" : `${meses} mes${meses > 1 ? "es" : ""}`;
  return `${años} año${años > 1 ? "s" : ""}`;
}

export function todayISODate(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

/** true si la fecha ISO (yyyy-mm-dd) es anterior a hoy (calendario local). */
export function isPastIsoDate(iso: string): boolean {
  if (!iso) return false;
  return iso < todayISODate();
}

/** Días hasta la fecha ISO; negativo si ya pasó. null si la fecha no es válida. */
export function diasHastaIso(iso: string): number | null {
  if (!iso) return null;
  const parts = iso.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return null;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
}
