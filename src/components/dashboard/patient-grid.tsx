"use client";

import type { Paciente } from "@/types/patient";
import { PatientCard } from "./patient-card";

export function PatientGrid({
  patients,
  onOpen,
}: {
  patients: Paciente[];
  onOpen: (id: string) => void;
}) {
  if (patients.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-[#aaa]">
        <div className="mb-3 text-5xl" aria-hidden>
          🐾
        </div>
        <p className="text-[15px]">
          No hay pacientes aún.
          <br />
          ¡Agregá el primero!
        </p>
      </div>
    );
  }

  return (
    <>
      {patients.map((p) => (
        <PatientCard key={p.id} patient={p} onOpen={onOpen} />
      ))}
    </>
  );
}
