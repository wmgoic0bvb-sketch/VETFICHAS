import type { Types } from "mongoose";
import {
  normalizePatient,
  type StoredPatient,
} from "@/lib/repositories/patient-repository";
import type { Paciente } from "@/types/patient";

/** Convierte un documento lean de MongoDB al tipo de dominio `Paciente`. */
export function pacienteFromMongoLean(doc: unknown): Paciente {
  const d = doc as Record<string, unknown> & { _id: Types.ObjectId };
  const { _id, __v, ...rest } = d;
  void __v;
  return normalizePatient({
    ...(rest as object),
    id: _id.toString(),
  } as StoredPatient);
}
