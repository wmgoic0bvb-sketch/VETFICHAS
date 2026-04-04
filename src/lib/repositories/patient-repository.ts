import type { Consulta, DueñoContacto, Paciente } from "@/types/patient";

const STORAGE_KEY = "vetfichas_pacientes";

export interface PatientRepository {
  load(): Paciente[];
  persist(patients: Paciente[]): void;
}

function normalizeConsulta(raw: Consulta): Consulta {
  return {
    ...raw,
    veterinario:
      typeof raw.veterinario === "string" ? raw.veterinario : "",
  };
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

type StoredPatient = Paciente & { dueno?: string; tel?: string };

function normalizePatient(p: StoredPatient): Paciente {
  const raw = p as unknown as Record<string, unknown>;
  const { dueno: _d, tel: _t, ...rest } = p as StoredPatient & {
    dueno?: string;
    tel?: string;
  };
  return {
    ...(rest as Omit<Paciente, "dueños">),
    dueños: normalizeDueños(raw),
    esExterno: typeof p.esExterno === "boolean" ? p.esExterno : false,
    esUnicaConsulta:
      typeof p.esUnicaConsulta === "boolean" ? p.esUnicaConsulta : false,
    consultas: Array.isArray(p.consultas)
      ? p.consultas.map((c) => normalizeConsulta(c))
      : [],
    estudios: Array.isArray(p.estudios) ? p.estudios : [],
  };
}

function parsePatients(raw: string | null): Paciente[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return (data as StoredPatient[]).map(normalizePatient);
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
