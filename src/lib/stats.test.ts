import { describe, it, expect } from "vitest";
import { computeEdadRango, normalizeFilters, shiftIsoDate } from "./stats-utils";

describe("shiftIsoDate", () => {
  it("resta días", () => {
    expect(shiftIsoDate("2026-04-11", -10)).toBe("2026-04-01");
  });
  it("suma días y cruza mes", () => {
    expect(shiftIsoDate("2026-01-30", 5)).toBe("2026-02-04");
  });
  it("cruza año", () => {
    expect(shiftIsoDate("2025-12-31", 1)).toBe("2026-01-01");
  });
});

describe("normalizeFilters", () => {
  it("aplica defaults cuando faltan from/to", () => {
    const r = normalizeFilters({});
    expect(r.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.sucursal).toBeNull();
  });
  it("rechaza strings con formato inválido", () => {
    const r = normalizeFilters({ from: "hoy", to: "ayer" });
    expect(r.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("acepta fechas válidas y sucursal válida", () => {
    const r = normalizeFilters({
      from: "2026-01-01",
      to: "2026-03-01",
      sucursal: "AVENIDA",
    });
    expect(r.from).toBe("2026-01-01");
    expect(r.to).toBe("2026-03-01");
    expect(r.sucursal).toBe("AVENIDA");
  });
  it("rechaza sucursal desconocida", () => {
    const r = normalizeFilters({
      sucursal: "OTRA" as unknown as "AVENIDA",
    });
    expect(r.sucursal).toBeNull();
  });
});

describe("computeEdadRango", () => {
  it("devuelve 'Sin dato' si no hay fecha válida", () => {
    expect(computeEdadRango("")).toBe("Sin dato");
    expect(computeEdadRango("no-es-fecha")).toBe("Sin dato");
  });
  it("clasifica cachorros (< 1 año)", () => {
    const hoy = new Date();
    const hace6meses = new Date(hoy);
    hace6meses.setMonth(hace6meses.getMonth() - 6);
    const iso = hace6meses.toISOString().slice(0, 10);
    expect(computeEdadRango(iso)).toBe("< 1 año");
  });
  it("clasifica adultos (3-6 años)", () => {
    const hoy = new Date();
    const hace5años = new Date(hoy);
    hace5años.setFullYear(hace5años.getFullYear() - 5);
    const iso = hace5años.toISOString().slice(0, 10);
    expect(computeEdadRango(iso)).toBe("3-6 años");
  });
  it("clasifica geriátricos (> 10 años)", () => {
    const hoy = new Date();
    const hace12años = new Date(hoy);
    hace12años.setFullYear(hace12años.getFullYear() - 12);
    const iso = hace12años.toISOString().slice(0, 10);
    expect(computeEdadRango(iso)).toBe("> 10 años");
  });
});
