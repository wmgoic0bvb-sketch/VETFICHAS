import { describe, expect, it } from "vitest";
import {
  pickReminderCandidates,
  withReminderMarkedAsSent,
} from "@/lib/control-reminders";
import type { Paciente, ProximoControl } from "@/types/patient";

function basePaciente(overrides?: Partial<Paciente>): Paciente {
  return {
    id: "p1",
    especie: "Perro",
    nombre: "Firulais",
    raza: "",
    sexo: "",
    fnac: "",
    castrado: "",
    color: "",
    dueños: [{ nombre: "Ana", tel: "1122334455" }, { nombre: "", tel: "" }],
    dir: "",
    estado: "activo",
    esExterno: false,
    esUnicaConsulta: false,
    internado: false,
    proximosControles: [],
    consultas: [],
    estudios: [],
    ...overrides,
  };
}

function control(overrides?: Partial<ProximoControl>): ProximoControl {
  return {
    id: "c1",
    fechaHora: "27/04/2026 10:00",
    sucursalId: "AVENIDA",
    ...overrides,
  };
}

describe("pickReminderCandidates", () => {
  it("incluye recordatorio de 24h antes", () => {
    const patient = basePaciente({ proximosControles: [control()] });
    const now = new Date(2026, 3, 26, 10, 0, 0, 0);
    const out = pickReminderCandidates([patient], now);
    expect(out).toHaveLength(1);
    expect(out[0]?.window).toBe("24h_before");
  });

  it("incluye recordatorio del mismo dia a las 08:00", () => {
    const patient = basePaciente({
      proximosControles: [control({ fechaHora: "27/04/2026 15:30" })],
    });
    const now = new Date(2026, 3, 27, 8, 15, 0, 0);
    const out = pickReminderCandidates([patient], now);
    expect(out).toHaveLength(1);
    expect(out[0]?.window).toBe("same_day_08am");
  });

  it("no incluye controles fuera de ventana", () => {
    const patient = basePaciente({ proximosControles: [control()] });
    const now = new Date(2026, 3, 26, 7, 0, 0, 0);
    const out = pickReminderCandidates([patient], now);
    expect(out).toHaveLength(0);
  });

  it("descarta telefono invalido", () => {
    const patient = basePaciente({
      dueños: [{ nombre: "Ana", tel: "12" }, { nombre: "", tel: "" }],
      proximosControles: [control()],
    });
    const now = new Date(2026, 3, 26, 10, 0, 0, 0);
    const out = pickReminderCandidates([patient], now);
    expect(out).toHaveLength(0);
  });

  it("no reenvia cuando ya existe marca de envio", () => {
    const patient = basePaciente({
      proximosControles: [
        control({
          reminderMeta: {
            lastSentAtByWindow: { "24h_before": "2026-04-26T13:00:00.000Z" },
          },
        }),
      ],
    });
    const now = new Date(2026, 3, 26, 10, 0, 0, 0);
    const out = pickReminderCandidates([patient], now);
    expect(out).toHaveLength(0);
  });
});

describe("withReminderMarkedAsSent", () => {
  it("mantiene marcas previas y agrega la nueva ventana", () => {
    const updated = withReminderMarkedAsSent(
      control({
        reminderMeta: {
          lastSentAtByWindow: { "24h_before": "2026-04-26T13:00:00.000Z" },
        },
      }),
      "same_day_08am",
      "2026-04-27T11:15:00.000Z",
    );
    expect(updated.reminderMeta?.lastSentAtByWindow?.["24h_before"]).toBe(
      "2026-04-26T13:00:00.000Z",
    );
    expect(updated.reminderMeta?.lastSentAtByWindow?.same_day_08am).toBe(
      "2026-04-27T11:15:00.000Z",
    );
  });
});
