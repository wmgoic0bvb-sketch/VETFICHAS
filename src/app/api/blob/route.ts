import { NextResponse } from "next/server";
import { deleteBlobUrl, putBlob } from "@/lib/vercel-blob-api";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // límite típico de body en serverless

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return base || "archivo";
}

type UploadLike = Blob & {
  size: number;
  type: string;
  name?: string;
};

function isUploadLike(value: unknown): value is UploadLike {
  return (
    !!value &&
    typeof value === "object" &&
    "arrayBuffer" in value &&
    "size" in value &&
    typeof (value as { size: unknown }).size === "number"
  );
}

export async function POST(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Falta BLOB_READ_WRITE_TOKEN. Creá un Blob Store en Vercel y añadí el token en .env.local",
      },
      { status: 503 },
    );
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
      { error: `El archivo supera ${MAX_BYTES / (1024 * 1024)} MB` },
      { status: 400 },
    );
  }

  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { error: "Solo se permiten PDF o imágenes (JPEG, PNG, WebP, GIF)" },
      { status: 400 },
    );
  }

  const patientId = String(formData.get("patientId") ?? "").trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId requerido" }, { status: 400 });
  }

  const safeName = sanitizeFilename(file.name ?? "archivo");
  const pathname = `vetfichas/estudios/${patientId}/${Date.now()}-${safeName}`;

  try {
    const blob = await putBlob(pathname, file, token);
    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      downloadUrl: blob.downloadUrl,
    });
  } catch (e) {
    console.error("[blob upload]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No se pudo subir el archivo. Revisá el token de Blob.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const url =
    body &&
    typeof body === "object" &&
    "url" in body &&
    typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url.trim()
      : "";

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }

  try {
    const host = new URL(url).hostname;
    if (!host.endsWith(".blob.vercel-storage.com")) {
      return NextResponse.json({ error: "url no permitida" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }

  const delToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!delToken) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await deleteBlobUrl(url, delToken);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[blob delete]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No se pudo borrar el archivo en el almacenamiento",
      },
      { status: 500 },
    );
  }
}
