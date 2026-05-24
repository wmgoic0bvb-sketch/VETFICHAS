import { describe, it, expect } from "vitest";
import { toPascalCase } from "./name-case";

describe("toPascalCase", () => {
  it("devuelve string vacío si input vacío o sólo espacios", () => {
    expect(toPascalCase("")).toBe("");
    expect(toPascalCase("   ")).toBe("");
  });

  it("convierte todo minúscula a Title Case", () => {
    expect(toPascalCase("juan perez")).toBe("Juan Perez");
    expect(toPascalCase("maría josé")).toBe("María José");
  });

  it("convierte todo mayúscula a Title Case", () => {
    expect(toPascalCase("JUAN PEREZ")).toBe("Juan Perez");
    expect(toPascalCase("MARÍA JOSÉ")).toBe("María José");
  });

  it("respeta casing mixto ingresado por el usuario", () => {
    expect(toPascalCase("McDonald")).toBe("McDonald");
    expect(toPascalCase("DiCaprio")).toBe("DiCaprio");
    expect(toPascalCase("jUaN")).toBe("jUaN");
  });

  it("colapsa espacios y hace trim", () => {
    expect(toPascalCase("  juan   perez  ")).toBe("Juan Perez");
  });

  it("capitaliza después de guion y apóstrofe", () => {
    expect(toPascalCase("JEAN-LUC")).toBe("Jean-Luc");
    expect(toPascalCase("o'connor")).toBe("O'Connor");
    expect(toPascalCase("O’CONNOR")).toBe("O’Connor");
  });

  it("preserva un único nombre", () => {
    expect(toPascalCase("kira")).toBe("Kira");
    expect(toPascalCase("KIRA")).toBe("Kira");
  });

  it("tolera valores sin letras", () => {
    expect(toPascalCase("123")).toBe("123");
  });
});
