import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import type { User } from "next-auth";
import { connectMongo } from "@/lib/mongodb";
import { User as UserModel } from "@/models/user";

type UserLean = {
  _id: Types.ObjectId;
  dni: string;
  passwordHash: string;
  name?: string | null;
};

export async function authorizeWithDniPassword(
  credentials: Partial<Record<"dni" | "password", unknown>>,
): Promise<User | null> {
  const dni =
    typeof credentials.dni === "string" ? credentials.dni.trim() : "";
  const password =
    typeof credentials.password === "string" ? credentials.password : "";
  if (!dni || !password) return null;

  await connectMongo();
  const raw = await UserModel.findOne({ dni }).lean().exec();
  const doc = raw as UserLean | null;
  if (!doc?.passwordHash) return null;

  const ok = await bcrypt.compare(password, doc.passwordHash);
  if (!ok) return null;

  return {
    id: doc._id.toString(),
    dni: doc.dni,
    name: doc.name ?? undefined,
  };
}
