import mongoose, { Schema } from "mongoose";

const vacunaSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    descripcion: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "vacunas" },
);

export const Vacuna =
  mongoose.models.Vacuna ?? mongoose.model("Vacuna", vacunaSchema);
