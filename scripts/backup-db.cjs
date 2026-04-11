/**
 * Backup de la base de datos a archivos JSON (uno por colección).
 *
 * Usa la conexión de mongoose (las mismas credenciales que el resto de los
 * scripts), así que no necesita tener instalado `mongodump`.
 *
 * Requiere:
 *   STORAGE_MONGODB_URI
 *   opcional: STORAGE_MONGODB_DB
 *
 * Uso:
 *   node scripts/backup-db.cjs
 *   node scripts/backup-db.cjs --out /ruta/destino
 *   node scripts/backup-db.cjs --collections patients,users
 *
 * Salida:
 *   backups/<YYYY-MM-DD_HH-mm-ss>/<collection>.json
 *   backups/<YYYY-MM-DD_HH-mm-ss>/_manifest.json
 *
 * Cada archivo es un array JSON con TODOS los documentos de la colección
 * (ObjectId y Date serializados con EJSON, para no perder tipos al restaurar).
 */

const mongoose = require("mongoose");
const { EJSON } = require("bson");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

function parseArgs(argv) {
  const out = { out: null, collections: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out.out = argv[++i];
    else if (a === "--collections") out.collections = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const uri = process.env.STORAGE_MONGODB_URI;
const dbName = process.env.STORAGE_MONGODB_DB?.trim() || undefined;

function timestampDir() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function main() {
  if (!uri) {
    console.error("Falta STORAGE_MONGODB_URI.");
    process.exit(1);
  }

  await mongoose.connect(uri, dbName ? { dbName } : undefined);
  const db = mongoose.connection.db;

  const allCollections = await db.listCollections().toArray();
  const filter = args.collections
    ? new Set(args.collections.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  const targets = allCollections
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."))
    .filter((n) => (filter ? filter.has(n) : true))
    .sort();

  if (targets.length === 0) {
    console.error("No hay colecciones para respaldar.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const baseOut = args.out
    ? path.resolve(args.out)
    : path.join(__dirname, "..", "backups");
  const outDir = path.join(baseOut, timestampDir());
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`DB: ${db.databaseName}`);
  console.log(`Destino: ${outDir}`);
  console.log(`Colecciones: ${targets.join(", ")}`);
  console.log("");

  const manifest = {
    createdAt: new Date().toISOString(),
    database: db.databaseName,
    mongoUriHost: (() => {
      try {
        return new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).host;
      } catch {
        return null;
      }
    })(),
    collections: [],
  };

  for (const name of targets) {
    const col = db.collection(name);
    const docs = await col.find({}).toArray();
    const filePath = path.join(outDir, `${name}.json`);
    // EJSON preserva ObjectId, Date, etc. (formato canónico = compatible con mongoimport)
    fs.writeFileSync(filePath, EJSON.stringify(docs, { relaxed: false }, 2), "utf8");
    const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`  ${name.padEnd(30)} ${String(docs.length).padStart(6)} docs  (${sizeKb} KB)`);
    manifest.collections.push({ name, count: docs.length, file: `${name}.json` });
  }

  fs.writeFileSync(
    path.join(outDir, "_manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(`\nBackup completo: ${outDir}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
