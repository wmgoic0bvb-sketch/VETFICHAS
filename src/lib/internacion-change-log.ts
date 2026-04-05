import type { DatosInternacion, OrdenTratamientoInternacion } from "@/types/patient";

const MAX_RESUMEN_INTERNACION = 1500;

function emptyDatosInternacion(): DatosInternacion {
  return {
    fechaIngreso: "",
    motivoIngreso: "",
    veterinarioResponsable: "",
    diagnosticoPrincipal: "",
    diagnosticoEditadoEn: undefined,
    ordenes: [],
    evoluciones: [],
  };
}

function snap(d: DatosInternacion | undefined): DatosInternacion {
  return d ?? emptyDatosInternacion();
}

function trunc(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t || "—";
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function formatEvoTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelOrden(o: OrdenTratamientoInternacion | undefined): string {
  const m = o?.medicamentoOProcedimiento?.trim();
  return trunc(m || "Plan de tratamiento", 48);
}

/**
 * Texto legible de qué cambió en internación (antes → después).
 * Solo se usa cuando el bloque `datosInternacion` del paciente difiere.
 */
export function describeDatosInternacionDiff(
  prev: DatosInternacion | undefined,
  next: DatosInternacion | undefined,
): string {
  const a = snap(prev);
  const b = snap(next);

  const lines: string[] = [];

  if (a.fechaIngreso !== b.fechaIngreso) {
    lines.push(
      `Fecha de ingreso: «${trunc(a.fechaIngreso, 24)}» → «${trunc(b.fechaIngreso, 24)}»`,
    );
  }

  const fa = a.fechaAlta ?? "";
  const fb = b.fechaAlta ?? "";
  if (fa !== fb) {
    lines.push(
      `Fecha de alta: ${fa ? trunc(fa, 40) : "—"} → ${fb ? trunc(fb, 40) : "—"}`,
    );
  }

  if (a.motivoIngreso !== b.motivoIngreso) {
    lines.push(
      `Motivo de ingreso: «${trunc(a.motivoIngreso, 50)}» → «${trunc(b.motivoIngreso, 50)}»`,
    );
  }

  if (a.veterinarioResponsable !== b.veterinarioResponsable) {
    lines.push(
      `Veterinario responsable: «${trunc(a.veterinarioResponsable, 40)}» → «${trunc(b.veterinarioResponsable, 40)}»`,
    );
  }

  if (a.diagnosticoPrincipal !== b.diagnosticoPrincipal) {
    lines.push(
      `Diagnóstico: «${trunc(a.diagnosticoPrincipal, 60)}» → «${trunc(b.diagnosticoPrincipal, 60)}»`,
    );
  }

  if (
    a.diagnosticoPrincipal === b.diagnosticoPrincipal &&
    (a.diagnosticoEditadoEn ?? "") !== (b.diagnosticoEditadoEn ?? "")
  ) {
    lines.push(
      `Marca de edición del diagnóstico: ${a.diagnosticoEditadoEn ? trunc(a.diagnosticoEditadoEn, 28) : "—"} → ${b.diagnosticoEditadoEn ? trunc(b.diagnosticoEditadoEn, 28) : "—"}`,
    );
  }

  const mapA = new Map(a.ordenes.map((o) => [o.id, o]));
  const mapB = new Map(b.ordenes.map((o) => [o.id, o]));
  const ordenIds = [...new Set([...mapA.keys(), ...mapB.keys()])].sort();

  for (const id of ordenIds) {
    const oa = mapA.get(id);
    const ob = mapB.get(id);

    if (oa && !ob) {
      lines.push(`Orden de plan eliminada: «${labelOrden(oa)}»`);
      continue;
    }
    if (!oa && ob) {
      lines.push(`Nueva orden de plan: «${labelOrden(ob)}»`);
      continue;
    }
    if (oa && ob) {
      if (oa.activa !== ob.activa) {
        lines.push(
          ob.activa
            ? `Plan de tratamiento «${labelOrden(ob)}»: de finalizada a activa`
            : `Plan de tratamiento «${labelOrden(ob)}»: de activa a finalizada`,
        );
      }

      if (oa.medicamentoOProcedimiento !== ob.medicamentoOProcedimiento) {
        lines.push(
          `Plan «${labelOrden(ob)}»: tratamiento «${trunc(oa.medicamentoOProcedimiento, 36)}» → «${trunc(ob.medicamentoOProcedimiento, 36)}»`,
        );
      }

      const ordFields: Array<[keyof OrdenTratamientoInternacion, string]> = [
        ["viaAdministracion", "Vía"],
        ["dosis", "Dosis"],
        ["frecuencia", "Frecuencia"],
        ["fechaInicio", "Inicio"],
        ["fechaFin", "Fin"],
      ];
      for (const [key, lab] of ordFields) {
        const va = String(oa[key] ?? "");
        const vb = String(ob[key] ?? "");
        if (va !== vb) {
          lines.push(
            `Plan «${labelOrden(ob)}»: ${lab.toLowerCase()} «${trunc(va, 28)}» → «${trunc(vb, 28)}»`,
          );
        }
      }
    }
  }

  const evoA = new Map(a.evoluciones.map((e) => [e.id, e]));
  const evoB = new Map(b.evoluciones.map((e) => [e.id, e]));

  for (const ev of b.evoluciones) {
    if (!evoA.has(ev.id)) {
      lines.push(`Nueva evolución (${formatEvoTime(ev.fechaHora)})`);
    }
  }

  for (const ev of a.evoluciones) {
    if (!evoB.has(ev.id)) {
      lines.push(`Evolución eliminada (${formatEvoTime(ev.fechaHora)})`);
    }
  }

  let out = lines.join("; ");
  if (out.length > MAX_RESUMEN_INTERNACION) {
    out = `${out.slice(0, MAX_RESUMEN_INTERNACION - 1)}…`;
  }
  return out;
}
