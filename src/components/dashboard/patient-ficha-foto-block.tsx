"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PatientFotoModal } from "@/components/dashboard/patient-foto-modal";
import type { Paciente } from "@/types/patient";

const MAX_BYTES = 4 * 1024 * 1024;

function emojiChar(especie: "Perro" | "Gato") {
  return especie === "Perro" ? "🐶" : "🐱";
}

export function PatientFichaFotoBlock({
  patient,
  setPatientFoto,
}: {
  patient: Pick<Paciente, "id" | "nombre" | "especie" | "fotoUrl">;
  setPatientFoto: (patientId: string, file: Blob) => Promise<Paciente | undefined>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pick, setPick] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const onPickFile = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Elegí un archivo de imagen.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("La imagen no puede superar los 4 MB.");
      return;
    }
    setPick(file);
    setModalOpen(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <div className="relative mx-auto mb-2 h-[120px] w-[120px] shrink-0">
        {patient.fotoUrl ? (
          <Image
            src={patient.fotoUrl}
            alt={`Foto de ${patient.nombre}`}
            width={120}
            height={120}
            className="h-[120px] w-[120px] rounded-full object-cover ring-2 ring-[#ebe6df]"
            sizes="120px"
            unoptimized
          />
        ) : (
          <span
            className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[#f5f0eb] text-[56px] leading-none ring-2 ring-[#ebe6df]"
            aria-hidden
          >
            {emojiChar(patient.especie)}
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#5c1838] text-white shadow-md transition-colors hover:bg-[#4a1430]"
          aria-label="Cambiar foto del paciente"
          title="Cambiar foto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => onPickFile(e.target.files)}
        />
      </div>

      <PatientFotoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPick(null);
        }}
        imageFile={pick}
        patientNombre={patient.nombre}
        onSave={async (blob) => {
          const r = await setPatientFoto(patient.id, blob);
          if (r) toast.success("Foto actualizada.");
        }}
      />
    </>
  );
}
