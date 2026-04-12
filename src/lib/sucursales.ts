import type { SucursalPaciente } from "@/types/patient";

/** Sucursal de la clínica (datos fijos en código; coordenadas reservadas para uso futuro). */
export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  /** `[lat, lng]` cuando esté definido; por ahora vacío. */
  coordenadas: readonly [number, number] | null;
}

export const SUCURSALES: readonly Sucursal[] = [
  {
    id: "roca-1844",
    nombre: "Av. Roca 1844",
    direccion: "",
    coordenadas: null,
  },
  {
    id: "villegas-287",
    nombre: "Villegas 287",
    direccion: "",
    coordenadas: null,
  },
  {
    id: "mitre-1344",
    nombre: "Mitre 1344",
    direccion: "",
    coordenadas: null,
  },
];

export function getSucursalById(id: string): Sucursal | undefined {
  return SUCURSALES.find((s) => s.id === id);
}

/** Alinea `patient.sucursal` (enum ficha) con el id usado en próximos controles / filtro calendario. */
const SUCURSAL_CALENDARIO_ID_A_PACIENTE: Record<string, SucursalPaciente> = {
  "roca-1844": "AVENIDA",
  "villegas-287": "VILLEGAS",
  "mitre-1344": "MITRE",
};

export function pacienteVisibleEnFiltroCalendario(
  pacienteSucursal: SucursalPaciente | null | undefined,
  filtroSucursalId: string | null,
): boolean {
  if (!filtroSucursalId) return true;
  const esperado = SUCURSAL_CALENDARIO_ID_A_PACIENTE[filtroSucursalId];
  if (!esperado) return true;
  return pacienteSucursal === esperado;
}

export const DEFAULT_SUCURSAL_ID = SUCURSALES[0]?.id ?? "roca-1844";
