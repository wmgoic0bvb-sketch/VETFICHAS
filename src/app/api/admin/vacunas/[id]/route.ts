import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { parseVacunaPatch } from "@/lib/vacunas";
import { Vacuna } from "@/models/vacuna";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

async function paramId(ctx: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

export const PATCH = auth(
  async (
    req: NextAuthRequest,
    context: { params: Promise<{ id: string }> | { id: string } },
  ) => {
  if (req.auth?.user?.role !== "admin") {
    return forbidden();
  }

  const id = await paramId(context);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseVacunaPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await connectMongo();
    const doc = await Vacuna.findByIdAndUpdate(
      id,
      { $set: parsed.value },
      { new: true, runValidators: true },
    ).exec();

    if (!doc) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      vacuna: {
        id: doc._id.toString(),
        nombre: doc.nombre,
        descripcion: doc.descripcion ?? "",
        createdAt: doc.createdAt?.toISOString() ?? null,
        updatedAt: doc.updatedAt?.toISOString() ?? null,
      },
    });
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code?: number }).code
        : undefined;
    if (code === 11000) {
      return NextResponse.json(
        { error: "Ya existe una vacuna con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
  },
);

export const DELETE = auth(
  async (
    _req: NextAuthRequest,
    context: { params: Promise<{ id: string }> | { id: string } },
  ) => {
  if (_req.auth?.user?.role !== "admin") {
    return forbidden();
  }

  const id = await paramId(context);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await connectMongo();
    const res = await Vacuna.findByIdAndDelete(id).exec();
    if (!res) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
  },
);
