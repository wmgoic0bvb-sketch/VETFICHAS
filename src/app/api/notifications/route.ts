import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { StaffNotification } from "@/models/staff-notification";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export const GET = auth(async (req: NextAuthRequest) => {
  if (!req.auth?.user?.id) return unauthorized();

  try {
    await connectMongo();
    const userOid = new mongoose.Types.ObjectId(req.auth.user.id);
    const [items, unreadCount] = await Promise.all([
      StaffNotification.find({ userId: userOid })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean()
        .exec(),
      StaffNotification.countDocuments({
        userId: userOid,
        readAt: null,
      }).exec(),
    ]);

    const out = items.map((d) => ({
      id: String(d._id),
      kind: d.kind,
      read: d.readAt != null,
      createdAt:
        d.createdAt instanceof Date
          ? d.createdAt.toISOString()
          : new Date().toISOString(),
      patientId: d.patientId,
      patientNombre: d.patientNombre,
      estudioId: d.estudioId,
      estudioCategoria: d.estudioCategoria,
      titulo: d.titulo,
      uploadedByName: d.uploadedByName,
    }));

    return NextResponse.json({ items: out, unreadCount });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});

export const PATCH = auth(async (req: NextAuthRequest) => {
  if (!req.auth?.user?.id) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  try {
    await connectMongo();
    const userOid = new mongoose.Types.ObjectId(req.auth.user.id);
    const now = new Date();

    if (b.markAllRead === true) {
      await StaffNotification.updateMany(
        { userId: userOid, readAt: null },
        { $set: { readAt: now } },
      ).exec();
      return NextResponse.json({ ok: true });
    }

    const id = typeof b.id === "string" ? b.id.trim() : "";
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    const res = await StaffNotification.updateOne(
      { _id: new mongoose.Types.ObjectId(id), userId: userOid },
      { $set: { readAt: now } },
    ).exec();

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
