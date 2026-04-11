import type { Estudio, Paciente, PacienteDraft } from "@/types/patient";

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

export async function createPatient(draft: PacienteDraft): Promise<Paciente> {
  const res = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(draft),
  });
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
