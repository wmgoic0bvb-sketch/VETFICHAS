"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { draftFromPatient } from "@/components/dashboard/patient-ficha-edit-form";
import { usePatients } from "@/components/providers/patients-provider";
import { Modal } from "@/components/ui/modal";
import {
  buildInternacionHistorialEntry,
  defaultDatosInternacion,
} from "@/lib/internacion-utils";
import type { Paciente } from "@/types/patient";

type ArchiveMode = "general" | "fallecimiento";

export function PatientArchiveModal({
  open,
  patient,
  onClose,
  onPendingChange,
}: {
  open: boolean;
  patient: Paciente;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { updatePatient } = usePatients();
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>("general");
  const [archiveFechaHoraLocal, setArchiveFechaHoraLocal] = useState(
    nowDatetimeLocal(),
  );
  const [archiveCause, setArchiveCause] = useState("");

  const resetArchiveForm = () => {
    setArchiveMode("general");
    setArchiveFechaHoraLocal(nowDatetimeLocal());
    setArchiveCause("");
  };

  useEffect(() => {
    resetArchiveForm();
  }, [patient.id]);

  const closeArchiveModal = () => {
    onClose();
    resetArchiveForm();
  };

  const confirmarArchivado = async () => {
    onPendingChange(true);
    try {
      const nextDraft = draftFromPatient(patient);
      if (archiveMode === "fallecimiento") {
        const fechaAltaDate = new Date(archiveFechaHoraLocal);
        if (Number.isNaN(fechaAltaDate.getTime())) {
          toast.error("Ingresá una fecha y hora válidas para el fallecimiento.");
          return;
        }
        const fechaAlta = fechaAltaDate.toISOString();
        const [fechaIngreso, horaIngreso = ""] =
          archiveFechaHoraLocal.split("T");
        const base = patient.datosInternacion ?? {
          ...defaultDatosInternacion(),
          fechaIngreso,
          horaIngreso,
          motivoIngreso: "Registro de fallecimiento",
          diagnosticoPrincipal: archiveCause.trim() || "Fallecimiento",
        };

        const histEntry = buildInternacionHistorialEntry({
          base,
          fechaAlta,
          tipo: "fallecimiento",
          causa: archiveCause,
        });

        await updatePatient(patient.id, {
          ...nextDraft,
          estado: "archivado",
          internado: false,
          datosInternacion: undefined,
          historialInternaciones: [
            ...(patient.historialInternaciones ?? []),
            histEntry,
          ],
        });
        toast.success(`Fallecimiento registrado para ${patient.nombre}`);
      } else {
        await updatePatient(patient.id, {
          ...nextDraft,
          estado: "archivado",
        });
      }
      closeArchiveModal();
    } finally {
      onPendingChange(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeArchiveModal}
      labelledBy="archive-patient-modal-title"
    >
      <div className="flex flex-col gap-5">
        <div>
          <h2
            id="archive-patient-modal-title"
            className="text-[18px] font-bold text-[#1a1a1a]"
          >
            Archivar ficha
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-[#555]">
            Podés archivarla de forma general o registrar el fallecimiento
            para que quede como un hito más en el historial médico.
          </p>
        </div>

        <div className="grid gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e8e0d8] px-4 py-3">
            <input
              type="radio"
              name="archive-mode"
              checked={archiveMode === "general"}
              onChange={() => setArchiveMode("general")}
              className="mt-1"
            />
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-[#1a1a1a]">
                Archivo general
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-[#555]">
                Oculta la ficha del listado principal, sin agregar un evento
                clínico nuevo.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e8e0d8] px-4 py-3">
            <input
              type="radio"
              name="archive-mode"
              checked={archiveMode === "fallecimiento"}
              onChange={() => setArchiveMode("fallecimiento")}
              className="mt-1"
            />
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-[#1a1a1a]">
                Fallecimiento
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-[#555]">
                Archiva la ficha y registra el fallecimiento en el historial
                de internaciones.
              </span>
            </span>
          </label>
        </div>

        {archiveMode === "fallecimiento" ? (
          <div className="grid gap-4 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-4">
            <div>
              <label
                htmlFor="archive-fallecimiento-fecha"
                className="block text-[13px] font-semibold text-[#5c1838]"
              >
                Fecha y hora
              </label>
              <input
                id="archive-fallecimiento-fecha"
                type="datetime-local"
                value={archiveFechaHoraLocal}
                onChange={(e) => setArchiveFechaHoraLocal(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#5c1838] focus:ring-2 focus:ring-[#5c1838]/15"
              />
            </div>

            <div>
              <label
                htmlFor="archive-fallecimiento-causa"
                className="block text-[13px] font-semibold text-[#5c1838]"
              >
                Causa del fallecimiento
              </label>
              <textarea
                id="archive-fallecimiento-causa"
                value={archiveCause}
                onChange={(e) => setArchiveCause(e.target.value)}
                rows={4}
                placeholder="Ej. paro cardiorrespiratorio, falla multiorgánica, etc."
                className="mt-1.5 w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#5c1838] focus:ring-2 focus:ring-[#5c1838]/15"
              />
              <p className="mt-1.5 text-[12px] text-[#666]">
                Si el paciente estaba internado, este registro también cierra
                la internación activa.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeArchiveModal}
            className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] py-2.5 text-sm font-medium text-[#555] hover:bg-[#f5f0eb] sm:w-auto sm:min-w-[110px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmarArchivado()}
            disabled={
              archiveMode === "fallecimiento" &&
              !archiveFechaHoraLocal.trim()
            }
            className="w-full rounded-xl bg-[#5c1838] py-2.5 text-sm font-semibold text-white hover:bg-[#401127] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[160px]"
          >
            {archiveMode === "fallecimiento"
              ? "Archivar y registrar"
              : "Archivar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
