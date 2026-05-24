"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PatientFotoModal } from "@/components/dashboard/patient-foto-modal";
import { Modal } from "@/components/ui/modal";
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
  const [viewFullOpen, setViewFullOpen] = useState(false);

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
          <button
            type="button"
            onClick={() => setViewFullOpen(true)}
            className="block cursor-zoom-in rounded-full ring-2 ring-[#ebe6df] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c1838]"
            aria-label={`Ver foto de ${patient.nombre} a tamaño completo`}
          >
            <Image
              src={patient.fotoUrl}
              alt={`Foto de ${patient.nombre}`}
              width={120}
              height={120}
              className="pointer-events-none h-[120px] w-[120px] rounded-full object-cover"
              sizes="120px"
              unoptimized
            />
          </button>
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

      {patient.fotoUrl ? (
        <Modal
          open={viewFullOpen}
          onClose={() => setViewFullOpen(false)}
          labelledBy="patient-foto-full-title"
          maxWidthClass="max-w-[min(calc(100vw-2rem),72rem)]"
          variant="bare"
          overlayClassName="z-[215]"
        >
          <span id="patient-foto-full-title" className="sr-only">
            Vista ampliada de la foto de {patient.nombre}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- tamaño natural en lightbox */}
          <img
            src={patient.fotoUrl}
            alt={`Foto de ${patient.nombre}`}
            className="box-border max-h-[min(96vh,1080px)] w-auto max-w-full border border-solid border-[#e8e4de]"
          />
        </Modal>
      ) : null}
    </>
  );
}
