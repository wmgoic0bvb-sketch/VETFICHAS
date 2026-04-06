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
import type { ModificacionPaciente, Paciente } from "@/types/patient";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

async function paramIds(ctx: {
  params: Promise<{ id: string; estudioId: string }> | { id: string; estudioId: string };
}) {
  const p = await Promise.resolve(ctx.params);
  return p;
}

export const DELETE = auth(async (req: NextAuthRequest, ctx) => {
  if (!req.auth?.user) {
    return unauthorized();
  }

  const { id, estudioId } = await paramIds(ctx);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }
  const eid = typeof estudioId === "string" ? estudioId.trim() : "";
  if (!eid) {
    return NextResponse.json({ error: "estudioId requerido" }, { status: 400 });
  }

  try {
    await connectMongo();
    const prevDoc = await Patient.findById(id).lean().exec();
    if (!prevDoc) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const pacientePrev = pacienteFromMongoLean(prevDoc);
    const estudiosFiltrados = (pacientePrev.estudios ?? []).filter((e) => e.id !== eid);
    if (estudiosFiltrados.length === (pacientePrev.estudios ?? []).length) {
      return NextResponse.json({ error: "Estudio no encontrado" }, { status: 404 });
    }

    const pacienteNext: Paciente = {
      ...pacientePrev,
      estudios: estudiosFiltrados,
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
        $pull: { estudios: { id: eid } },
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
