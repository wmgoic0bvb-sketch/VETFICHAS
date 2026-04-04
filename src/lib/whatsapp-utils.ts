import type { Paciente, ProximoControl } from "@/types/patient";
import { getSucursalById } from "@/lib/sucursales";
import {
  diasCalendarioHastaFechaHora,
  fechaHoraGuardadaToMaskedInputs,
} from "@/lib/proximo-control-utils";

/**
 * Normaliza un teléfono argentino a dígitos puros con código de país 54.
 * Ej: "0351 423-1234" → "543514231234"
 */
export function normalizarTelArgentino(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) return digits;
  if (digits.startsWith("0")) return "54" + digits.slice(1);
  return "54" + digits;
}

/** Construye el mensaje de recordatorio de turno. */
export function buildMensajeRecordatorio(
  paciente: Paciente,
  control: ProximoControl,
  nombreDueño: string,
): string {
  const { fecha } = fechaHoraGuardadaToMaskedInputs(control.fechaHora);
  const sucursalNombre =
    getSucursalById(control.sucursalId)?.nombre ?? control.sucursalId;

  let msg = `Hola ${nombreDueño}! Te recordamos que mañana *${fecha}* tenés turno para *${paciente.nombre}* en nuestra veterinaria (${sucursalNombre}).`;
  if (control.nota) {
    msg += `\n\n_${control.nota}_`;
  }
  msg += "\n\n¡Te esperamos! 🐾";
  return msg;
}

/** URL de WhatsApp para abrir chat con mensaje pre-cargado. */
export function buildWhatsAppUrl(tel: string, mensaje: string): string {
  const phone = normalizarTelArgentino(tel);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
}

/** Controles con turno mañana y sin recordatorio enviado. */
export function getTurnosMañana(
  pacientes: Paciente[],
): Array<{ paciente: Paciente; control: ProximoControl }> {
  const result: Array<{ paciente: Paciente; control: ProximoControl }> = [];
  for (const paciente of pacientes) {
    for (const control of paciente.proximosControles) {
      if (control.recordatorioEnviado) continue;
      const dias = diasCalendarioHastaFechaHora(control.fechaHora);
      if (dias === 1) {
        result.push({ paciente, control });
      }
    }
  }
  return result;
}
