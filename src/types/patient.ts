export type Especie = "Perro" | "Gato";

export type ConsultaTipo =
  | "Consulta"
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
  /** Controles programados (varios por paciente). */
  proximosControles: ProximoControl[];
  consultas: Consulta[];
  estudios: Estudio[];
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
