import { describe, it, expect } from "vitest";
import type { DueñoContacto } from "@/types/patient";
import {
  buscarPacientesSimilares,
  normalizarNombre,
  similitud,
  UMBRAL_SIMILITUD,
} from "./patient-similarity";

function due(nombre: string, tel = ""): DueñoContacto {
  return { nombre, tel };
}

function cand(
  id: string,
  nombre: string,
  d1: string,
  d2 = "",
  estado: "activo" | "archivado" = "activo",
) {
  return { id, nombre, dueños: [due(d1), due(d2)], estado };
}

describe("normalizarNombre", () => {
  it("lowercase, trim, colapsa espacios, quita acentos", () => {
    expect(normalizarNombre("  Franco   Martínez  ")).toBe("franco martinez");
  });
  it("preserva ñ", () => {
    expect(normalizarNombre("Muñoz")).toBe("muñoz");
  });
});

describe("similitud", () => {
  it("strings iguales (ignorando caso/acentos) = 1", () => {
    expect(similitud("Kira", "kira")).toBe(1);
    expect(similitud("Martínez", "martinez")).toBe(1);
  });
  it("totalmente distintos ~ 0", () => {
    expect(similitud("Kira", "Luna")).toBeLessThan(UMBRAL_SIMILITUD);
  });
  it("typo leve >= umbral", () => {
    expect(
      similitud("Francoo Martinez", "Franco Martinez"),
    ).toBeGreaterThanOrEqual(UMBRAL_SIMILITUD);
  });
});

describe("buscarPacientesSimilares", () => {
  const draft = {
    nombre: "Kira",
    dueños: [due("Franco Martinez"), due("")],
  };

  it("detecta duplicado exacto (case-insensitive)", () => {
    const res = buscarPacientesSimilares(draft, [
      cand("1", "kira", "franco martinez"),
    ]);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("1");
  });

  it("detecta duplicado ignorando acentos y mayúsculas", () => {
    const res = buscarPacientesSimilares(
      { nombre: "KIRA", dueños: [due("Franco Martinez")] },
      [cand("1", "kira", "franco martínez")],
    );
    expect(res).toHaveLength(1);
  });

  it("NO es duplicado: mismo nombre mascota, dueño distinto", () => {
    const res = buscarPacientesSimilares(
      { nombre: "Kira", dueños: [due("Franco")] },
      [cand("1", "Kira", "Juan")],
    );
    expect(res).toHaveLength(0);
  });

  it("NO es duplicado: mismo dueño, mascota distinta", () => {
    const res = buscarPacientesSimilares(
      { nombre: "Kira", dueños: [due("Franco")] },
      [cand("1", "Luna", "Franco")],
    );
    expect(res).toHaveLength(0);
  });

  it("detecta duplicado con typo leve en nombre de dueño", () => {
    const res = buscarPacientesSimilares(
      { nombre: "Kira", dueños: [due("Francoo Martínez")] },
      [cand("1", "Kira", "Franco Martinez")],
    );
    expect(res).toHaveLength(1);
  });

  it("coincide contra dueños[1] del candidato, no solo [0]", () => {
    const res = buscarPacientesSimilares(
      { nombre: "Kira", dueños: [due("Franco Martinez")] },
      [cand("1", "Kira", "Otro Responsable", "Franco Martinez")],
    );
    expect(res).toHaveLength(1);
  });

  it("coincide contra dueños[1] del draft", () => {
    const res = buscarPacientesSimilares(
      { nombre: "Kira", dueños: [due(""), due("Franco Martinez")] },
      [cand("1", "Kira", "Franco Martinez")],
    );
    expect(res).toHaveLength(1);
  });

  it("sin dueños en el draft no devuelve matches", () => {
    const res = buscarPacientesSimilares(
      { nombre: "Kira", dueños: [due(""), due("")] },
      [cand("1", "Kira", "Franco")],
    );
    expect(res).toHaveLength(0);
  });

  it("incluye pacientes archivados", () => {
    const res = buscarPacientesSimilares(draft, [
      cand("1", "kira", "franco martinez", "", "archivado"),
    ]);
    expect(res).toHaveLength(1);
    expect(res[0].estado).toBe("archivado");
  });

  it("ordena por score descendente", () => {
    const res = buscarPacientesSimilares(draft, [
      cand("1", "Kiraa", "Franco Martinezz"),
      cand("2", "Kira", "Franco Martinez"),
    ]);
    expect(res[0].id).toBe("2");
  });
});
