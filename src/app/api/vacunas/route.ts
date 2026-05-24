import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { Vacuna } from "@/models/vacuna";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export const GET = auth(async (_req: NextAuthRequest) => {
  if (!_req.auth?.user) {
    return unauthorized();
  }

  try {
    await connectMongo();
    const rows = await Vacuna.find()
      .sort({ nombre: 1 })
      .lean()
      .exec();

    const vacunas = rows.map((r) => {
      const id = r._id as { toString: () => string };
      return {
        id: id.toString(),
        nombre: r.nombre,
        descripcion: r.descripcion ?? "",
        createdAt: r.createdAt
          ? new Date(r.createdAt).toISOString()
          : null,
        updatedAt: r.updatedAt
          ? new Date(r.updatedAt).toISOString()
          : null,
      };
    });

    return NextResponse.json({ vacunas });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
