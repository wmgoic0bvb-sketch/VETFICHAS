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
}

export type PacienteDraft = Omit<Paciente, "id" | "consultas"> & {
  consultas?: Consulta[];
};
