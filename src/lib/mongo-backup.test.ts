import { describe, it, expect } from "vitest";
import {
  getMongoUriHostForManifest,
  listBackupTargetNames,
} from "./mongo-backup";

describe("listBackupTargetNames", () => {
  it("excluye system.* y ordena", () => {
    expect(
      listBackupTargetNames(["users", "system.views", "patients"], null),
    ).toEqual(["patients", "users"]);
  });

  it("respeta el filtro cuando se pasa", () => {
    const filter = new Set(["patients"]);
    expect(
      listBackupTargetNames(["users", "patients", "vacunas"], filter),
    ).toEqual(["patients"]);
  });
});

describe("getMongoUriHostForManifest", () => {
  it("extrae el host de una URI mongodb", () => {
    expect(
      getMongoUriHostForManifest(
        "mongodb+srv://user:pass@cluster0.abcd.mongodb.net/dbname",
      ),
    ).toBe("cluster0.abcd.mongodb.net");
  });

  it("devuelve null si la URI es inválida", () => {
    expect(getMongoUriHostForManifest("not-a-uri")).toBe(null);
  });
});
