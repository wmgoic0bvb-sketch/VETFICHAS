"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import {
  draftFromPatient,
} from "@/components/dashboard/patient-ficha-edit-form";
import { usePatients } from "@/components/providers/patients-provider";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import {
  buildInternacionHistorialEntry,
  defaultDatosInternacion,
} from "@/lib/internacion-utils";
import {
  ESTADO_PACIENTE_LABELS,
  esPacienteActivo,
  type EstadoPaciente,
  type Paciente,
} from "@/types/patient";

export function PatientDangerZone({ patient }: { patient: Paciente }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();
  const { updatePatient, removePatient } = usePatients();
  const deletePanelId = useId();
  const [deletePanelOpen, setDeletePanelOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [archiveMode, setArchiveMode] = useState<"general" | "fallecimiento">(
    "general",
  );
  const [archiveFechaHoraLocal, setArchiveFechaHoraLocal] = useState(
    nowDatetimeLocal(),
  );
  const [archiveCause, setArchiveCause] = useState("");

  const nombreConfirmacion = patient.nombre.trim();
  const puedeEliminar =
    deleteInput.trim() === nombreConfirmacion && nombreConfirmacion.length > 0;

  useEffect(() => {
    setDeletePanelOpen(false);
    setDeleteInput("");
  }, [patient.id]);

  useEffect(() => {
    setArchiveConfirmOpen(false);
    setArchiveMode("general");
    setArchiveFechaHoraLocal(nowDatetimeLocal());
    setArchiveCause("");
  }, [patient.id]);

  const resetArchiveForm = () => {
    setArchiveMode("general");
    setArchiveFechaHoraLocal(nowDatetimeLocal());
    setArchiveCause("");
  };

  const openArchiveModal = () => {
    resetArchiveForm();
    setArchiveConfirmOpen(true);
  };

  const closeArchiveModal = () => {
    setArchiveConfirmOpen(false);
    resetArchiveForm();
  };

  const aplicarEstado = async (estado: EstadoPaciente) => {
    setPending(true);
    try {
      await updatePatient(patient.id, { ...draftFromPatient(patient), estado });
    } finally {
      setPending(false);
    }
  };

  const eliminarDefinitivo = async () => {
    if (!isAdmin || !puedeEliminar) return;
    setPending(true);
    try {
      await removePatient(patient.id);
      router.push("/");
    } finally {
      setPending(false);
    }
  };

  const confirmarArchivado = async () => {
    setPending(true);
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
        const base =
          patient.datosInternacion ??
          {
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
      setPending(false);
    }
  };

  const activo = esPacienteActivo(patient);

  return (
    <>
      <DbLoadingOverlay show={pending} />
      <section
        className="mt-10 overflow-hidden rounded-lg border border-red-200 bg-white shadow-sm"
        aria-labelledby="danger-zone-title"
      >
        <div className="border-b border-red-100 bg-red-50/80 px-4 py-3">
          <h2
            id="danger-zone-title"
            className="text-[15px] font-semibold text-red-900"
          >
            Zona de riesgo
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-red-800/90">
            Acciones que ocultan la ficha del listado o la borran de la base de
            datos. Revisá bien antes de continuar.
          </p>
        </div>

        <div className="divide-y divide-red-100">
          {activo ? (
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold text-[#1a1a1a]">
                  Archivar ficha
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  Oculta al paciente del dashboard principal (por ejemplo si ya no
                  se atiende acá). El historial sigue disponible en archivados.
                </p>
              </div>
              <button
                type="button"
                onClick={openArchiveModal}
                className="shrink-0 rounded-md border border-red-200 bg-white px-4 py-2 text-[13px] font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50"
              >
                Archivar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold text-[#1a1a1a]">
                  Volver a listar como activo
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  Estado actual:{" "}
                  <strong>
                    {ESTADO_PACIENTE_LABELS[patient.estado ?? "activo"]}
                  </strong>
                  . Podés devolver la ficha al listado principal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void aplicarEstado("activo")}
                className="shrink-0 rounded-md border border-red-200 bg-white px-4 py-2 text-[13px] font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50"
              >
                Reactivar
              </button>
            </div>
          )}

          {isAdmin ? (
            <div className="px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a]">
                    Eliminar esta ficha
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#555]">
                    Se borran todos los datos de este paciente en el servidor.
                    Esta acción no se puede deshacer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeletePanelOpen((v) => !v);
                    setDeleteInput("");
                  }}
                  className="shrink-0 self-start rounded-md border border-red-300 bg-white px-4 py-2 text-[13px] font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50"
                  aria-expanded={deletePanelOpen}
                  aria-controls={deletePanelId}
                >
                  {deletePanelOpen ? "Cerrar" : "Eliminar esta ficha"}
                </button>
              </div>

              {deletePanelOpen ? (
                <div
                  id={deletePanelId}
                  className="mt-4 rounded-md border border-red-200 bg-red-50/90 p-4"
                >
                  <p className="text-[13px] font-semibold text-red-950">
                    ¿Seguro que querés eliminar esta ficha?
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-red-900/90">
                    Se perderán las consultas, estudios y datos asociados
                    guardados aquí. Para confirmar, escribí el nombre del
                    paciente tal como figura en la ficha.
                  </p>
                  {!nombreConfirmacion ? (
                    <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-950">
                      La ficha no tiene nombre. Agregalo desde Editar ficha para
                      poder confirmar la eliminación.
                    </p>
                  ) : (
                    <>
                      <label
                        htmlFor={`${deletePanelId}-confirm`}
                        className="mt-4 block text-[12px] font-medium text-red-950"
                      >
                        Escribí{" "}
                        <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[13px]">
                          {nombreConfirmacion}
                        </span>{" "}
                        para confirmar
                      </label>
                      <input
                        id={`${deletePanelId}-confirm`}
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder={nombreConfirmacion}
                        className="mt-2 w-full max-w-md rounded-md border border-red-200 bg-white px-3 py-2 text-[14px] text-[#1a1a1a] shadow-inner outline-none ring-red-300 placeholder:text-[#aaa] focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      />
                    </>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!puedeEliminar}
                      onClick={eliminarDefinitivo}
                      className="rounded-md bg-red-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:text-red-100"
                    >
                      Entiendo las consecuencias, eliminar esta ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletePanelOpen(false);
                        setDeleteInput("");
                      }}
                      className="rounded-md border border-red-200 bg-white px-4 py-2 text-[13px] font-semibold text-[#555] hover:bg-red-50/50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        open={archiveConfirmOpen}
        onClose={closeArchiveModal}
        labelledBy="archive-patient-modal-title"
        maxWidthClass="max-w-[560px]"
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
    </>
  );
}

function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
