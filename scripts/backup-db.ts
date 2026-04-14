/**
 * Backup de la base de datos a archivos JSON (uno por colección).
 * Misma salida que antes: backups/<timestamp>/ + _manifest.json
 *
 * Requiere STORAGE_MONGODB_URI (opcional STORAGE_MONGODB_DB).
 * Carga .env.local desde la raíz del proyecto.
 *
 * Uso:
 *   npm run backup-db
 *   npx tsx scripts/backup-db.ts --out /ruta/destino
 *   npx tsx scripts/backup-db.ts --collections patients,users
 */

import fs from "fs";
import path from "path";
import { writeMongoBackupToDirectory } from "../src/lib/mongo-backup";

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

function parseArgs(argv: string[]) {
  const out: { out: string | null; collections: string | null } = {
    out: null,
    collections: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out.out = argv[++i] ?? null;
    else if (a === "--collections") out.collections = argv[++i] ?? null;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

async function main() {
  if (!process.env.STORAGE_MONGODB_URI) {
    console.error("Falta STORAGE_MONGODB_URI.");
    process.exit(1);
  }

  const baseOut = args.out
    ? path.resolve(args.out)
    : path.join(__dirname, "..", "backups");

  const collectionFilter = args.collections
    ? args.collections.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const outDir = await writeMongoBackupToDirectory(baseOut, {
    collectionFilter: collectionFilter?.length ? collectionFilter : null,
  });

  console.log(`\nBackup completo: ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
