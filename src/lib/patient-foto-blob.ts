import { deleteBlobUrl } from "@/lib/vercel-blob-api";

/** URLs de Vercel Blob que podemos borrar al reemplazar la foto del paciente. */
export function isDeletableVercelBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Token del store dedicado a fotos de paciente (el store general puede seguir privado). */
export function patientPicturesBlobToken(): string | undefined {
  const t = process.env.BLOB_PICTURES_READ_WRITE_TOKEN?.trim();
  return t || undefined;
}

/**
 * Borra un blob anterior; prueba el store de fotos y, si falla, el token legacy
 * (fotos subidas antes de separar almacenes).
 */
export async function deletePatientPortraitBlobIfPossible(url: string): Promise<void> {
  const pic = patientPicturesBlobToken();
  const legacy = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const tokens = [pic, legacy].filter(
    (t, i, a): t is string => !!t && a.indexOf(t) === i,
  );
  for (const token of tokens) {
    try {
      await deleteBlobUrl(url, token);
      return;
    } catch {
      /* otro store o ya borrado */
    }
  }
  console.error("[patient foto] no se pudo borrar la URL anterior del blob");
}
