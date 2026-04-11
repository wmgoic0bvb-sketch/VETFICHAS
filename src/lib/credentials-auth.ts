import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import type { User } from "next-auth";
import { connectMongo } from "@/lib/mongodb";
import { roleFromDb } from "@/lib/user-role";
import { User as UserModel } from "@/models/user";

type UserLean = {
  _id: Types.ObjectId;
  dni: string | number;
  passwordHash?: string;
  name?: string | null;
  imageData?: string | null;
  role?: string | null;
  sucursal?: string | null;
};

function digitsOnlyDni(input: string): string {
  return input.replace(/\D/g, "");
}

export async function authorizeWithDniPassword(
  credentials: Partial<Record<"dni" | "password", unknown>>,
): Promise<User | null> {
  const dniRaw =
    typeof credentials.dni === "string" ? credentials.dni.trim() : "";
  const password =
    typeof credentials.password === "string" ? credentials.password : "";

  if (!dniRaw || !password) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth] faltan dni o contraseña en el cuerpo del login");
    }
    return null;
  }

  const digits = digitsOnlyDni(dniRaw);
  if (!digits) {
    return null;
  }

  let mongoose: Awaited<ReturnType<typeof connectMongo>>;
  try {
    mongoose = await connectMongo();
  } catch (e) {
    console.error("[auth] no se pudo conectar a MongoDB:", e);
    return null;
  }

  const or: Array<Record<string, string | number>> = [
    { dni: dniRaw },
    { dni: digits },
  ];
  const asNum = Number(digits);
  if (
    !Number.isNaN(asNum) &&
    String(asNum) === digits &&
    digits.length <= 16
  ) {
    or.push({ dni: asNum });
  }

  let raw;
  try {
    raw = await UserModel.findOne({ $or: or }).lean().exec();
  } catch (e) {
    console.error("[auth] error al buscar usuario:", e);
    return null;
  }

  const doc = raw as UserLean | null;
  if (!doc) {
    if (process.env.NODE_ENV === "development") {
      const dbName = mongoose.connection.db?.databaseName;
      console.warn(
        "[auth] no hay usuario con ese DNI en la colección users.",
        "Base de datos conectada:",
        dbName ?? "(desconocida)",
        "| En Atlas tu documento está en: vetfichas-db → users.",
        "Si no coinciden, en .env.local poné STORAGE_MONGODB_DB=vetfichas-db o corregí la URI (…mongodb.net/vetfichas-db?…).",
        { digits },
      );
    }
    return null;
  }

  if (!doc.passwordHash) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[auth] el documento no tiene el campo passwordHash (revisá Atlas)",
      );
    }
    return null;
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(password, doc.passwordHash);
  } catch (e) {
    console.error("[auth] hash de contraseña inválido o error bcrypt:", e);
    return null;
  }

  if (!ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth] contraseña incorrecta");
    }
    return null;
  }

  const dniOut =
    typeof doc.dni === "string" ? doc.dni : String(doc.dni);

  const role = roleFromDb(doc.role ?? undefined);

  const userId = doc._id.toString();
  const sucursal =
    doc.sucursal === "AVENIDA" || doc.sucursal === "VILLEGAS" || doc.sucursal === "MITRE"
      ? doc.sucursal
      : null;

  return {
    id: userId,
    dni: dniOut,
    name: doc.name ?? undefined,
    image: doc.imageData ? `/api/users/${userId}/avatar` : undefined,
    role,
    sucursal,
  };
}
