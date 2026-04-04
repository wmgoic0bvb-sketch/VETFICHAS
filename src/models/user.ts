import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    dni: { type: String, required: true, unique: true, index: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
  },
  { timestamps: true },
);

export const User =
  mongoose.models.User ?? mongoose.model("User", userSchema);
