import { randomBytes } from "crypto";
import { connectMongo } from "@/lib/mongodb";
import { pacienteFromMongoLean } from "@/lib/mongodb-patient";
import { Patient } from "@/models/patient";
import { Vacuna } from "@/models/vacuna";
import type { Paciente } from "@/types/patient";

/** Nombres de vacuna extraídos del texto de motivo (consultas tipo Vacuna). */
export function nombresVacunaDesdeMotivo(motivo: string): string[] {
  const t = motivo.trim();
  if (!t) return [];
  return t
    .split(/ · |, |;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type CarnetVacunaLinea = {
  nombre: string;
  descripcion: string;
};

export type CarnetEventoVacuna = {
  fecha: string;
  /** Marca del biológico (consulta Vacuna: `diag`). */
  marca?: string;
  /** Nº de lote (`trat`). */
  lote?: string;
  /** Próximo refuerzo (`meds`, DD/MM/AAAA o ISO). */
  proximoRefuerzo?: string;
  vacunas: CarnetVacunaLinea[];
};

export type CarnetPublicoPayload = {
  paciente: {
    nombre: string;
    especie: string;
    raza: string;
  };
  eventos: CarnetEventoVacuna[];
};

export function generateCarnetPublicToken(): string {
  return randomBytes(18).toString("base64url");
}

type LeanPatientRow = {
  _id: unknown;
  carnetPublicToken?: string | null;
};

/**
 * Asigna token a documentos que no lo tienen (p. ej. al listar pacientes).
 * Actualiza cada fila en memoria para el mapeo inmediato a `Paciente`.
 */
export async function ensureCarnetTokensForRows(
  rows: LeanPatientRow[],
): Promise<void> {
  const missing = rows.filter((r) => !r.carnetPublicToken);
  if (missing.length === 0) return;
  await connectMongo();
  for (const r of missing) {
    Object.assign(r, { carnetPublicToken: generateCarnetPublicToken() });
  }
  await Patient.bulkWrite(
    missing.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: {
          $set: {
            carnetPublicToken: (r as { carnetPublicToken: string })
              .carnetPublicToken,
          },
        },
      },
    })),
  );
}

function campoOpcional(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

function eventosVacunaDesdePaciente(p: Paciente): CarnetEventoVacuna[] {
  const vacunas = (p.consultas ?? []).filter((c) => c.tipo === "Vacuna");
  const sorted = [...vacunas].sort((a, b) => {
    const fa = a.fecha.trim();
    const fb = b.fecha.trim();
    return fb.localeCompare(fa);
  });
  return sorted.map((c) => ({
    fecha: c.fecha,
    marca: campoOpcional(c.diag),
    lote: campoOpcional(c.trat),
    proximoRefuerzo: campoOpcional(c.meds),
    vacunas: nombresVacunaDesdeMotivo(c.motivo).map((nombre) => ({
      nombre,
      descripcion: "",
    })),
  }));
}

async function mapDescripcionesCatalogo(
  eventos: CarnetEventoVacuna[],
): Promise<CarnetEventoVacuna[]> {
  const nombres = new Set<string>();
  for (const ev of eventos) {
    for (const v of ev.vacunas) {
      nombres.add(v.nombre);
    }
  }
  if (nombres.size === 0) return eventos;

  await connectMongo();
  const rows = await Vacuna.find({
    nombre: { $in: [...nombres] },
  })
    .select("nombre descripcion")
    .lean()
    .exec();

  const descByNombre = new Map<string, string>();
  for (const r of rows) {
    descByNombre.set(
      r.nombre,
      typeof r.descripcion === "string" ? r.descripcion.trim() : "",
    );
  }

  return eventos.map((ev) => ({
    fecha: ev.fecha,
    marca: ev.marca,
    lote: ev.lote,
    proximoRefuerzo: ev.proximoRefuerzo,
    vacunas: ev.vacunas.map((v) => ({
      nombre: v.nombre,
      descripcion: descByNombre.get(v.nombre) ?? "",
    })),
  }));
}

/**
 * Datos del carnet público o null si el token no existe.
 */
export async function getCarnetPublicoPorToken(
  token: string,
): Promise<CarnetPublicoPayload | null> {
  const t = token.trim();
  if (t.length < 12) return null;

  await connectMongo();
  const doc = await Patient.findOne({ carnetPublicToken: t }).lean().exec();
  if (!doc) return null;

  const paciente = pacienteFromMongoLean(doc);

  const rawEventos = eventosVacunaDesdePaciente(paciente).filter(
    (ev) => ev.vacunas.length > 0,
  );
  const eventos = await mapDescripcionesCatalogo(rawEventos);

  return {
    paciente: {
      nombre: paciente.nombre,
      especie: paciente.especie,
      raza: paciente.raza ?? "",
    },
    eventos,
  };
}
