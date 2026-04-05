import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: "config" | "forbidden" };

export type UserAuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: "config" | "forbidden" };

export async function requireUserToken(
  request: NextRequest,
): Promise<UserAuthResult> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return { ok: false, error: "config" };
  const token = await getToken({
    req: request,
    secret,
    secureCookie: request.nextUrl.protocol === "https:",
  });
  if (!token) return { ok: false, error: "forbidden" };
  const userId = (token as { id?: string }).id ?? token.sub ?? "";
  if (!userId) return { ok: false, error: "forbidden" };
  return { ok: true, userId };
}

export async function requireAdminToken(
  request: NextRequest,
): Promise<AdminAuthResult> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return { ok: false, error: "config" };
  }
  const token = await getToken({
    req: request,
    secret,
    secureCookie: request.nextUrl.protocol === "https:",
  });
  if (!token || (token as { role?: string }).role !== "admin") {
    return { ok: false, error: "forbidden" };
  }
  const userId = (token as { id?: string }).id ?? token.sub ?? "";
  return { ok: true, userId };
}
