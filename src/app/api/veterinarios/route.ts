import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { vetDisplayName } from "@/lib/user-role";
import { User } from "@/models/user";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

/** Veterinarios = usuarios con rol `vet` (mismo acceso que `user`). */
export const GET = auth(async (_req: NextAuthRequest) => {
  if (!_req.auth?.user) {
    return unauthorized();
  }

  try {
    await connectMongo();
    const rows = await User.find({ role: "vet" })
      .select("name dni")
      .sort({ name: 1, dni: 1 })
      .lean()
      .exec();

    const veterinarios = rows.map((r) => {
      const id = r._id as { toString: () => string };
      const dni = typeof r.dni === "string" ? r.dni : String(r.dni);
      return {
        id: id.toString(),
        nombre: vetDisplayName({ name: r.name, dni }),
      };
    });

    return NextResponse.json({ veterinarios });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
