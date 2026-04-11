import { describe, it, expect } from "vitest";
import {
  parseCsvRows,
  extractNames,
  normalize,
  searchIn,
} from "./medicamentos";

describe("parseCsvRows", () => {
  it("parsea campos con comillas y comas internas", () => {
    const csv = '"a","b,c","d"\n"e","f","g"';
    expect(parseCsvRows(csv)).toEqual([
      ["a", "b,c", "d"],
      ["e", "f", "g"],
    ]);
  });

  it("soporta comillas escapadas dobles", () => {
    const csv = '"he said ""hi""","ok"';
    expect(parseCsvRows(csv)).toEqual([['he said "hi"', "ok"]]);
  });

  it("maneja CRLF", () => {
    expect(parseCsvRows('"a","b"\r\n"c","d"')).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("extractNames", () => {
  it("ignora header y filas basura (nombre muy corto o sin letras)", () => {
    const rows = [
      ["", "|", "Lab", "Precio"],
      ["", "C", "AFFORD", "123"],
      ["6372", "AMOX PLUS 250mg x 100 Comp", "AFFORD", "34762"],
      ["6371", "AMOX PLUS 500mg x 50 Comp", "AFFORD", "29553"],
      ["", "", "", ""],
      ["", "12345", "lab", "0"],
    ];
    expect(extractNames(rows)).toEqual([
      "AMOX PLUS 250mg x 100 Comp",
      "AMOX PLUS 500mg x 50 Comp",
    ]);
  });

  it("deduplica y ordena alfabéticamente", () => {
    const rows = [
      ["", "h", "", ""],
      ["", "Zeta 10", "", ""],
      ["", "Alfa 5", "", ""],
      ["", "alfa 5", "", ""],
    ];
    expect(extractNames(rows)).toEqual(["Alfa 5", "Zeta 10"]);
  });
});

describe("normalize", () => {
  it("remueve tildes y pasa a minúsculas", () => {
    expect(normalize("Amoxicílina")).toBe("amoxicilina");
    expect(normalize("  ÑANDÚ  ")).toBe("nandu");
  });
});

describe("searchIn", () => {
  const names = [
    "Amoxicilina 500mg",
    "Amox Plus 250mg",
    "Bravecto 112mg",
    "Meloxicam 1.5mg",
    "Ranitidina",
  ];
  const normalized = names.map(normalize);

  it("prioriza prefijos sobre substring", () => {
    const r = searchIn(names, normalized, "amox", 5);
    expect(r[0]).toBe("Amoxicilina 500mg");
    expect(r).toContain("Amox Plus 250mg");
  });

  it("matchea ignorando tildes y mayúsculas", () => {
    expect(searchIn(names, normalized, "AMOXI", 5)).toContain(
      "Amoxicilina 500mg",
    );
  });

  it("respeta el límite", () => {
    expect(searchIn(names, normalized, "a", 2).length).toBeLessThanOrEqual(2);
  });

  it("devuelve vacío si query vacía", () => {
    expect(searchIn(names, normalized, "   ", 10)).toEqual([]);
  });
});
