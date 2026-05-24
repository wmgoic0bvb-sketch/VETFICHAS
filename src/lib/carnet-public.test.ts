import { describe, it, expect } from "vitest";
import { nombresVacunaDesdeMotivo } from "./carnet-public";

describe("nombresVacunaDesdeMotivo", () => {
  it("separa por separador central", () => {
    expect(nombresVacunaDesdeMotivo("A · B · C")).toEqual(["A", "B", "C"]);
  });

  it("acepta coma y punto y coma", () => {
    expect(nombresVacunaDesdeMotivo("Uno, Dos; Tres")).toEqual([
      "Uno",
      "Dos",
      "Tres",
    ]);
  });

  it("devuelve vacío si no hay texto", () => {
    expect(nombresVacunaDesdeMotivo("   ")).toEqual([]);
  });
});
