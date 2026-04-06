import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import mongoose from "mongoose";
import { getBlobStorageStats } from "@/lib/vercel-blob-api";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export const GET = auth(async (req: NextAuthRequest) => {
  if (req.auth?.user?.role !== "admin") {
    return forbidden();
  }

  const [blobResult, mongoResult] = await Promise.allSettled([
    (async () => {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) throw new Error("Falta BLOB_READ_WRITE_TOKEN");
      return getBlobStorageStats(token);
    })(),
    (async () => {
      await connectMongo();
      const db = mongoose.connection.db;
      if (!db) throw new Error("No hay conexión a MongoDB");
      const stats = await db.command({ dbStats: 1 });
      return {
        dataSize: stats.dataSize as number,
        storageSize: stats.storageSize as number,
        totalSize: (stats.totalSize ?? stats.storageSize) as number,
        collections: stats.collections as number,
        objects: stats.objects as number,
        avgObjSize: stats.avgObjSize as number | undefined,
        indexSize: stats.indexSize as number,
      };
    })(),
  ]);

  return NextResponse.json({
    blob:
      blobResult.status === "fulfilled"
        ? { ok: true, ...blobResult.value }
        : { ok: false, error: blobResult.reason instanceof Error ? blobResult.reason.message : String(blobResult.reason) },
    mongo:
      mongoResult.status === "fulfilled"
        ? { ok: true, ...mongoResult.value }
        : { ok: false, error: mongoResult.reason instanceof Error ? mongoResult.reason.message : String(mongoResult.reason) },
  });
});
