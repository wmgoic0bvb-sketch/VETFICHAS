"use client";

import type { EntradaActividadPacienteCalendario } from "@/lib/calendario-paciente-actividad";
import { esControlFechaPasadaOHoy } from "@/lib/proximo-control-utils";
import type { AsistenciaProximoControl, Paciente, ProximoControl } from "@/types/patient";
import { CalendarioFilaControl } from "./calendario-fila-control";
import { CalendarioPacienteActividadRow } from "./calendario-paciente-actividad-row";

export interface ControlDelDia {
  paciente: Paciente;
  control: ProximoControl;
}

export function CalendarioSeccionControles({
  controles,
  onSetAsistencia,
}: {
  controles: ControlDelDia[];
  onSetAsistencia: (
    pacienteId: string,
    controlId: string,
    asistencia: AsistenciaProximoControl | null,
  ) => void;
}) {
  const tourAsistenciaIdx = controles.findIndex(({ control: c }) =>
    esControlFechaPasadaOHoy(c.fechaHora),
  );

  return (
    <section className="mb-8" aria-labelledby="cal-controles-heading">
      <h2
        id="cal-controles-heading"
        className="mb-2 text-xs font-bold uppercase tracking-[0.06em] text-[#5c1838]"
      >
        Controles programados
      </h2>
      {controles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4c5bc] bg-[#faf7f5] px-6 py-8 text-center">
          <p className="text-sm font-medium text-[#888]">
            Sin controles para este día
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {controles.map(({ paciente, control }, i) => (
            <CalendarioFilaControl
              key={`${paciente.id}-${control.id}`}
              paciente={paciente}
              control={control}
              onSetAsistencia={onSetAsistencia}
              tourAsistencia={i === tourAsistenciaIdx}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function CalendarioSeccionActividadFichas({
  actividades,
}: {
  actividades: EntradaActividadPacienteCalendario[];
}) {
  return (
    <section aria-labelledby="cal-actividad-heading">
      <h2
        id="cal-actividad-heading"
        className="mb-2 text-xs font-bold uppercase tracking-[0.06em] text-[#8b5e3c]"
      >
        Altas y consultas del día
      </h2>
      <p className="mb-3 text-[13px] text-[#888]">
        Pacientes dados de alta en el sistema o con consulta registrada con esta
        fecha (según la ficha).
      </p>
      {actividades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-200/80 bg-amber-50/30 px-6 py-8 text-center">
          <p className="text-sm font-medium text-[#888]">
            Sin altas ni consultas para este día
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {actividades.map((entrada) => (
            <CalendarioPacienteActividadRow
              key={entrada.paciente.id}
              entrada={entrada}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
