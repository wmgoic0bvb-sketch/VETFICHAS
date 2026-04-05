import bcrypt from "bcryptjs";

export type { AppRole } from "./user-role";
export { isValidRole, roleFromDb, vetDisplayName } from "./user-role";

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
