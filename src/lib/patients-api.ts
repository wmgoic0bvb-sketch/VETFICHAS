import type {
  DueñoContacto,
  Estudio,
  Paciente,
  PacienteDraft,
} from "@/types/patient";

export interface PacienteSimilarResumen {
  id: string;
  nombre: string;
  dueños: DueñoContacto[];
  estado?: "activo" | "archivado";
}

export class DuplicadoPacienteError extends Error {
  similares: PacienteSimilarResumen[];
  constructor(message: string, similares: PacienteSimilarResumen[]) {
    super(message);
    this.name = "DuplicadoPacienteError";
    this.similares = similares;
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
  } catch {
    /* ignore */
  }
  return res.statusText || `Error ${res.status}`;
}

async function ensureOk(res: Response): Promise<void> {
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
}

export async function fetchPatients(): Promise<Paciente[]> {
  const res = await fetch("/api/patients", { credentials: "include" });
  await ensureOk(res);
  const data = (await res.json()) as { patients: Paciente[] };
  return data.patients;
}

export async function createPatient(
  draft: PacienteDraft,
  opts?: { force?: boolean },
): Promise<Paciente> {
  const res = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ...draft, force: opts?.force === true }),
  });
  if (res.status === 409) {
    let payload: { error?: string; similares?: PacienteSimilarResumen[] } = {};
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      /* ignore */
    }
    if (Array.isArray(payload.similares) && payload.similares.length > 0) {
      throw new DuplicadoPacienteError(
        payload.error ?? "Ya existe un paciente con datos muy parecidos.",
        payload.similares,
      );
    }
  }
  await ensureOk(res);
  const data = (await res.json()) as { patient: Paciente };
  return data.patient;
}

export async function replacePatient(patient: Paciente): Promise<Paciente> {
  const res = await fetch(`/api/patients/${patient.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patient),
  });
  await ensureOk(res);
  const data = (await res.json()) as { patient: Paciente };
  return data.patient;
}

/** Añade un estudio con $push en Mongo (evita pisar otros cambios concurrentes). */
export async function appendEstudio(
  patientId: string,
  data: Omit<Estudio, "id" | "fecha">,
): Promise<Paciente> {
  const res = await fetch(`/api/patients/${patientId}/estudios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  await ensureOk(res);
  const out = (await res.json()) as { patient: Paciente };
  return out.patient;
}

export async function removeEstudioRemote(
  patientId: string,
  estudioId: string,
): Promise<Paciente> {
  const res = await fetch(
    `/api/patients/${patientId}/estudios/${encodeURIComponent(estudioId)}`,
    { method: "DELETE", credentials: "include" },
  );
  await ensureOk(res);
  const out = (await res.json()) as { patient: Paciente };
  return out.patient;
}

export async function fetchLastUpdated(): Promise<number> {
  try {
    const res = await fetch("/api/meta/last-updated", { credentials: "include" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { ts: number };
    return data.ts ?? 0;
  } catch {
    return 0;
  }
}

export async function deletePatient(id: string): Promise<void> {
  const res = await fetch(`/api/patients/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await ensureOk(res);
}
