import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/mongodb";
import { requireUserToken } from "@/lib/admin-route-auth";
import { assertValidPassword, hashPassword } from "@/lib/admin-users";
import { User } from "@/models/user";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUserToken(request);
  if (!auth.ok && auth.error === "config") {
    return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
  }
  if (!auth.ok) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updates: { name?: string | null; passwordHash?: string } = {};

  // — Nombre —
  if ("name" in b) {
    const name = typeof b.name === "string" ? b.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
    }
    updates.name = name;
  }

  // — Contraseña —
  if ("newPassword" in b) {
    const currentPassword =
      typeof b.currentPassword === "string" ? b.currentPassword : "";
    const newPassword =
      typeof b.newPassword === "string" ? b.newPassword : "";

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Ingresá tu contraseña actual" },
        { status: 400 },
      );
    }

    try {
      assertValidPassword(newPassword);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Contraseña inválida" },
        { status: 400 },
      );
    }

    await connectMongo();
    const user = await User.findById(auth.userId).select("passwordHash").lean().exec() as
      | { passwordHash?: string }
      | null;

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 },
      );
    }

    updates.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  try {
    await connectMongo();
    const updated = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updates },
      { new: true, select: "name image role" },
    ).lean().exec() as { name?: string | null; image?: string | null } | null;

    if (!updated) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ name: updated.name ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
