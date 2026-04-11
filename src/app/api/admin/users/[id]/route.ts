import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { requireAdminToken } from "@/lib/admin-route-auth";
import {
  assertValidPassword,
  hashPassword,
  isValidRole,
  roleFromDb,
  type AppRole,
} from "@/lib/admin-users";
import { User } from "@/models/user";
import mongoose from "mongoose";

type Ctx = { params: { id: string } };

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await requireAdminToken(request);
  if (!auth.ok && auth.error === "config") {
    return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

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
  const name =
    b.name === null
      ? ""
      : typeof b.name === "string"
        ? b.name.trim()
        : undefined;
  const password = typeof b.password === "string" ? b.password : undefined;
  const roleIn = b.role;

  const SUCURSALES = ["AVENIDA", "VILLEGAS", "MITRE"] as const;
  type Sucursal = (typeof SUCURSALES)[number];

  const sucursalIn = b.sucursal;
  const sucursal: Sucursal | null | undefined =
    sucursalIn === null
      ? null
      : SUCURSALES.includes(sucursalIn as Sucursal)
        ? (sucursalIn as Sucursal)
        : undefined;

  const updates: {
    name?: string | null;
    passwordHash?: string;
    role?: AppRole;
    sucursal?: Sucursal | null;
  } = {};

  if (name !== undefined) {
    updates.name = name === "" ? null : name;
  }

  if (password !== undefined && password !== "") {
    try {
      assertValidPassword(password);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Contraseña inválida" },
        { status: 400 },
      );
    }
    updates.passwordHash = await hashPassword(password);
  }

  if (roleIn !== undefined) {
    if (!isValidRole(roleIn)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    updates.role = roleIn;
  }

  if (sucursal !== undefined) {
    updates.sucursal = sucursal;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  try {
    await connectMongo();
    const sessionUserId = auth.userId;
    const target = await User.findById(id).exec();
    if (!target) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    if (
      updates.role !== undefined &&
      target.role === "admin" &&
      updates.role !== "admin"
    ) {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Debe haber al menos un administrador" },
          { status: 400 },
        );
      }
      if (id === sessionUserId) {
        return NextResponse.json(
          { error: "No podés quitarte el rol de administrador a vos mismo" },
          { status: 400 },
        );
      }
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: false },
    ).exec();

    if (!updated) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updated._id.toString(),
        dni: typeof updated.dni === "string" ? updated.dni : String(updated.dni),
        name: updated.name ?? null,
        role: roleFromDb(updated.role),
        sucursal: (updated.sucursal as Sucursal | null) ?? null,
        createdAt: updated.createdAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const auth = await requireAdminToken(request);
  if (!auth.ok && auth.error === "config") {
    return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await connectMongo();
    const sessionUserId = auth.userId;

    if (id === sessionUserId) {
      return NextResponse.json(
        { error: "No podés eliminar tu propio usuario" },
        { status: 400 },
      );
    }

    const target = await User.findById(id).exec();
    if (!target) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    if (target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede eliminar el único administrador" },
          { status: 400 },
        );
      }
    }

    await User.findByIdAndDelete(id).exec();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
