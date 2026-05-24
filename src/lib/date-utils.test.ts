import { describe, it, expect } from "vitest";
import { formatProximoRefuerzoDisplay } from "./date-utils";

describe("formatProximoRefuerzoDisplay", () => {
  it("deja DD/MM/AAAA tal cual", () => {
    expect(formatProximoRefuerzoDisplay("13/03/2026")).toBe("13/03/2026");
  });

  it("convierte ISO a DD/MM/AAAA", () => {
    expect(formatProximoRefuerzoDisplay("2026-03-13")).toBe("13/03/2026");
  });

  it("devuelve otro texto sin cambiar", () => {
    expect(formatProximoRefuerzoDisplay("  según criterio  ")).toBe(
      "según criterio",
    );
  });
});
