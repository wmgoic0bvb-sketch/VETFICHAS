"use client";

import { formatDueñosCorto } from "@/lib/dueños-utils";
import { esPacienteActivo, type Paciente } from "@/types/patient";

function emoji(especie: Paciente["especie"]) {
  return especie === "Perro" ? "🐶" : "🐱";
}

export function PatientCard({
  patient,
  onOpen,
}: {
  patient: Paciente;
  onOpen: (id: string) => void;
}) {
  const badgeClass =
    patient.especie === "Perro"
      ? "bg-sky-100 text-blue-900"
      : "bg-violet-100 text-violet-900";

  return (
    <button
      type="button"
      onClick={() => onOpen(patient.id)}
      className="cursor-pointer rounded-[18px] border-2 border-transparent bg-white px-4 py-5 text-center transition-all hover:-translate-y-0.5 hover:border-[#5c1838]"
    >
      <span className="mb-2 block text-[52px] leading-none" aria-hidden>
        {emoji(patient.especie)}
      </span>
      <div className="text-base font-bold text-[#1a1a1a]">{patient.nombre}</div>
      <div className="mt-1 text-xs text-[#888]">
        {patient.raza || patient.especie}
      </div>
      <div className="mt-1.5 text-xs font-medium text-[#5c1838]">
        👤 {formatDueñosCorto(patient.dueños)}
      </div>
      {!esPacienteActivo(patient) ? (
        <div className="mt-2 flex justify-center">
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-800">
            Archivado
          </span>
        </div>
      ) : null}
      {(patient.esExterno || patient.esUnicaConsulta) && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {patient.esExterno ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Externo
            </span>
          ) : null}
          {patient.esUnicaConsulta ? (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-800">
              Única consulta
            </span>
          ) : null}
        </div>
      )}
      <span
        className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass}`}
      >
        {patient.especie}
      </span>
    </button>
  );
}
