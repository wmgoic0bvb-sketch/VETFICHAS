import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requireUserToken } from "@/lib/admin-route-auth";
import { pacienteFromMongoLean } from "@/lib/mongodb-patient";
import { pacienteParaRespuestaApi } from "@/lib/patient-change-log";
import {
  deletePatientPortraitBlobIfPossible,
  isDeletableVercelBlobUrl,
  patientPicturesBlobToken,
} from "@/lib/patient-foto-blob";
import { connectMongo } from "@/lib/mongodb";
import { putBlob } from "@/lib/vercel-blob-api";
import { Patient } from "@/models/patient";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type UploadLike = Blob & { size: number; type: string };

function isUploadLike(v: unknown): v is UploadLike {
  return (
    !!v &&
    typeof v === "object" &&
    "arrayBuffer" in v &&
    "size" in v &&
    typeof (v as { size: unknown }).size === "number"
  );
}

async function userRole(request: NextRequest): Promise<string | undefined> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return undefined;
  const token = await getToken({
    req: request,
    secret,
    secureCookie: request.nextUrl.protocol === "https:",
  });
  return (token as { role?: string } | null)?.role;
}

async function paramId(ctx: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requireUserToken(request);
  if (!auth.ok && auth.error === "config") {
    return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = await paramId(ctx);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!isUploadLike(file) || file.size === 0) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `La imagen no puede superar los ${MAX_BYTES / (1024 * 1024)} MB` },
      { status: 400 },
    );
  }

  const type = file.type || "image/jpeg";
  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { error: "Solo se permiten imágenes JPEG, PNG, WebP o GIF" },
      { status: 400 },
    );
  }

  const token = patientPicturesBlobToken();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Falta BLOB_PICTURES_READ_WRITE_TOKEN (store de fotos de pacientes). El almacén general puede seguir privado.",
      },
      { status: 503 },
    );
  }

  const ext =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const pathname = `vetfichas/pacientes/${id}/avatar-${Date.now()}.${ext}`;

  try {
    await connectMongo();
    const prev = await Patient.findById(id).select("fotoUrl").lean().exec();
    if (!prev || Array.isArray(prev)) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const prevFoto = (prev as { fotoUrl?: string | null }).fotoUrl;
    const prevUrl = typeof prevFoto === "string" ? prevFoto.trim() : "";

    // Público: el carnet y next/image deben poder leer la URL sin token (BLOB_ACCESS global puede ser "private").
    const blob = await putBlob(pathname, file, token, "public");

    if (prevUrl && isDeletableVercelBlobUrl(prevUrl)) {
      await deletePatientPortraitBlobIfPossible(prevUrl);
    }

    const updated = await Patient.findByIdAndUpdate(
      id,
      { $set: { fotoUrl: blob.url } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!updated) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const patient = pacienteFromMongoLean(updated);
    const role = await userRole(request);
    return NextResponse.json({
      patient: pacienteParaRespuestaApi(patient, role),
    });
  } catch (e) {
    console.error("[patient foto]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar la foto" },
      { status: 500 },
    );
  }
}
