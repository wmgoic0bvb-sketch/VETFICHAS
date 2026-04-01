import type { Paciente } from "@/types/patient";

const STORAGE_KEY = "vetfichas_pacientes";

export interface PatientRepository {
  load(): Paciente[];
  persist(patients: Paciente[]): void;
}

function parsePatients(raw: string | null): Paciente[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data as Paciente[];
  } catch {
    return [];
  }
}

/** Persistencia local; puede sustituirse por una implementación API sin cambiar el resto de la app. */
export class LocalStoragePatientRepository implements PatientRepository {
  load(): Paciente[] {
    if (typeof window === "undefined") return [];
    return parsePatients(window.localStorage.getItem(STORAGE_KEY));
  }

  persist(patients: Paciente[]): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }
}
