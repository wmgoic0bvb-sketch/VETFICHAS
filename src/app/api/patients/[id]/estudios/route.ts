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
import { Patient } from "@/models/patient";
import type { Estudio, EstudioCategoria, ModificacionPaciente } from "@/types/patient";

export const runtime = "nodejs";

const CATEGORIAS: EstudioCategoria[] = [
  "Sangre / laboratorio",
  "Radiografía",
  "Ecografía",
  "Otro",
];

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

async function paramId(ctx: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

function isEstudioInput(body: unknown): body is Omit<Estudio, "id" | "fecha"> {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  const url = typeof o.url === "string" ? o.url.trim() : "";
  const categoria = o.categoria;
  if (!url || typeof categoria !== "string") return false;
  return CATEGORIAS.includes(categoria as EstudioCategoria);
}

export const POST = auth(async (req: NextAuthRequest, ctx) => {
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

  if (!isEstudioInput(body)) {
    return NextResponse.json({ error: "Datos de estudio inválidos" }, { status: 400 });
  }

  const estudio: Estudio = {
    ...body,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    fecha: new Date().toISOString(),
    titulo: typeof body.titulo === "string" ? body.titulo : "",
    nombreArchivo:
      typeof body.nombreArchivo === "string" ? body.nombreArchivo : "",
    contentType:
      typeof body.contentType === "string" ? body.contentType : "",
  };

  try {
    await connectMongo();
    const prevDoc = await Patient.findById(id).lean().exec();
    if (!prevDoc) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const pacientePrev = pacienteFromMongoLean(prevDoc);
    const pacienteNext: typeof pacientePrev = {
      ...pacientePrev,
      estudios: [...(pacientePrev.estudios ?? []), estudio],
    };

    const sessionUser = req.auth!.user!;
    let historialModificaciones: ModificacionPaciente[] =
      pacientePrev.historialModificaciones ?? [];

    if (hasPatientClinicalChanges(pacientePrev, pacienteNext)) {
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
        resumen: describePatientChanges(pacientePrev, pacienteNext),
      };
      historialModificaciones = mergeHistorialTrasGuardado(
        historialModificaciones,
        nueva,
      );
    }

    const updated = await Patient.findByIdAndUpdate(
      id,
      {
        $push: { estudios: estudio },
        $set: { historialModificaciones },
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
