import { describe, it, expect } from "vitest";
import {
  MAX_DESCRIPCION_LEN,
  MAX_NOMBRE_LEN,
  joinVacunasMotivo,
  parseVacunaCreate,
  parseVacunaPatch,
  parseVacunasMotivoTokens,
  VACUNAS_MOTIVO_SEP,
} from "./vacunas";

describe("parseVacunaCreate", () => {
  it("acepta nombre y descripcion", () => {
    const r = parseVacunaCreate({
      nombre: "  Triple felina  ",
      descripcion: "  Contra rinotraqueitis  ",
    });
    expect(r).toEqual({
      ok: true,
      value: {
        nombre: "Triple felina",
        descripcion: "Contra rinotraqueitis",
      },
    });
  });

  it("rechaza nombre vacío", () => {
    const r = parseVacunaCreate({ nombre: "   ", descripcion: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/obligatorio/);
  });

  it("rechaza cuerpo no objeto", () => {
    expect(parseVacunaCreate(null).ok).toBe(false);
  });

  it("rechaza nombre demasiado largo", () => {
    const r = parseVacunaCreate({
      nombre: "x".repeat(MAX_NOMBRE_LEN + 1),
      descripcion: "",
    });
    expect(r.ok).toBe(false);
  });

  it("rechaza descripción demasiado larga", () => {
    const r = parseVacunaCreate({
      nombre: "ok",
      descripcion: "y".repeat(MAX_DESCRIPCION_LEN + 1),
    });
    expect(r.ok).toBe(false);
  });
});

describe("parseVacunaPatch", () => {
  it("actualiza un solo campo", () => {
    const r = parseVacunaPatch({ descripcion: "nueva" });
    expect(r.ok && r.value).toEqual({ descripcion: "nueva" });
  });

  it("rechaza patch vacío", () => {
    expect(parseVacunaPatch({}).ok).toBe(false);
  });

  it("permite descripcion null como vacío", () => {
    const r = parseVacunaPatch({ descripcion: null });
    expect(r.ok && r.value).toEqual({ descripcion: "" });
  });
});

describe("parseVacunasMotivoTokens / joinVacunasMotivo", () => {
  const opciones = ["Sextuple", "Triple felina"];

  it("parsea tokens con el separador oficial", () => {
    expect(
      parseVacunasMotivoTokens(`Sextuple${VACUNAS_MOTIVO_SEP}Triple felina`, opciones),
    ).toEqual(["Sextuple", "Triple felina"]);
  });

  it("respeta el orden del catálogo", () => {
    expect(
      parseVacunasMotivoTokens("Triple felina · Sextuple", opciones),
    ).toEqual(["Sextuple", "Triple felina"]);
  });

  it("une la selección en el orden del catálogo", () => {
    expect(joinVacunasMotivo(["Triple felina", "Sextuple"], opciones)).toBe(
      `Sextuple${VACUNAS_MOTIVO_SEP}Triple felina`,
    );
  });
});
