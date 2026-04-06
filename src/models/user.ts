import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    dni: { type: String, required: true, unique: true, index: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    imageData: { type: String },   // base64 sin prefijo data:
    imageType: { type: String },   // p.ej. "image/jpeg"
    role: {
      type: String,
      enum: ["user", "admin", "vet"],
      default: "user",
    },
  },
  { timestamps: true },
);

export const User =
  mongoose.models.User ?? mongoose.model("User", userSchema);
