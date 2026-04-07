import { todayISODate } from "@/lib/date-utils";
import type {
  DatosInternacion,
  EvolucionRondaInternacion,
  EstadoGeneralEvolucion,
  InternacionHistorial,
  OrdenTratamientoInternacion,
  TipoEgreso,
} from "@/types/patient";

function nowHHMM(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function defaultDatosInternacion(): DatosInternacion {
  return {
    fechaIngreso: todayISODate(),
    horaIngreso: nowHHMM(),
    motivoIngreso: "",
    veterinarioResponsable: "",
    diagnosticoPrincipal: "",
    diagnosticoEditadoEn: undefined,
    ordenes: [],
    evoluciones: [],
  };
}

function normalizeOrden(raw: unknown): OrdenTratamientoInternacion | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim()
      : `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    medicamentoOProcedimiento:
      typeof o.medicamentoOProcedimiento === "string"
        ? o.medicamentoOProcedimiento
        : "",
    viaAdministracion:
      typeof o.viaAdministracion === "string" ? o.viaAdministracion : "",
    dosis: typeof o.dosis === "string" ? o.dosis : "",
    frecuencia: typeof o.frecuencia === "string" ? o.frecuencia : "",
    fechaInicio: typeof o.fechaInicio === "string" ? o.fechaInicio : "",
    fechaFin: typeof o.fechaFin === "string" ? o.fechaFin : undefined,
    activa: o.activa === false ? false : true,
  };
}

function normalizeEstadoGeneral(
  raw: unknown,
): EstadoGeneralEvolucion {
  if (raw === "Regular" || raw === "Crítico" || raw === "Estable") return raw;
  return "Estable";
}

function normalizeEvolucion(raw: unknown): EvolucionRondaInternacion | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim()
      : `evo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const fechaHora =
    typeof o.fechaHora === "string" && o.fechaHora.trim()
      ? o.fechaHora.trim()
      : new Date().toISOString();
  const pesoRaw = o.peso;
  return {
    id,
    fechaHora,
    veterinario: typeof o.veterinario === "string" ? o.veterinario : "",
    temperatura: typeof o.temperatura === "string" ? o.temperatura : "",
    frecuenciaCardiaca:
      typeof o.frecuenciaCardiaca === "string" ? o.frecuenciaCardiaca : "",
    frecuenciaRespiratoria:
      typeof o.frecuenciaRespiratoria === "string"
        ? o.frecuenciaRespiratoria
        : "",
    peso: typeof pesoRaw === "string" && pesoRaw.trim() ? pesoRaw : undefined,
    estadoGeneral: normalizeEstadoGeneral(o.estadoGeneral),
    observaciones:
      typeof o.observaciones === "string" ? o.observaciones : "",
  };
}

/**
 * Fusiona datos persistidos con valores por defecto.
 * Si `internado` y no hay documento, devuelve defaults.
 */
export function mergeDatosInternacion(
  raw: unknown,
  internado: boolean,
): DatosInternacion | undefined {
  const base = defaultDatosInternacion();
  if (raw === null || raw === undefined) {
    return internado ? base : undefined;
  }
  if (typeof raw !== "object") {
    return internado ? base : undefined;
  }
  const o = raw as Record<string, unknown>;
  const ordenes = Array.isArray(o.ordenes)
    ? o.ordenes
        .map(normalizeOrden)
        .filter((x): x is OrdenTratamientoInternacion => x !== null)
    : [];
  const evoluciones = Array.isArray(o.evoluciones)
    ? o.evoluciones
        .map(normalizeEvolucion)
        .filter((x): x is EvolucionRondaInternacion => x !== null)
    : [];
  const tipoEgresoRaw = o.tipoEgreso;
  const tipoEgreso: TipoEgreso | undefined =
    tipoEgresoRaw === "alta" || tipoEgresoRaw === "fallecimiento"
      ? tipoEgresoRaw
      : undefined;

  return {
    fechaIngreso:
      typeof o.fechaIngreso === "string" && o.fechaIngreso.trim()
        ? o.fechaIngreso.trim().slice(0, 10)
        : base.fechaIngreso,
    horaIngreso:
      typeof o.horaIngreso === "string" && /^\d{2}:\d{2}$/.test(o.horaIngreso.trim())
        ? o.horaIngreso.trim()
        : undefined,
    fechaAlta:
      typeof o.fechaAlta === "string" && o.fechaAlta.trim()
        ? o.fechaAlta.trim()
        : undefined,
    tipoEgreso,
    causaFallecimiento:
      typeof o.causaFallecimiento === "string" && o.causaFallecimiento.trim()
        ? o.causaFallecimiento.trim()
        : undefined,
    motivoIngreso:
      typeof o.motivoIngreso === "string" ? o.motivoIngreso : "",
    veterinarioResponsable:
      typeof o.veterinarioResponsable === "string"
        ? o.veterinarioResponsable
        : "",
    diagnosticoPrincipal:
      typeof o.diagnosticoPrincipal === "string"
        ? o.diagnosticoPrincipal
        : "",
    diagnosticoEditadoEn:
      typeof o.diagnosticoEditadoEn === "string" &&
      o.diagnosticoEditadoEn.trim()
        ? o.diagnosticoEditadoEn.trim()
        : undefined,
    ordenes,
    evoluciones,
  };
}

/** Normaliza un ítem del historial de internaciones (requiere `id`). */
export function normalizeInternacionHistorialItem(
  raw: unknown,
): InternacionHistorial | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : null;
  if (!id) return null;
  const datos = mergeDatosInternacion(raw, false);
  if (!datos) return null;
  return { ...datos, id };
}

/** Más reciente arriba (id `ord-<timestamp>-` o fecha de inicio descendente). */
export function ordenesTratamientoRecientesPrimero(
  ordenes: OrdenTratamientoInternacion[],
): OrdenTratamientoInternacion[] {
  return [...ordenes].sort((a, b) => {
    const ma = /^ord-(\d+)-/.exec(a.id);
    const mb = /^ord-(\d+)-/.exec(b.id);
    if (ma?.[1] && mb?.[1]) {
      return Number(mb[1]) - Number(ma[1]);
    }
    return (b.fechaInicio || "").localeCompare(a.fechaInicio || "");
  });
}

/** Más reciente arriba (fechaHora ISO descendente). */
export function evolucionesOrdenadas(
  evoluciones: EvolucionRondaInternacion[],
): EvolucionRondaInternacion[] {
  return [...evoluciones].sort((a, b) =>
    b.fechaHora.localeCompare(a.fechaHora),
  );
}

/** Días de internación (inclusive). Si no internado, hasta fecha de alta o hoy. */
export function diasInternacionDesdeIngreso(
  fechaIngreso: string,
  internado: boolean,
  fechaAlta?: string,
): number {
  const ini = fechaIngreso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ini)) return 0;
  const fin = internado
    ? todayISODate()
    : fechaAlta
      ? fechaAlta.slice(0, 10)
      : todayISODate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fin)) return 0;
  const [y1, m1, d1] = ini.split("-").map(Number);
  const [y2, m2, d2] = fin.split("-").map(Number);
  const t1 = new Date(y1!, m1! - 1, d1!).getTime();
  const t2 = new Date(y2!, m2! - 1, d2!).getTime();
  const diff = Math.round((t2 - t1) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

export function formatFechaHoraDisplay(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
