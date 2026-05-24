export const MAX_NOMBRE_LEN = 160;
export const MAX_DESCRIPCION_LEN = 4000;

export type VacunaCreateInput = {
  nombre: string;
  descripcion: string;
};

export type VacunaPatchInput = Partial<{
  nombre: string;
  descripcion: string;
}>;

function trimNombre(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function parseVacunaCreate(
  body: unknown,
):
  | { ok: true; value: VacunaCreateInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const b = body as Record<string, unknown>;
  const nombreRaw = typeof b.nombre === "string" ? b.nombre : "";
  const nombre = trimNombre(nombreRaw);
  if (!nombre) {
    return { ok: false, error: "El nombre es obligatorio" };
  }
  if (nombre.length > MAX_NOMBRE_LEN) {
    return {
      ok: false,
      error: `El nombre no puede superar ${MAX_NOMBRE_LEN} caracteres`,
    };
  }

  const descRaw =
    b.descripcion === undefined || b.descripcion === null
      ? ""
      : typeof b.descripcion === "string"
        ? b.descripcion
        : null;
  if (descRaw === null) {
    return { ok: false, error: "La descripción debe ser texto" };
  }
  const descripcion = descRaw.trim();
  if (descripcion.length > MAX_DESCRIPCION_LEN) {
    return {
      ok: false,
      error: `La descripción no puede superar ${MAX_DESCRIPCION_LEN} caracteres`,
    };
  }

  return { ok: true, value: { nombre, descripcion } };
}

export function parseVacunaPatch(
  body: unknown,
):
  | { ok: true; value: VacunaPatchInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const b = body as Record<string, unknown>;
  const out: VacunaPatchInput = {};

  if (b.nombre !== undefined) {
    if (typeof b.nombre !== "string") {
      return { ok: false, error: "El nombre debe ser texto" };
    }
    const nombre = trimNombre(b.nombre);
    if (!nombre) {
      return { ok: false, error: "El nombre no puede quedar vacío" };
    }
    if (nombre.length > MAX_NOMBRE_LEN) {
      return {
        ok: false,
        error: `El nombre no puede superar ${MAX_NOMBRE_LEN} caracteres`,
      };
    }
    out.nombre = nombre;
  }

  if (b.descripcion !== undefined) {
    if (b.descripcion === null) {
      out.descripcion = "";
    } else if (typeof b.descripcion === "string") {
      const descripcion = b.descripcion.trim();
      if (descripcion.length > MAX_DESCRIPCION_LEN) {
        return {
          ok: false,
          error: `La descripción no puede superar ${MAX_DESCRIPCION_LEN} caracteres`,
        };
      }
      out.descripcion = descripcion;
    } else {
      return { ok: false, error: "La descripción debe ser texto" };
    }
  }

  if (Object.keys(out).length === 0) {
    return { ok: false, error: "Nada para actualizar" };
  }

  return { ok: true, value: out };
}

/** Separador en `Consulta.motivo` para varias vacunas en un mismo evento. */
export const VACUNAS_MOTIVO_SEP = " · ";

/**
 * Interpreta el texto guardado en `motivo` según el orden del catálogo cargado.
 */
export function parseVacunasMotivoTokens(
  motivo: string,
  opcionesOrdenadas: string[],
): string[] {
  if (!motivo.trim() || opcionesOrdenadas.length === 0) return [];
  const set = new Set(opcionesOrdenadas);
  const tokens = motivo
    .split(/ · |, |;/)
    .map((t) => t.trim())
    .filter(Boolean);
  const picked = tokens.filter((t) => set.has(t));
  return opcionesOrdenadas.filter((o) => picked.includes(o));
}

export function joinVacunasMotivo(
  selected: string[],
  opcionesOrdenadas: string[],
): string {
  return opcionesOrdenadas
    .filter((o) => selected.includes(o))
    .join(VACUNAS_MOTIVO_SEP);
}
