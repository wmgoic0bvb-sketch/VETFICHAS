import bcrypt from "bcryptjs";

export function normalizeDniForStorage(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    throw new Error("DNI inválido");
  }
  return digits;
}

export function assertValidPassword(password: string): void {
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function isValidRole(
  r: unknown,
): r is "user" | "admin" {
  return r === "user" || r === "admin";
}
