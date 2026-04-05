/** Rol de aplicación (persistido en `User.role`). */
export type AppRole = "user" | "admin" | "vet";

export function roleFromDb(r: string | undefined | null): AppRole {
  if (r === "admin") return "admin";
  if (r === "vet") return "vet";
  return "user";
}

export function isValidRole(r: unknown): r is AppRole {
  return r === "user" || r === "admin" || r === "vet";
}

/** Texto mostrado en el desplegable de consulta (nombre o DNI). */
export function vetDisplayName(u: {
  name?: string | null;
  dni: string | number;
}): string {
  const n = typeof u.name === "string" ? u.name.trim() : "";
  if (n) return n;
  return `DNI ${typeof u.dni === "string" ? u.dni : String(u.dni)}`;
}
