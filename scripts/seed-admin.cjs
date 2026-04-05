/**
 * Crea o actualiza el usuario administrador por DNI (por defecto 41092726).
 *
 * Requiere:
 *   STORAGE_MONGODB_URI
 *   opcional: STORAGE_MONGODB_DB
 *   ADMIN_PASSWORD — contraseña (mínimo 6 caracteres)
 *   opcional: ADMIN_DNI (default "41092726")
 *
 * Carga variables desde .env.local si existe en la raíz del proyecto.
 *
 * Ejemplo (PowerShell):
 *   $env:ADMIN_PASSWORD="tu_clave_segura"; node scripts/seed-admin.cjs
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const uri = process.env.STORAGE_MONGODB_URI;
const dbName = process.env.STORAGE_MONGODB_DB?.trim() || undefined;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminDni = (process.env.ADMIN_DNI || "41092726").replace(/\D/g, "");

const userSchema = new mongoose.Schema(
  {
    dni: { type: String, required: true, unique: true, index: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    role: {
      type: String,
      enum: ["user", "admin", "vet"],
      default: "user",
    },
  },
  { timestamps: true, collection: "users" },
);

async function main() {
  if (!uri) {
    console.error("Falta STORAGE_MONGODB_URI.");
    process.exit(1);
  }
  if (!adminPassword || adminPassword.length < 6) {
    console.error(
      "Definí ADMIN_PASSWORD con al menos 6 caracteres (variable de entorno).",
    );
    process.exit(1);
  }
  if (!adminDni) {
    console.error("ADMIN_DNI inválido.");
    process.exit(1);
  }

  const connectOptions = dbName ? { dbName } : undefined;
  await mongoose.connect(uri, connectOptions);

  const User =
    mongoose.models.SeedAdminUser ||
    mongoose.model("SeedAdminUser", userSchema);

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const or = [{ dni: adminDni }];
  const n = Number(adminDni);
  if (!Number.isNaN(n) && String(n) === adminDni && adminDni.length <= 16) {
    or.push({ dni: n });
  }

  const existing = await User.findOne({ $or: or }).exec();
  if (existing) {
    existing.dni = adminDni;
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    await existing.save();
    console.log("Actualizado admin DNI:", adminDni);
  } else {
    await User.create({
      dni: adminDni,
      passwordHash,
      role: "admin",
    });
    console.log("Creado admin DNI:", adminDni);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
