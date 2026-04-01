export type Especie = "Perro" | "Gato";

export type ConsultaTipo = "Control" | "Vacuna" | "Urgencia" | "Cirugía";

export interface Consulta {
  id: string;
  motivo: string;
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

export interface Paciente {
  id: string;
  especie: Especie;
  nombre: string;
  raza: string;
  sexo: string;
  fnac: string;
  castrado: string;
  color: string;
  dueno: string;
  tel: string;
  dir: string;
  consultas: Consulta[];
  estudios: Estudio[];
}

export type PacienteDraft = Omit<Paciente, "id" | "consultas" | "estudios"> & {
  consultas?: Consulta[];
  estudios?: Estudio[];
};
