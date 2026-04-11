/**
 * Normaliza un nombre propio a "Pascal/Title Case":
 *  - "JUAN PEREZ" → "Juan Perez"
 *  - "juan perez" → "Juan Perez"
 *  - "jUaN pErEz" → "jUaN pErEz" (respeta el caso si el usuario usó mixto)
 *
 * Sólo toca el string si está enteramente en mayúsculas o enteramente en
 * minúsculas (ignorando dígitos y signos). Preserva separadores como
 * espacios, guiones y apóstrofes capitalizando la letra posterior.
 *
 * Ej: "maría josé" → "María José", "o'connor" → "O'Connor",
 *     "JEAN-LUC" → "Jean-Luc".
 */
export function toPascalCase(input: string): string {
  if (!input) return "";
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  const letters = trimmed.replace(/[^\p{L}]/gu, "");
  if (!letters) return trimmed;

  const isAllUpper = letters === letters.toLocaleUpperCase();
  const isAllLower = letters === letters.toLocaleLowerCase();
  if (!isAllUpper && !isAllLower) return trimmed;

  const base = trimmed.toLocaleLowerCase();
  // Capitaliza la primera letra después de inicio / espacio / guion / apóstrofe.
  return base.replace(
    /(^|[\s\-'’])(\p{L})/gu,
    (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase(),
  );
}
