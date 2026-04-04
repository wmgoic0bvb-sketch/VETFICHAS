export type Especie = "Perro" | "Gato";

export type ConsultaTipo = "Control" | "Vacuna" | "Urgencia" | "Cirugía";

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
  /** Paciente derivado de otra veterinaria. */
  esExterno: boolean;
  /** Seguimiento puntual (sin continuidad habitual en la clínica). */
  esUnicaConsulta: boolean;
  consultas: Consulta[];
  estudios: Estudio[];
}

export type PacienteDraft = Omit<Paciente, "id" | "consultas" | "estudios"> & {
  consultas?: Consulta[];
  estudios?: Estudio[];
};
