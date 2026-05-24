import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { parseVacunaCreate } from "@/lib/vacunas";
import { Vacuna } from "@/models/vacuna";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export const POST = auth(async (req: NextAuthRequest) => {
  if (req.auth?.user?.role !== "admin") {
    return forbidden();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseVacunaCreate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await connectMongo();
    const doc = await Vacuna.create(parsed.value);
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
});
