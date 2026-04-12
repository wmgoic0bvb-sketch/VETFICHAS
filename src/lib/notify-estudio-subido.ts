import mongoose from "mongoose";
import type { Estudio } from "@/types/patient";
import { beamsInterestForUserId } from "@/lib/beams-interest";
import { connectMongo } from "@/lib/mongodb";
import { publishBeamsToInterests } from "@/lib/pusher-beams-publish";
import { StaffNotification } from "@/models/staff-notification";
import { User } from "@/models/user";

function appBaseUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return undefined;
}

/**
 * Crea notificaciones en BD para todos los usuarios excepto el que subió el estudio
 * y envía push por Pusher Beams a los mismos destinatarios.
 */
export async function notifyEstudioSubido(params: {
  uploaderUserId: string;
  uploaderName: string;
  patientId: string;
  patientNombre: string;
  estudio: Estudio;
}): Promise<void> {
  const {
    uploaderUserId,
    uploaderName,
    patientId,
    patientNombre,
    estudio,
  } = params;

  if (!mongoose.Types.ObjectId.isValid(uploaderUserId)) return;

  await connectMongo();
  const uploaderOid = new mongoose.Types.ObjectId(uploaderUserId);
  const users = await User.find({ _id: { $ne: uploaderOid } })
    .select("_id")
    .lean()
    .exec();

  const docs = users.map((u) => ({
    userId: u._id,
    kind: "estudio_subido" as const,
    readAt: null as Date | null,
    patientId,
    patientNombre,
    estudioId: estudio.id,
    estudioCategoria: estudio.categoria,
    titulo: estudio.titulo ?? "",
    uploadedByUserId: uploaderUserId,
    uploadedByName: uploaderName,
  }));

  if (docs.length > 0) {
    await StaffNotification.insertMany(docs);
  }

  const interests = users.map((u) =>
    beamsInterestForUserId(String(u._id)),
  );
  const title = "Nuevo estudio";
  const bodyDetail = estudio.titulo?.trim()
    ? ` · ${estudio.titulo.trim()}`
    : "";
  const body = `${patientNombre}${bodyDetail}`;
  const base = appBaseUrl();
  const deepLink = base ? `${base}/patient/${patientId}` : undefined;

  try {
    await publishBeamsToInterests({ interests, title, body, deepLink });
  } catch (e) {
    console.error("[notifyEstudioSubido] beams", e);
  }
}
