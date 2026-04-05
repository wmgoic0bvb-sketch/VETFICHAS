import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/user";

/**
 * Solo en desarrollo: comprueba URI + conexión y cuántos documentos hay en `users`.
 * Requiere sesión iniciada. Usamos el wrapper `auth((req) => …)` para que la cookie
 * se lea del request (en algunos entornos `await auth()` sin request no ve la sesión).
 */
export const GET = auth(async (req: NextAuthRequest) => {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!req.auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mongoose = await connectMongo();
    const dbName = mongoose.connection.db?.databaseName ?? "unknown";
    const count = await User.countDocuments();
    const one = (await User.findOne()
      .select("dni name")
      .lean()
      .exec()) as { dni: string; name?: string | null } | null;

    return NextResponse.json({
      ok: true,
      databaseName: dbName,
      usersCollectionCount: count,
      sampleUser: one
        ? { dni: one.dni, name: one.name ?? null }
        : null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
});
