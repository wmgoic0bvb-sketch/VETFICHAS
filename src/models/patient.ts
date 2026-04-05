import mongoose, { Schema } from "mongoose";

const dueñoContactoSchema = new Schema(
  {
    nombre: { type: String, default: "" },
    tel: { type: String, default: "" },
  },
  { _id: false },
);

const proximoControlSchema = new Schema(
  {
    id: { type: String, required: true },
    fechaHora: { type: String, required: true },
    sucursalId: { type: String, required: true },
    nota: { type: String },
    asistencia: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const consultaSchema = new Schema(
  {
    id: { type: String, required: true },
    motivo: { type: String, default: "" },
    veterinario: { type: String, default: "" },
    tipo: { type: String, default: "Consulta" },
    fecha: { type: String, default: "" },
    peso: { type: String, default: "" },
    temp: { type: String, default: "" },
    diag: { type: String, default: "" },
    trat: { type: String, default: "" },
    meds: { type: String, default: "" },
  },
  { _id: false },
);

const estudioSchema = new Schema(
  {
    id: { type: String, required: true },
    categoria: { type: String, required: true },
    titulo: { type: String, default: "" },
    url: { type: String, required: true },
    nombreArchivo: { type: String, default: "" },
    contentType: { type: String, default: "" },
    fecha: { type: String, required: true },
  },
  { _id: false },
);

const ordenTratamientoInternacionSchema = new Schema(
  {
    id: { type: String, required: true },
    medicamentoOProcedimiento: { type: String, default: "" },
    viaAdministracion: { type: String, default: "" },
    dosis: { type: String, default: "" },
    frecuencia: { type: String, default: "" },
    fechaInicio: { type: String, default: "" },
    fechaFin: { type: String },
    activa: { type: Boolean, default: true },
  },
  { _id: false },
);

const evolucionRondaInternacionSchema = new Schema(
  {
    id: { type: String, required: true },
    fechaHora: { type: String, required: true },
    veterinario: { type: String, default: "" },
    temperatura: { type: String, default: "" },
    frecuenciaCardiaca: { type: String, default: "" },
    frecuenciaRespiratoria: { type: String, default: "" },
    peso: { type: String },
    estadoGeneral: {
      type: String,
      enum: ["Estable", "Regular", "Crítico"],
      default: "Estable",
    },
    observaciones: { type: String, default: "" },
  },
  { _id: false },
);

const modificacionPacienteSchema = new Schema(
  {
    id: { type: String, required: true },
    fechaHora: { type: String, required: true },
    usuarioId: { type: String, required: true },
    usuarioDni: { type: String },
    usuarioNombre: { type: String },
    resumen: { type: String, required: true },
  },
  { _id: false },
);

const datosInternacionSchema = new Schema(
  {
    fechaIngreso: { type: String, default: "" },
    fechaAlta: { type: String },
    motivoIngreso: { type: String, default: "" },
    veterinarioResponsable: { type: String, default: "" },
    diagnosticoPrincipal: { type: String, default: "" },
    diagnosticoEditadoEn: { type: String },
    ordenes: { type: [ordenTratamientoInternacionSchema], default: [] },
    evoluciones: { type: [evolucionRondaInternacionSchema], default: [] },
  },
  { _id: false },
);

const patientSchema = new Schema(
  {
    especie: { type: String, enum: ["Perro", "Gato"], required: true },
    nombre: { type: String, required: true, trim: true },
    raza: { type: String, default: "" },
    sexo: { type: String, default: "" },
    fnac: { type: String, default: "" },
    castrado: { type: String, default: "" },
    color: { type: String, default: "" },
    dueños: {
      type: [dueñoContactoSchema],
      validate: {
        validator(v: unknown) {
          return (
            Array.isArray(v) &&
            v.length >= 1 &&
            v.length <= 2
          );
        },
      },
      default: () => [
        { nombre: "", tel: "" },
        { nombre: "", tel: "" },
      ],
    },
    dir: { type: String, default: "" },
    estado: {
      type: String,
      enum: ["activo", "archivado"],
      default: "activo",
    },
    esExterno: { type: Boolean, default: false },
    esUnicaConsulta: { type: Boolean, default: false },
    internado: { type: Boolean, default: false },
    datosInternacion: { type: datosInternacionSchema, required: false },
    proximosControles: { type: [proximoControlSchema], default: [] },
    consultas: { type: [consultaSchema], default: [] },
    estudios: { type: [estudioSchema], default: [] },
    historialModificaciones: {
      type: [modificacionPacienteSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export const Patient =
  mongoose.models.Patient ?? mongoose.model("Patient", patientSchema);
