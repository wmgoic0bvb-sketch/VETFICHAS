/**
 * Cliente mínimo del API de Vercel Blob vía fetch (sin @vercel/blob),
 * para no arrastrar undici en el bundle de Next 13.
 * @see https://vercel.com/docs/storage/vercel-blob
 */

const DEFAULT_BLOB_API = "https://vercel.com/api/blob";
const BLOB_API_VERSION = "12";
type BlobAccess = "public" | "private";

function blobApiBase(): string {
  return (
    process.env.VERCEL_BLOB_API_URL ??
    process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL ??
    DEFAULT_BLOB_API
  );
}

function requestIdFromToken(token: string): string {
  const parts = token.split("_");
  const storeId = parts[3] ?? "";
  return `${storeId}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

function blobAccess(): BlobAccess {
  const raw = process.env.BLOB_ACCESS?.toLowerCase();
  return raw === "public" ? "public" : "private";
}

export interface PutBlobResult {
  url: string;
  pathname: string;
  contentType: string;
  downloadUrl: string;
}

export async function putBlob(
  pathname: string,
  file: Blob & { size: number; type: string },
  token: string,
): Promise<PutBlobResult> {
  const params = new URLSearchParams({ pathname });
  const url = `${blobApiBase()}/?${params.toString()}`;
  const rid = requestIdFromToken(token);

  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      authorization: `Bearer ${token}`,
      "x-api-version": BLOB_API_VERSION,
      "x-api-blob-request-id": rid,
      "x-api-blob-request-attempt": "0",
      "x-vercel-blob-access": blobAccess(),
      "x-content-type": file.type || "application/octet-stream",
      "x-add-random-suffix": "1",
      "x-content-length": String(file.size),
    },
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      if (j?.error?.message) msg = j.error.message;
    } catch {
      const t = await res.text();
      if (t) msg = t.slice(0, 200);
    }
    throw new Error(msg);
  }

  return (await res.json()) as PutBlobResult;
}

export async function deleteBlobUrl(blobUrl: string, token: string): Promise<void> {
  const rid = requestIdFromToken(token);
  const res = await fetch(`${blobApiBase()}/delete`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-api-version": BLOB_API_VERSION,
      "x-api-blob-request-id": rid,
      "x-api-blob-request-attempt": "0",
    },
    body: JSON.stringify({ urls: [blobUrl] }),
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      if (j?.error?.message) msg = j.error.message;
    } catch {
      const t = await res.text();
      if (t) msg = t.slice(0, 200);
    }
    throw new Error(msg);
  }
}
