import { describe, it, expect } from "vitest";
import {
  consultaFechaNormalizada,
  pacientesActividadDelDia,
} from "./calendario-paciente-actividad";
import type { Paciente } from "@/types/patient";

function basePaciente(over: Partial<Paciente>): Paciente {
  return {
    id: "1",
    especie: "Perro",
    nombre: "Firulais",
    raza: "",
    sexo: "",
    fnac: "",
    castrado: "",
    color: "",
    dueños: [{ nombre: "", tel: "" }, { nombre: "", tel: "" }],
    dir: "",
    estado: "activo",
    esExterno: false,
    esUnicaConsulta: false,
    internado: false,
    proximosControles: [],
    consultas: [],
    estudios: [],
    sucursal: "AVENIDA",
    ...over,
  };
}

describe("consultaFechaNormalizada", () => {
  it("acepta ISO yyyy-mm-dd", () => {
    expect(consultaFechaNormalizada("2026-04-07")).toBe("2026-04-07");
  });

  it("toma prefijo de ISO con hora", () => {
    expect(consultaFechaNormalizada("2026-04-07T12:00:00Z")).toBe("2026-04-07");
  });

  it("convierte DD/MM/AAAA", () => {
    expect(consultaFechaNormalizada("7/04/2026")).toBe("2026-04-07");
  });
});

describe("pacientesActividadDelDia", () => {
  const dia = new Date(2026, 3, 7);

  it("incluye alta cuando createdAt cae ese día local", () => {
    const localMid = new Date(2026, 3, 7, 10, 0, 0);
    const p = basePaciente({
      nombre: "A",
      createdAt: localMid.toISOString(),
      consultas: [],
    });
    const r = pacientesActividadDelDia([p], dia, null);
    expect(r).toHaveLength(1);
    expect(r[0]!.motivos).toContain("alta");
  });

  it("incluye consulta cuando fecha coincide", () => {
    const p = basePaciente({
      nombre: "B",
      consultas: [
        {
          id: "c1",
          motivo: "",
          veterinario: "",
          tipo: "Consulta",
          fecha: "2026-04-07",
          peso: "",
          temp: "",
          diag: "",
          trat: "",
          meds: "",
        },
      ],
    });
    const r = pacientesActividadDelDia([p], dia, null);
    expect(r).toHaveLength(1);
    expect(r[0]!.motivos).toContain("consulta");
    expect(r[0]!.consultasEseDia).toHaveLength(1);
  });

  it("respeta filtro de sucursal", () => {
    const p = basePaciente({
      nombre: "C",
      sucursal: "MITRE",
      consultas: [
        {
          id: "c1",
          motivo: "",
          veterinario: "",
          tipo: "Consulta",
          fecha: "2026-04-07",
          peso: "",
          temp: "",
          diag: "",
          trat: "",
          meds: "",
        },
      ],
    });
    expect(pacientesActividadDelDia([p], dia, "roca-1844")).toHaveLength(0);
    expect(pacientesActividadDelDia([p], dia, "mitre-1344")).toHaveLength(1);
  });
});
