"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  draftFromPatient,
} from "@/components/dashboard/patient-ficha-edit-form";
import { usePatients } from "@/components/providers/patients-provider";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
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

  const nombreConfirmacion = patient.nombre.trim();
  const puedeEliminar =
    deleteInput.trim() === nombreConfirmacion && nombreConfirmacion.length > 0;

  useEffect(() => {
    setDeletePanelOpen(false);
    setDeleteInput("");
  }, [patient.id]);

  const aplicarEstado = async (estado: EstadoPaciente) => {
    await updatePatient(patient.id, { ...draftFromPatient(patient), estado });
  };

  const eliminarDefinitivo = async () => {
    if (!isAdmin || !puedeEliminar) return;
    await removePatient(patient.id);
    router.push("/");
  };

  const activo = esPacienteActivo(patient);

  return (
    <>
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
                onClick={() => setArchiveConfirmOpen(true)}
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

      <ConfirmAlertDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="¿Archivar esta ficha?"
        description="Dejará de aparecer en el listado principal. El historial se conserva y podés verla en «fichas archivadas»."
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          void aplicarEstado("archivado").finally(() =>
            setArchiveConfirmOpen(false),
          );
        }}
      />
    </>
  );
}
