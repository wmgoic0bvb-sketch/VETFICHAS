import type { DueñoContacto } from "@/types/patient";

/** Umbral de similitud a partir del cual dos strings se consideran "iguales". */
export const UMBRAL_SIMILITUD = 0.85;

/** Normaliza un nombre para comparación: lowercase, sin diacríticos, espacios colapsados. */
export function normalizarNombre(s: string): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Distancia de Levenshtein iterativa (O(n·m) memoria O(min(n,m))). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // inserción
        prev[j] + 1, // eliminación
        prev[j - 1] + cost, // sustitución
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Ratio de similitud 0..1 basado en Levenshtein normalizado. Compara strings ya normalizados. */
export function similitud(a: string, b: string): number {
  const na = normalizarNombre(a);
  const nb = normalizarNombre(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  const max = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return 1 - dist / max;
}

/** Candidato mínimo para comparar contra un draft. */
export interface CandidatoPaciente {
  id: string;
  nombre: string;
  dueños: [DueñoContacto, DueñoContacto] | DueñoContacto[];
  estado?: "activo" | "archivado";
}

export interface DraftParaComparar {
  nombre: string;
  dueños: DueñoContacto[];
}

export interface PacienteSimilar {
  id: string;
  nombre: string;
  dueños: DueñoContacto[];
  estado?: "activo" | "archivado";
  scoreNombre: number;
  scoreDueño: number;
}

/**
 * Busca pacientes similares al draft: coincide si el nombre de la mascota Y
 * al menos un dueño del draft se parecen a los del candidato (ambos por encima del umbral).
 */
export function buscarPacientesSimilares(
  draft: DraftParaComparar,
  candidatos: CandidatoPaciente[],
): PacienteSimilar[] {
  const nombreDraft = normalizarNombre(draft.nombre);
  if (!nombreDraft) return [];

  const nombresDueñosDraft = draft.dueños
    .map((d) => normalizarNombre(d?.nombre ?? ""))
    .filter((s) => s.length > 0);
  if (nombresDueñosDraft.length === 0) return [];

  const matches: PacienteSimilar[] = [];

  for (const c of candidatos) {
    const scoreNombre = similitud(nombreDraft, c.nombre);
    if (scoreNombre < UMBRAL_SIMILITUD) continue;

    const nombresDueñosCand = (c.dueños ?? [])
      .map((d) => normalizarNombre(d?.nombre ?? ""))
      .filter((s) => s.length > 0);
    if (nombresDueñosCand.length === 0) continue;

    let mejorDueño = 0;
    for (const nd of nombresDueñosDraft) {
      for (const nc of nombresDueñosCand) {
        const s = similitud(nd, nc);
        if (s > mejorDueño) mejorDueño = s;
      }
    }
    if (mejorDueño < UMBRAL_SIMILITUD) continue;

    matches.push({
      id: c.id,
      nombre: c.nombre,
      dueños: Array.from(c.dueños ?? []),
      estado: c.estado,
      scoreNombre,
      scoreDueño: mejorDueño,
    });
  }

  // Ordenar por score combinado descendente (más parecido primero).
  matches.sort(
    (a, b) =>
      b.scoreNombre + b.scoreDueño - (a.scoreNombre + a.scoreDueño),
  );
  return matches;
}
