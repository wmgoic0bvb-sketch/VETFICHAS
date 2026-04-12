import { describeDatosInternacionDiff } from "@/lib/internacion-change-log";
import type { ModificacionPaciente, Paciente } from "@/types/patient";

/** Máximo de entradas de auditoría por paciente (FIFO al agregar). */
export const MAX_HISTORIAL_MODIFICACIONES = 400;

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object).sort();
  const kb = Object.keys(b as object).sort();
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return false;
  }
  return ka.every((k) =>
    deepEqual(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
    ),
  );
}

/** Paciente sin el historial de auditoría (solo comparación clínica). Excluye foto de perfil. */
export function patientClinicalSnapshot(
  p: Paciente,
): Omit<Paciente, "historialModificaciones" | "fotoUrl"> {
  const { historialModificaciones: _h, fotoUrl: _f, ...rest } = p;
  return rest;
}

export function hasPatientClinicalChanges(
  prev: Paciente,
  next: Paciente,
): boolean {
  return !deepEqual(patientClinicalSnapshot(prev), patientClinicalSnapshot(next));
}

function sliceDatosGenerales(p: Paciente) {
  return {
    especie: p.especie,
    nombre: p.nombre,
    raza: p.raza,
    sexo: p.sexo,
    fnac: p.fnac,
    castrado: p.castrado,
    color: p.color,
    dueños: p.dueños,
    dir: p.dir,
    estado: p.estado,
    esExterno: p.esExterno,
    esUnicaConsulta: p.esUnicaConsulta,
  };
}

/**
 * Lista corta de áreas modificadas (es-AR), para mostrar en el historial.
 */
export function describePatientChanges(prev: Paciente, next: Paciente): string {
  const partes: string[] = [];
  if (!deepEqual(sliceDatosGenerales(prev), sliceDatosGenerales(next))) {
    partes.push("Datos generales");
  }
  if (prev.internado !== next.internado) {
    partes.push("Estado de internación");
  }
  if (!deepEqual(prev.datosInternacion, next.datosInternacion)) {
    const detalleInternacion = describeDatosInternacionDiff(
      prev.datosInternacion,
      next.datosInternacion,
    );
    partes.push(detalleInternacion || "Datos de internación");
  }
  if (!deepEqual(prev.proximosControles, next.proximosControles)) {
    partes.push("Próximos controles");
  }
  if (!deepEqual(prev.consultas, next.consultas)) {
    partes.push("Consultas");
  }
  if (!deepEqual(prev.estudios, next.estudios)) {
    partes.push("Estudios");
  }
  if (partes.length === 0) {
    return "Cambios en la ficha";
  }
  return partes.join("; ");
}

export function nuevoIdModificacionPaciente(): string {
  return `hm-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function mergeHistorialTrasGuardado(
  existente: ModificacionPaciente[] | undefined,
  nueva: ModificacionPaciente,
): ModificacionPaciente[] {
  const base = Array.isArray(existente) ? existente : [];
  return [...base, nueva].slice(-MAX_HISTORIAL_MODIFICACIONES);
}

/**
 * El historial de auditoría solo se expone en JSON a usuarios con rol `admin`.
 */
export function pacienteParaRespuestaApi(
  p: Paciente,
  role: string | undefined,
): Paciente {
  if (role === "admin") return p;
  return { ...p, historialModificaciones: undefined };
}
