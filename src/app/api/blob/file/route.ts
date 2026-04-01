import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isAllowedBlobUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta token de Blob" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const blobUrl = requestUrl.searchParams.get("url")?.trim() ?? "";
  if (!blobUrl || !isAllowedBlobUrl(blobUrl)) {
    return NextResponse.json({ error: "URL de blob inválida" }, { status: 400 });
  }

  const upstream = await fetch(blobUrl, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `No se pudo leer el archivo (${upstream.status})` },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const cd = upstream.headers.get("content-disposition");
  if (cd) headers.set("content-disposition", cd);
  headers.set("cache-control", "private, no-store");

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
