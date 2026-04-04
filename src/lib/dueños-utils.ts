import type { DueñoContacto, Paciente } from "@/types/patient";

export function parDueñosVacío(): [DueñoContacto, DueñoContacto] {
  return [
    { nombre: "", tel: "" },
    { nombre: "", tel: "" },
  ];
}

/** Texto compacto para tarjetas (ej. dos nombres unidos). */
export function formatDueñosCorto(d: [DueñoContacto, DueñoContacto]): string {
  const [a, b] = d;
  const n1 = a.nombre.trim();
  const n2 = b.nombre.trim();
  if (n1 && n2) return `${n1} · ${n2}`;
  return n1 || n2 || "—";
}

/** Cadena para buscar en dashboard (nombres y teléfonos). */
export function dueñosParaBusqueda(p: Paciente): string {
  const [a, b] = p.dueños;
  return [a.nombre, a.tel, b.nombre, b.tel].join(" ");
}
