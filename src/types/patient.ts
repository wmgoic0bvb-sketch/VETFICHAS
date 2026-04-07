export type Especie = "Perro" | "Gato";

export type ConsultaTipo =
  | "Consulta"
  | "Consulta a domicilio"
  | "Control"
  | "Vacuna"
  | "Urgencia"
  | "Cirugía";

export type AsistenciaProximoControl = "asistio" | "ausente";

/** Recordatorio de próximo control (varios por paciente). */
export interface ProximoControl {
  id: string;
  /** Fecha y hora en texto: DD/MM/AAAA HH:MM (24 h). */
  fechaHora: string;
  /** Id de sucursal (lista fija en código). */
  sucursalId: string;
  nota?: string;
  /** Solo cuando la fecha ya pasó: si asistió o se ausentó. */
  asistencia?: AsistenciaProximoControl | null;
}

export interface Consulta {
  id: string;
  motivo: string;
  /** Veterinario a cargo; obligatorio en nuevas consultas (histórico puede venir vacío). */
  veterinario: string;
  tipo: ConsultaTipo;
  fecha: string;
  peso: string;
  temp: string;
  diag: string;
  trat: string;
  meds: string;
}

/** Categoría del estudio adjunto (laboratorio, imagen, etc.). */
export type EstudioCategoria =
  | "Sangre / laboratorio"
  | "Radiografía"
  | "Ecografía"
  | "Otro";

export interface Estudio {
  id: string;
  categoria: EstudioCategoria;
  /** Título o nota breve (ej. hemograma, tórax VD). */
  titulo: string;
  url: string;
  nombreArchivo: string;
  contentType: string;
  /** ISO fecha de carga */
  fecha: string;
}

/** Un dueño o responsable con su teléfono. */
export interface DueñoContacto {
  nombre: string;
  tel: string;
}

/** Seguimiento en listados: activo en dashboard; archivado se oculta del listado principal. */
export type EstadoPaciente = "activo" | "archivado";

export const ESTADO_PACIENTE_LABELS: Record<EstadoPaciente, string> = {
  activo: "Activo",
  archivado: "Archivado",
};

/** Estado general en una ronda de evolución de internación. */
export type EstadoGeneralEvolucion = "Estable" | "Regular" | "Crítico";

export const ESTADO_GENERAL_EVOLUCION: EstadoGeneralEvolucion[] = [
  "Estable",
  "Regular",
  "Crítico",
];

/** Orden del plan de tratamiento durante la internación. */
export interface OrdenTratamientoInternacion {
  id: string;
  medicamentoOProcedimiento: string;
  viaAdministracion: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin?: string;
  activa: boolean;
}

/** Registro de evolución por ronda (no editable tras guardar). */
export interface EvolucionRondaInternacion {
  id: string;
  /** ISO 8601 (fecha y hora). */
  fechaHora: string;
  veterinario: string;
  temperatura: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  peso?: string;
  estadoGeneral: EstadoGeneralEvolucion;
  observaciones: string;
}

/** Entrada de auditoría: cambios en la ficha (servidor). */
export interface ModificacionPaciente {
  id: string;
  /** ISO 8601 */
  fechaHora: string;
  usuarioId: string;
  usuarioDni?: string;
  usuarioNombre?: string;
  /** Áreas tocadas (p. ej. "Datos generales; Consultas"). */
  resumen: string;
}

/** Tipo de egreso de internación. */
export type TipoEgreso = "alta" | "fallecimiento";

/** Registro completo de una internación finalizada (persiste en historial). */
export interface InternacionHistorial extends DatosInternacion {
  /** ID único del registro (para claves React y generación de PDF). */
  id: string;
}

/** Datos clínicos del seguimiento de internación (persistidos en el paciente). */
export interface DatosInternacion {
  /** Fecha de ingreso (YYYY-MM-DD). */
  fechaIngreso: string;
  /** Hora de ingreso (HH:MM, 24 h). */
  horaIngreso?: string;
  /** Fecha/hora de egreso (ISO); set al finalizar internación (alta o fallecimiento). */
  fechaAlta?: string;
  /** Cómo finalizó la internación: alta médica o fallecimiento. */
  tipoEgreso?: TipoEgreso;
  /** Causa del fallecimiento (solo si tipoEgreso === "fallecimiento"; opcional). */
  causaFallecimiento?: string;
  motivoIngreso: string;
  veterinarioResponsable: string;
  diagnosticoPrincipal: string;
  /** ISO 8601 de última edición del diagnóstico. */
  diagnosticoEditadoEn?: string;
  ordenes: OrdenTratamientoInternacion[];
  evoluciones: EvolucionRondaInternacion[];
}

export interface Paciente {
  id: string;
  especie: Especie;
  nombre: string;
  raza: string;
  sexo: string;
  fnac: string;
  castrado: string;
  color: string;
  /** [dueño principal, segundo dueño opcional]. */
  dueños: [DueñoContacto, DueñoContacto];
  dir: string;
  /** No listado en el dashboard principal; el historial se mantiene. */
  estado: EstadoPaciente;
  /** Paciente derivado de otra veterinaria. */
  esExterno: boolean;
  /** Seguimiento puntual (sin continuidad habitual en la clínica). */
  esUnicaConsulta: boolean;
  /** Paciente actualmente en internación / hospitalización. */
  internado: boolean;
  /** Seguimiento de internación activa (ingreso, plan, evoluciones). Undefined si no está internado. */
  datosInternacion?: DatosInternacion;
  /** Registros de internaciones previas finalizadas. */
  historialInternaciones?: InternacionHistorial[];
  /** Controles programados (varios por paciente). */
  proximosControles: ProximoControl[];
  consultas: Consulta[];
  estudios: Estudio[];
  /** Historial de modificaciones (solo servidor; no enviar desde el cliente). */
  historialModificaciones?: ModificacionPaciente[];
}

export function esPacienteActivo(p: Paciente): boolean {
  return (p.estado ?? "activo") === "activo";
}

export type PacienteDraft = Omit<
  Paciente,
  "id" | "consultas" | "estudios" | "proximosControles"
> & {
  consultas?: Consulta[];
  estudios?: Estudio[];
  proximosControles?: ProximoControl[];
};
