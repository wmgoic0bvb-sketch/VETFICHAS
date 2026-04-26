import { parseFechaHoraLocal } from "@/lib/proximo-control-utils";
import { sanitizePhoneForWhatsApp } from "@/lib/phone-utils";
import type { Paciente, ProximoControl, ReminderWindow } from "@/types/patient";

const MS_PER_HOUR = 60 * 60 * 1000;

export type ReminderCandidate = {
  patientId: string;
  patientNombre: string;
  controlId: string;
  controlFechaHora: string;
  ownerPhone: string;
  window: ReminderWindow;
  externalId: string;
};

function windowAlreadySent(control: ProximoControl, window: ReminderWindow): boolean {
  const marker = control.reminderMeta?.lastSentAtByWindow?.[window];
  return typeof marker === "string" && marker.trim().length > 0;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function shouldSend24hBefore(controlDate: Date, now: Date): boolean {
  const diff = controlDate.getTime() - now.getTime();
  return diff > 23 * MS_PER_HOUR && diff <= 24 * MS_PER_HOUR;
}

function shouldSendSameDayAt08(controlDate: Date, now: Date): boolean {
  if (!isSameCalendarDay(controlDate, now)) return false;
  return now.getHours() === 8;
}

function selectWindow(
  control: ProximoControl,
  now: Date,
): ReminderWindow | null {
  const controlDate = parseFechaHoraLocal(control.fechaHora);
  if (!controlDate) return null;

  if (
    shouldSend24hBefore(controlDate, now) &&
    !windowAlreadySent(control, "24h_before")
  ) {
    return "24h_before";
  }
  if (
    shouldSendSameDayAt08(controlDate, now) &&
    !windowAlreadySent(control, "same_day_08am")
  ) {
    return "same_day_08am";
  }
  return null;
}

export function pickReminderCandidates(
  patients: Paciente[],
  now: Date,
): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = [];
  for (const p of patients) {
    const ownerPhoneRaw = p.dueños?.[0]?.tel ?? "";
    const ownerPhone = sanitizePhoneForWhatsApp(ownerPhoneRaw);
    if (!ownerPhone) continue;
    for (const control of p.proximosControles ?? []) {
      const window = selectWindow(control, now);
      if (!window) continue;
      candidates.push({
        patientId: p.id,
        patientNombre: p.nombre,
        controlId: control.id,
        controlFechaHora: control.fechaHora,
        ownerPhone,
        window,
        externalId: `ctrl-${p.id}-${control.id}-${window}`,
      });
    }
  }
  return candidates;
}

export function withReminderMarkedAsSent(
  control: ProximoControl,
  window: ReminderWindow,
  sentAtIso: string,
): ProximoControl {
  const base = control.reminderMeta?.lastSentAtByWindow ?? {};
  return {
    ...control,
    reminderMeta: {
      lastSentAtByWindow: {
        ...base,
        [window]: sentAtIso,
      },
    },
  };
}

export function buildReminderMessage(
  patientNombre: string,
  controlFechaHora: string,
): string {
  return `Hola! Te recordamos el control de ${patientNombre} programado para ${controlFechaHora}. Si necesitas reprogramar, por favor escribinos.`;
}
