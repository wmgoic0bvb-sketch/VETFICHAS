import {
  isoFechaLegacyAFechaHora,
  isFechaHoraProximoControlValida,
} from "@/lib/proximo-control-utils";
import { DEFAULT_SUCURSAL_ID, SUCURSALES } from "@/lib/sucursales";
import type {
  Consulta,
  DueñoContacto,
  EstadoPaciente,
  Paciente,
  ProximoControl,
} from "@/types/patient";

function normalizeConsulta(raw: Consulta): Consulta {
  return {
    ...raw,
    veterinario:
      typeof raw.veterinario === "string" ? raw.veterinario : "",
  };
}

function normalizeSucursalIdProximo(id: string): string {
  const t = id.trim();
  if (SUCURSALES.some((s) => s.id === t)) return t;
  if (t === "principal") return DEFAULT_SUCURSAL_ID;
  return DEFAULT_SUCURSAL_ID;
}

function makeProximoId(seed: number): string {
  return `pc-${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeProximoControlBody(
  o: Record<string, unknown>,
): Omit<ProximoControl, "id"> | null {
  const notaRaw = o.nota;
  const nota =
    typeof notaRaw === "string" && notaRaw.trim() ? notaRaw.trim() : undefined;

  const fechaHoraRaw =
    typeof o.fechaHora === "string" ? o.fechaHora.trim() : "";
  const sucursalIdRaw =
    typeof o.sucursalId === "string" ? o.sucursalId.trim() : "";

  const asRaw = o.asistencia;
  const asistencia: ProximoControl["asistencia"] =
    asRaw === "asistio" || asRaw === "ausente"
      ? asRaw
      : null;

  const build = (
    fechaHora: string,
    sid: string,
  ): Omit<ProximoControl, "id"> => {
    const base: Omit<ProximoControl, "id"> = {
      fechaHora,
      sucursalId: sid,
      asistencia,
    };
    return nota !== undefined ? { ...base, nota } : base;
  };

  if (fechaHoraRaw && isFechaHoraProximoControlValida(fechaHoraRaw)) {
    const sid = normalizeSucursalIdProximo(
      sucursalIdRaw || DEFAULT_SUCURSAL_ID,
    );
    return build(fechaHoraRaw, sid);
  }

  const fechaLegacy = typeof o.fecha === "string" ? o.fecha.trim() : "";
  if (fechaLegacy) {
    const fh = isoFechaLegacyAFechaHora(fechaLegacy);
    if (fh) {
      const sid = normalizeSucursalIdProximo(
        sucursalIdRaw || DEFAULT_SUCURSAL_ID,
      );
      return build(fh, sid);
    }
  }

  return null;
}

function normalizeProximoControlItem(
  raw: unknown,
  index: number,
): ProximoControl | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const body = normalizeProximoControlBody(o);
  if (!body) return null;
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim()
      : makeProximoId(index);
  return { ...body, id };
}

function normalizeProximosControles(
  rawList: unknown,
  legacySingle: unknown,
): ProximoControl[] {
  if (Array.isArray(rawList)) {
    return rawList
      .map((item, i) => normalizeProximoControlItem(item, i))
      .filter((x): x is ProximoControl => x !== null);
  }
  if (legacySingle !== null && legacySingle !== undefined) {
    const one = normalizeProximoControlItem(legacySingle, 0);
    if (one) return [one];
  }
  return [];
}

function normalizeEstado(raw: unknown): EstadoPaciente {
  if (raw === "activo" || raw === "archivado") {
    return raw;
  }
  /** Datos viejos: inactivo / fallecido → unificado como archivado */
  if (raw === "inactivo" || raw === "fallecido") {
    return "archivado";
  }
  return "activo";
}

function normalizeDueños(raw: Record<string, unknown>): [DueñoContacto, DueñoContacto] {
  const vacío: DueñoContacto = { nombre: "", tel: "" };
  const arr = raw.dueños;
  if (Array.isArray(arr) && arr.length >= 1) {
    const a = arr[0] as Record<string, unknown> | undefined;
    const b = arr[1] as Record<string, unknown> | undefined;
    return [
      {
        nombre: typeof a?.nombre === "string" ? a.nombre : "",
        tel: typeof a?.tel === "string" ? a.tel : "",
      },
      {
        nombre: typeof b?.nombre === "string" ? b.nombre : "",
        tel: typeof b?.tel === "string" ? b.tel : "",
      },
    ];
  }
  const dueno = typeof raw.dueno === "string" ? raw.dueno : "";
  const tel = typeof raw.tel === "string" ? raw.tel : "";
  return [{ nombre: dueno, tel }, { ...vacío }];
}

export type StoredPatient = Paciente & {
  dueno?: string;
  tel?: string;
  /** Migración: antes era un solo objeto. */
  proximoControl?: unknown;
};

export function normalizePatient(p: StoredPatient): Paciente {
  const raw = p as unknown as Record<string, unknown>;
  const { dueno: _d, tel: _t, ...rest } = p as StoredPatient & {
    dueno?: string;
    tel?: string;
  };
  return {
    ...(rest as Omit<Paciente, "dueños" | "estado">),
    dueños: normalizeDueños(raw),
    estado: normalizeEstado(raw.estado),
    esExterno: typeof p.esExterno === "boolean" ? p.esExterno : false,
    esUnicaConsulta:
      typeof p.esUnicaConsulta === "boolean" ? p.esUnicaConsulta : false,
    internado: typeof p.internado === "boolean" ? p.internado : false,
    proximosControles: normalizeProximosControles(
      raw.proximosControles,
      raw.proximoControl,
    ),
    consultas: Array.isArray(p.consultas)
      ? p.consultas.map((c) => normalizeConsulta(c))
      : [],
    estudios: Array.isArray(p.estudios) ? p.estudios : [],
  };
}

