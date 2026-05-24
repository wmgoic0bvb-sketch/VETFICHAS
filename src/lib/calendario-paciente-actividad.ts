import { mismoDia, isoDateLocal } from "@/lib/calendario-fecha";
import { pacienteVisibleEnFiltroCalendario } from "@/lib/sucursales";
import type { Consulta, Paciente } from "@/types/patient";

export type MotivoActividadCalendario = "alta" | "consulta";

export interface EntradaActividadPacienteCalendario {
  paciente: Paciente;
  motivos: MotivoActividadCalendario[];
  consultasEseDia: Consulta[];
}

/** Convierte `consulta.fecha` (ISO o prefijo ISO o DD/MM/AAAA) a `YYYY-MM-DD`. */
export function consultaFechaNormalizada(fecha: string): string | null {
  const t = fecha.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const d = m[1]!.padStart(2, "0");
    const mo = m[2]!.padStart(2, "0");
    return `${m[3]}-${mo}-${d}`;
  }
  return null;
}

export function pacienteAltaEnDiaLocal(p: Paciente, dia: Date): boolean {
  const ca = p.createdAt?.trim();
  if (!ca) return false;
  const dt = new Date(ca);
  if (Number.isNaN(dt.getTime())) return false;
  return mismoDia(dt, dia);
}

export function consultasPacienteEnDiaLocal(
  p: Paciente,
  dia: Date,
): Consulta[] {
  const target = isoDateLocal(dia);
  return p.consultas.filter((c) => {
    const iso = consultaFechaNormalizada(c.fecha);
    return iso === target;
  });
}

export function pacientesActividadDelDia(
  patients: Paciente[],
  dia: Date,
  filtroSucursalId: string | null,
): EntradaActividadPacienteCalendario[] {
  const out: EntradaActividadPacienteCalendario[] = [];
  for (const paciente of patients) {
    if (!pacienteVisibleEnFiltroCalendario(paciente.sucursal, filtroSucursalId)) {
      continue;
    }
    const alta = pacienteAltaEnDiaLocal(paciente, dia);
    const consultasEseDia = consultasPacienteEnDiaLocal(paciente, dia);
    if (!alta && consultasEseDia.length === 0) continue;
    const motivos: MotivoActividadCalendario[] = [];
    if (alta) motivos.push("alta");
    if (consultasEseDia.length > 0) motivos.push("consulta");
    out.push({ paciente, motivos, consultasEseDia });
  }
  out.sort((a, b) =>
    a.paciente.nombre.localeCompare(b.paciente.nombre, "es", {
      sensitivity: "base",
    }),
  );
  return out;
}

/** Días del mes con alta o al menos una consulta (indicador en mini calendario). */
export function diasDelMesConActividadFicha(
  patients: Paciente[],
  año: number,
  mes: number,
): Set<number> {
  const set = new Set<number>();
  for (const p of patients) {
    if (p.createdAt?.trim()) {
      const dt = new Date(p.createdAt);
      if (
        !Number.isNaN(dt.getTime()) &&
        dt.getFullYear() === año &&
        dt.getMonth() === mes
      ) {
        set.add(dt.getDate());
      }
    }
    for (const c of p.consultas) {
      const iso = consultaFechaNormalizada(c.fecha);
      if (!iso) continue;
      const parts = iso.split("-");
      if (parts.length !== 3) continue;
      const y = Number(parts[0]);
      const mo = Number(parts[1]);
      const day = Number(parts[2]);
      if (y === año && mo - 1 === mes && Number.isFinite(day)) {
        set.add(day);
      }
    }
  }
  return set;
}
