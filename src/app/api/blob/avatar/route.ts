import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUserToken } from "@/lib/admin-route-auth";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/user";

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

export async function POST(request: NextRequest) {
  const auth = await requireUserToken(request);
  if (!auth.ok && auth.error === "config") {
    return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  try {
    await connectMongo();
    await User.findByIdAndUpdate(auth.userId, {
      $set: { imageData: base64, imageType: type },
    }).exec();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar la imagen" },
      { status: 500 },
    );
  }

  const url = `/api/users/${auth.userId}/avatar`;
  return NextResponse.json({ url });
}
