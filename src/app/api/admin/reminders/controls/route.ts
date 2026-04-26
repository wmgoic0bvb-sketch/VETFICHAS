import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin-route-auth";
import { connectMongo } from "@/lib/mongodb";
import { pacienteFromMongoLean } from "@/lib/mongodb-patient";
import {
  buildReminderMessage,
  pickReminderCandidates,
  withReminderMarkedAsSent,
} from "@/lib/control-reminders";
import { sendControlReminderWhatsapp } from "@/lib/whatsapp-kapsios";
import { Patient } from "@/models/patient";

export const runtime = "nodejs";

type RunResult = {
  evaluatedControls: number;
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: Array<{ patientId: string; controlId: string; detail: string }>;
};

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminToken(request);
  if (!auth.ok) {
    if (auth.error === "config") {
      return NextResponse.json(
        { error: "Falta configuración de autenticación" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const now = new Date();
    await connectMongo();
    const rows = await Patient.find({ estado: "activo" }).lean().exec();
    const patients = rows.map((row) => pacienteFromMongoLean(row));
    const candidates = pickReminderCandidates(patients, now);
    const byId = new Map(patients.map((p) => [p.id, p]));
    const touched = new Set<string>();

    const result: RunResult = {
      evaluatedControls: patients.reduce(
        (acc, p) => acc + (p.proximosControles?.length ?? 0),
        0,
      ),
      candidates: candidates.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const item of candidates) {
      const patient = byId.get(item.patientId);
      if (!patient) {
        result.skipped += 1;
        continue;
      }
      try {
        const message = buildReminderMessage(
          item.patientNombre,
          item.controlFechaHora,
        );
        await sendControlReminderWhatsapp({
          to: item.ownerPhone,
          message,
          patientName: item.patientNombre,
          controlFechaHora: item.controlFechaHora,
          externalId: item.externalId,
        });
        patient.proximosControles = patient.proximosControles.map((control) =>
          control.id === item.controlId
            ? withReminderMarkedAsSent(control, item.window, now.toISOString())
            : control,
        );
        touched.add(patient.id);
        result.sent += 1;
      } catch (err) {
        result.failed += 1;
        result.errors.push({
          patientId: item.patientId,
          controlId: item.controlId,
          detail: toErrorMessage(err),
        });
      }
    }

    await Promise.all(
      [...touched].map((patientId) => {
        const patient = byId.get(patientId);
        if (!patient) return Promise.resolve();
        return Patient.findByIdAndUpdate(patientId, {
          $set: { proximosControles: patient.proximosControles },
        }).exec();
      }),
    );

    result.skipped = result.evaluatedControls - result.candidates;
    return NextResponse.json({ ok: true, now: now.toISOString(), result });
  } catch (err) {
    return NextResponse.json(
      { error: `No se pudieron enviar recordatorios: ${toErrorMessage(err)}` },
      { status: 500 },
    );
  }
}
