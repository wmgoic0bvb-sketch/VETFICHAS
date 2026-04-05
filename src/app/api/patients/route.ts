import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { pacienteFromMongoLean } from "@/lib/mongodb-patient";
import { pacienteParaRespuestaApi } from "@/lib/patient-change-log";
import { connectMongo } from "@/lib/mongodb";
import { Patient } from "@/models/patient";
import type { PacienteDraft } from "@/types/patient";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export const GET = auth(async (_req: NextAuthRequest) => {
  if (!_req.auth?.user) {
    return unauthorized();
  }

  try {
    await connectMongo();
    const rows = await Patient.find().sort({ createdAt: -1 }).lean().exec();
    const role = _req.auth.user.role;
    const patients = rows.map((doc) =>
      pacienteParaRespuestaApi(pacienteFromMongoLean(doc), role),
    );
    return NextResponse.json({ patients });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});

function isDraftLike(b: unknown): b is PacienteDraft {
  if (!b || typeof b !== "object") return false;
  const o = b as Record<string, unknown>;
  return (
    o.especie === "Perro" ||
    o.especie === "Gato"
  ) && typeof o.nombre === "string";
}

export const POST = auth(async (req: NextAuthRequest) => {
  if (!req.auth?.user) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isDraftLike(body)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const draft = body;
  const d0 = draft.dueños?.[0];
  const d1 = draft.dueños?.[1];

  try {
    await connectMongo();
    const doc = await Patient.create({
      especie: draft.especie,
      nombre: draft.nombre.trim(),
      raza: typeof draft.raza === "string" ? draft.raza : "",
      sexo: typeof draft.sexo === "string" ? draft.sexo : "",
      fnac: typeof draft.fnac === "string" ? draft.fnac : "",
      castrado: typeof draft.castrado === "string" ? draft.castrado : "",
      color: typeof draft.color === "string" ? draft.color : "",
      dueños: [
        {
          nombre: d0 && typeof d0.nombre === "string" ? d0.nombre : "",
          tel: d0 && typeof d0.tel === "string" ? d0.tel : "",
        },
        {
          nombre: d1 && typeof d1.nombre === "string" ? d1.nombre : "",
          tel: d1 && typeof d1.tel === "string" ? d1.tel : "",
        },
      ],
      dir: typeof draft.dir === "string" ? draft.dir : "",
      estado: draft.estado === "archivado" ? "archivado" : "activo",
      esExterno: Boolean(draft.esExterno),
      esUnicaConsulta: Boolean(draft.esUnicaConsulta),
      internado: Boolean(draft.internado),
      ...(draft.datosInternacion != null
        ? { datosInternacion: draft.datosInternacion }
        : {}),
      proximosControles: Array.isArray(draft.proximosControles)
        ? draft.proximosControles
        : [],
      consultas: Array.isArray(draft.consultas) ? draft.consultas : [],
      estudios: Array.isArray(draft.estudios) ? draft.estudios : [],
    });

    const patient = pacienteFromMongoLean(doc.toObject());
    return NextResponse.json({
      patient: pacienteParaRespuestaApi(patient, req.auth.user.role),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
