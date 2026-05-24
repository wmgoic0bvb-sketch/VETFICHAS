/** Normaliza `createdAt` / `updatedAt` de Mongoose a ISO 8601 para el cliente. */
export function isoFromMongoTimestamp(v: unknown): string | undefined {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? t : d.toISOString();
  }
  return undefined;
}
