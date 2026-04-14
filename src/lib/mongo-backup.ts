import mongoose from "mongoose";
import { EJSON } from "bson";
import fs from "fs";
import path from "path";
import { connectMongo } from "@/lib/mongodb";

export type BackupManifest = {
  createdAt: string;
  database: string;
  mongoUriHost: string | null;
  collections: { name: string; count: number; file: string }[];
};

export function getMongoUriHostForManifest(uri: string): string | null {
  try {
    return new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).host;
  } catch {
    return null;
  }
}

export function listBackupTargetNames(
  collectionNames: string[],
  filter: Set<string> | null,
): string[] {
  return collectionNames
    .filter((n) => !n.startsWith("system."))
    .filter((n) => (filter ? filter.has(n) : true))
    .sort();
}

export function backupTimestampDir(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

export type RunMongoBackupOptions = {
  /** Si se pasa, solo estas colecciones (nombres exactos). */
  collectionFilter?: string[] | null;
};

/**
 * Misma lógica que el CLI `npm run backup-db`: un JSON por colección (EJSON)
 * más `_manifest.json`.
 */
export async function runMongoBackup(options?: RunMongoBackupOptions): Promise<{
  manifest: BackupManifest;
  files: Map<string, string>;
}> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("No hay conexión a MongoDB");
  }

  const uri = process.env.STORAGE_MONGODB_URI;
  if (!uri) {
    throw new Error("Falta STORAGE_MONGODB_URI.");
  }

  const allCollections = await db.listCollections().toArray();
  const nameFilter = options?.collectionFilter?.length
    ? new Set(options.collectionFilter.map((s) => s.trim()).filter(Boolean))
    : null;
  const targets = listBackupTargetNames(
    allCollections.map((c) => c.name),
    nameFilter,
  );

  if (targets.length === 0) {
    throw new Error("No hay colecciones para respaldar.");
  }

  const manifest: BackupManifest = {
    createdAt: new Date().toISOString(),
    database: db.databaseName,
    mongoUriHost: getMongoUriHostForManifest(uri),
    collections: [],
  };

  const files = new Map<string, string>();

  for (const name of targets) {
    const col = db.collection(name);
    const docs = await col.find({}).toArray();
    const body = EJSON.stringify(docs, { relaxed: false }, 2);
    const file = `${name}.json`;
    files.set(file, body);
    manifest.collections.push({ name, count: docs.length, file });
  }

  files.set("_manifest.json", JSON.stringify(manifest, null, 2));

  return { manifest, files };
}

/** Escribe el respaldo en `baseOut/<timestamp>/` (comportamiento del script anterior). */
export async function writeMongoBackupToDirectory(
  baseOut: string,
  options?: RunMongoBackupOptions,
): Promise<string> {
  const { files } = await runMongoBackup(options);
  const outDir = path.join(path.resolve(baseOut), backupTimestampDir());
  fs.mkdirSync(outDir, { recursive: true });
  for (const [filename, content] of files) {
    fs.writeFileSync(path.join(outDir, filename), content, "utf8");
  }
  return outDir;
}
