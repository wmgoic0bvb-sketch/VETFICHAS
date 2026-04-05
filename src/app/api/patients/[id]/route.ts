import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { pacienteFromMongoLean } from "@/lib/mongodb-patient";
import {
  describePatientChanges,
  hasPatientClinicalChanges,
  mergeHistorialTrasGuardado,
  nuevoIdModificacionPaciente,
  pacienteParaRespuestaApi,
} from "@/lib/patient-change-log";
import { connectMongo } from "@/lib/mongodb";
import {
  normalizePatient,
  type StoredPatient,
} from "@/lib/repositories/patient-repository";
import { Patient } from "@/models/patient";
import type { ModificacionPaciente } from "@/types/patient";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

async function paramId(ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

export const GET = auth(async (req: NextAuthRequest, ctx) => {
  if (!req.auth?.user) {
    return unauthorized();
  }

  const id = await paramId(ctx);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  try {
    await connectMongo();
    const doc = await Patient.findById(id).lean().exec();
    if (!doc) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    const patient = pacienteFromMongoLean(doc);
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

export const PUT = auth(async (req: NextAuthRequest, ctx) => {
  if (!req.auth?.user) {
    return unauthorized();
  }

  const id = await paramId(ctx);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const bodyClean = { ...(body as Record<string, unknown>) };
  delete bodyClean.historialModificaciones;

  const patient = normalizePatient({ ...bodyClean, id } as StoredPatient);

  if (patient.id !== id) {
    return NextResponse.json({ error: "El id no coincide" }, { status: 400 });
  }

  try {
    await connectMongo();
    const prevDoc = await Patient.findById(id).lean().exec();
    if (!prevDoc) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const pacientePrev = pacienteFromMongoLean(prevDoc);

    const sessionUser = req.auth!.user!;
    let historialModificaciones: ModificacionPaciente[] =
      pacientePrev.historialModificaciones ?? [];

    if (hasPatientClinicalChanges(pacientePrev, patient)) {
      const usuarioNombre =
        typeof sessionUser.name === "string" && sessionUser.name.trim()
          ? sessionUser.name.trim()
          : undefined;
      const nueva: ModificacionPaciente = {
        id: nuevoIdModificacionPaciente(),
        fechaHora: new Date().toISOString(),
        usuarioId: sessionUser.id,
        usuarioDni: sessionUser.dni,
        usuarioNombre,
        resumen: describePatientChanges(pacientePrev, patient),
      };
      historialModificaciones = mergeHistorialTrasGuardado(
        historialModificaciones,
        nueva,
      );
    }

    const updated = await Patient.findByIdAndUpdate(
      id,
      {
        $set: {
          especie: patient.especie,
          nombre: patient.nombre,
          raza: patient.raza,
          sexo: patient.sexo,
          fnac: patient.fnac,
          castrado: patient.castrado,
          color: patient.color,
          dueños: patient.dueños,
          dir: patient.dir,
          estado: patient.estado,
          esExterno: patient.esExterno,
          esUnicaConsulta: patient.esUnicaConsulta,
          internado: patient.internado,
          datosInternacion: patient.datosInternacion,
          proximosControles: patient.proximosControles,
          consultas: patient.consultas,
          estudios: patient.estudios,
          historialModificaciones,
        },
      },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!updated) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const out = pacienteFromMongoLean(updated);
    return NextResponse.json({
      patient: pacienteParaRespuestaApi(out, req.auth.user.role),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});

export const DELETE = auth(async (_req: NextAuthRequest, ctx) => {
  if (!_req.auth?.user) {
    return unauthorized();
  }

  const id = await paramId(ctx);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  try {
    await connectMongo();
    const r = await Patient.findByIdAndDelete(id).exec();
    if (!r) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
