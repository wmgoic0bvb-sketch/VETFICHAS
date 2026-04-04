import type { ProximoControl } from "@/types/patient";

/** Formato estricto: DD/MM/AAAA HH:MM (24h). */
export const FECHA_HORA_PROXIMO_CONTROL_REGEX =
  /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;

/** Convierte a `Date` en hora local; `null` si el texto no es válido. */
export function parseFechaHoraLocal(s: string): Date | null {
  const t = s.trim();
  const m = FECHA_HORA_PROXIMO_CONTROL_REGEX.exec(t);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const h = Number(m[4]);
  const min = Number(m[5]);
  if (
    !Number.isFinite(d) ||
    !Number.isFinite(mo) ||
    !Number.isFinite(y) ||
    !Number.isFinite(h) ||
    !Number.isFinite(min)
  ) {
    return null;
  }
  if (h > 23 || min > 59) return null;
  const dt = new Date(y, mo - 1, d, h, min, 0, 0);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

export function isFechaHoraProximoControlValida(s: string): boolean {
  return parseFechaHoraLocal(s) !== null;
}

/** Partes editables (solo dígitos en UI; los separadores / y : son fijos). */
export type FechaHoraParts = {
  dia: string;
  mes: string;
  año: string;
  hora: string;
  minuto: string;
};

export function parseFechaHoraToParts(s: string): FechaHoraParts | null {
  const m = FECHA_HORA_PROXIMO_CONTROL_REGEX.exec(s.trim());
  if (!m) return null;
  return {
    dia: m[1],
    mes: m[2],
    año: m[3],
    hora: m[4],
    minuto: m[5],
  };
}

/** Arma el texto persistido `DD/MM/AAAA HH:MM` a partir de partes numéricas. */
export function partesFechaHoraATexto(p: FechaHoraParts): string {
  const d = p.dia.padStart(2, "0");
  const mo = p.mes.padStart(2, "0");
  const y = p.año.padStart(4, "0");
  const h = p.hora.padStart(2, "0");
  const min = p.minuto.padStart(2, "0");
  return `${d}/${mo}/${y} ${h}:${min}`;
}

export function fechaHoraPartesAhora(): FechaHoraParts {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    dia: pad(d.getDate()),
    mes: pad(d.getMonth() + 1),
    año: String(d.getFullYear()),
    hora: pad(d.getHours()),
    minuto: pad(d.getMinutes()),
  };
}

/** Fecha y hora actuales en formato DD/MM/AAAA HH:MM. */
export function fechaHoraLocalAhora(): string {
  return partesFechaHoraATexto(fechaHoraPartesAhora());
}

/** Una sola entrada: solo dígitos → se insertan `/` al escribir (DD/MM/AAAA). */
export function maskInputFechaDDMMYYYY(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Campo hora aparte: dígitos → `:` tras la hora (HH:MM). */
export function maskInputHoraHHMM(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Para rellenar los dos inputs desde el valor guardado. */
export function fechaHoraGuardadaToMaskedInputs(fechaHora: string): {
  fecha: string;
  hora: string;
} {
  const p = parseFechaHoraToParts(fechaHora);
  if (!p) return { fecha: "", hora: "" };
  return {
    fecha: maskInputFechaDDMMYYYY(`${p.dia}${p.mes}${p.año}`),
    hora: maskInputHoraHHMM(`${p.hora}${p.minuto}`),
  };
}

export function combinarMaskedAFechaHoraGuardada(
  fechaMasked: string,
  horaMasked: string,
): string {
  return `${fechaMasked.trim()} ${horaMasked.trim()}`;
}

/** Migra valor antiguo `fecha` ISO (yyyy-mm-dd) a texto DD/MM/AAAA 09:00. */
export function isoFechaLegacyAFechaHora(iso: string): string | null {
  const t = iso.trim();
  const parts = t.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  const yi = Number(y);
  const mi = Number(m);
  const di = Number(d);
  if (!Number.isFinite(yi) || !Number.isFinite(mi) || !Number.isFinite(di))
    return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(di)}/${pad(mi)}/${yi} 09:00`;
}

/** Deprecado para UI: preferir `esControlFechaYaOcurrida` (solo fecha). */
export function esProximoControlPasado(fechaHora: string): boolean {
  const dt = parseFechaHoraLocal(fechaHora);
  if (!dt) return false;
  return dt.getTime() < Date.now();
}

const FECHA_SOLO_DDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** `DD/MM/AAAA` completo y día calendario estrictamente anterior a hoy. */
export function esFechaMaskedAnteriorAHoy(fechaMasked: string): boolean {
  const m = FECHA_SOLO_DDMMYYYY.exec(fechaMasked.trim());
  if (!m) return false;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  return cmp < today;
}

/** Días de calendario desde hoy hasta la fecha del evento (ignora hora para el “Próximo” tipo semana). */
export function diasCalendarioHastaFechaHora(fechaHora: string): number | null {
  const dt = parseFechaHoraLocal(fechaHora);
  if (!dt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  return Math.round(
    (day.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
}

/** La fecha del control ya pasó (solo día; hoy no cuenta como “ya ocurrido”). */
export function esControlFechaYaOcurrida(fechaHora: string): boolean {
  const d = diasCalendarioHastaFechaHora(fechaHora);
  return d !== null && d < 0;
}

/** Hoy o día anterior (calendario); permite marcar Realizado/Ausente. */
export function esControlFechaPasadaOHoy(fechaHora: string): boolean {
  const d = diasCalendarioHastaFechaHora(fechaHora);
  return d !== null && d <= 0;
}

/** Orden cronológico por fecha/hora guardada. */
export function sortProximosControlesPorFecha(
  controles: ProximoControl[],
): ProximoControl[] {
  return [...controles].sort((a, b) => {
    const ta = parseFechaHoraLocal(a.fechaHora)?.getTime() ?? 0;
    const tb = parseFechaHoraLocal(b.fechaHora)?.getTime() ?? 0;
    return ta - tb;
  });
}
