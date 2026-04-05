import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import {
  assertValidPassword,
  hashPassword,
  isValidRole,
  normalizeDniForStorage,
  roleFromDb,
} from "@/lib/admin-users";
import type { Types } from "mongoose";
import { User } from "@/models/user";

type UserListLean = {
  _id: Types.ObjectId;
  dni: string | number;
  name?: string | null;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export const GET = auth(async (req: NextAuthRequest) => {
  if (req.auth?.user?.role !== "admin") {
    return forbidden();
  }

  try {
    await connectMongo();
    const roleFilter = req.nextUrl.searchParams.get("role");
    const query =
      roleFilter === "vet" ? { role: "vet" as const } : {};

    const rows = (await User.find(query)
      .select("dni name role createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as unknown as UserListLean[];

    const users = rows.map((u) => ({
      id: u._id.toString(),
      dni: typeof u.dni === "string" ? u.dni : String(u.dni),
      name: u.name ?? null,
      role: roleFromDb(u.role),
      createdAt: u.createdAt?.toISOString() ?? null,
      updatedAt: u.updatedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});

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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const dniRaw = typeof b.dni === "string" ? b.dni : "";
  const password = typeof b.password === "string" ? b.password : "";
  const name =
    typeof b.name === "string" ? b.name.trim() || undefined : undefined;
  const roleIn = b.role;

  let dniStored: string;
  try {
    dniStored = normalizeDniForStorage(dniRaw);
  } catch {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 });
  }

  try {
    assertValidPassword(password);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Contraseña inválida" },
      { status: 400 },
    );
  }

  const role = isValidRole(roleIn) ? roleIn : "user";

  try {
    await connectMongo();
    const passwordHash = await hashPassword(password);
    const doc = await User.create({
      dni: dniStored,
      passwordHash,
      name,
      role,
    });

    return NextResponse.json({
      user: {
        id: doc._id.toString(),
        dni: String(doc.dni),
        name: doc.name ?? null,
        role: roleFromDb(doc.role),
        createdAt: doc.createdAt?.toISOString() ?? null,
        updatedAt: doc.updatedAt?.toISOString() ?? null,
      },
    });
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code?: number }).code : undefined;
    if (code === 11000) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese DNI" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
});
