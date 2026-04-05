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
  access?: BlobAccess,
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
      "x-vercel-blob-access": access ?? blobAccess(),
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

export interface BlobItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  contentType: string;
}

interface ListBlobsResponse {
  blobs: BlobItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface BlobStorageStats {
  totalSize: number;   // bytes
  fileCount: number;
}

export async function getBlobStorageStats(token: string): Promise<BlobStorageStats> {
  let totalSize = 0;
  let fileCount = 0;
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ limit: "1000" });
    if (cursor) params.set("cursor", cursor);

    const rid = requestIdFromToken(token);
    const res = await fetch(`${blobApiBase()}/?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": BLOB_API_VERSION,
        "x-api-blob-request-id": rid,
        "x-api-blob-request-attempt": "0",
      },
    });

    if (!res.ok) {
      throw new Error(`Error listando blobs: ${res.status}`);
    }

    const data = (await res.json()) as ListBlobsResponse;
    for (const blob of data.blobs) {
      totalSize += blob.size;
      fileCount += 1;
    }
    cursor = data.cursor;
    if (!data.hasMore) break;
  } while (cursor);

  return { totalSize, fileCount };
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
