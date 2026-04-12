import mongoose, { Schema } from "mongoose";

const staffNotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["estudio_subido"],
      required: true,
    },
    readAt: { type: Date, default: null, index: true },
    patientId: { type: String, required: true },
    patientNombre: { type: String, required: true },
    estudioId: { type: String, required: true },
    estudioCategoria: { type: String, default: "" },
    titulo: { type: String, default: "" },
    uploadedByUserId: { type: String, required: true },
    uploadedByName: { type: String, default: "" },
  },
  { timestamps: true },
);

staffNotificationSchema.index({ userId: 1, createdAt: -1 });

export const StaffNotification =
  mongoose.models.StaffNotification ??
  mongoose.model("StaffNotification", staffNotificationSchema);
