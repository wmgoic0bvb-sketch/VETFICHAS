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
