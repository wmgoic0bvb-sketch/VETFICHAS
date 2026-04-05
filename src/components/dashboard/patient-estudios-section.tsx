"use client";

import { useState } from "react";
import { EstudioUploadModal } from "@/components/dashboard/estudio-upload-modal";
import { usePatients } from "@/components/providers/patients-provider";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { formatFecha } from "@/lib/date-utils";
import type { Estudio, EstudioCategoria, Paciente } from "@/types/patient";
import { toast } from "sonner";

const categoriaBadgeClass: Record<EstudioCategoria, string> = {
  "Sangre / laboratorio": "bg-rose-100 text-rose-900",
  Radiografía: "bg-sky-100 text-sky-900",
  Ecografía: "bg-violet-100 text-violet-900",
  Otro: "bg-stone-100 text-stone-800",
};

function isImageType(ct: string) {
  return /^image\//i.test(ct);
}

function toProtectedBlobUrl(url: string): string {
  return `/api/blob/file?url=${encodeURIComponent(url)}`;
}

function EstudioHeader({ e }: { e: Estudio }) {
  const fechaStr = formatFecha(e.fecha.split("T")[0] ?? e.fecha);
  const tituloLine = e.titulo.trim() || e.nombreArchivo;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-xs text-[#888]">{fechaStr}</div>
      <span
        className={`mb-1.5 inline-block max-w-full rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${categoriaBadgeClass[e.categoria] ?? "bg-emerald-100 text-emerald-900"}`}
      >
        {e.categoria}
      </span>
      <div className="text-[15px] font-semibold leading-snug text-[#1a1a1a]">{tituloLine}</div>
    </div>
  );
}

function EstudioCard({
  e,
  onRemoveClick,
}: {
  e: Estudio;
  onRemoveClick: (e: Estudio) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `estudio-detail-${e.id}`;
  const triggerId = `estudio-trigger-${e.id}`;

  return (
    <div className="overflow-hidden rounded-[14px] border-l-[3px] border-[#5c1838]/35 bg-[#f5f0eb]">
      <button
        type="button"
        id={triggerId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-2 px-4 py-3.5 text-left transition-colors hover:bg-[#efeae2]"
      >
        <EstudioHeader e={e} />
        <span
          className={`mt-1 inline-block shrink-0 text-[10px] leading-none text-[#888] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="border-t border-[#e0d9cf] bg-[#faf8f5] px-4 py-3"
        >
          <div className="flex gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f0ebe4]">
              {isImageType(e.contentType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={toProtectedBlobUrl(e.url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">
                  📄
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="break-words text-[13px] leading-relaxed text-[#555]">
                <span className="text-[#888]">Archivo: </span>
                {e.nombreArchivo}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                <a
                  href={toProtectedBlobUrl(e.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-[#5c1838] underline"
                >
                  Abrir / descargar
                </a>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.preventDefault();
                    onRemoveClick(e);
                  }}
                  className="text-[13px] font-medium text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PatientEstudiosSection({ patient }: { patient: Paciente }) {
  const { removeEstudio } = usePatients();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [estudioPendingRemove, setEstudioPendingRemove] = useState<Estudio | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);

  const estudios = [...(patient.estudios ?? [])].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  const executeRemoveEstudio = async (e: Estudio) => {
    setRemoving(true);
    try {
      try {
        const res = await fetch("/api/blob", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: e.url }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || "No se pudo eliminar el archivo remoto");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error al eliminar el estudio.",
        );
        return;
      }
      await removeEstudio(patient.id, e.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section className="relative">
      <DbLoadingOverlay show={removing} />
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#5c1838]">
          Estudios (PDF / imágenes) ({estudios.length})
        </h2>
        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="shrink-0 rounded-xl bg-[#5c1838] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#401127] sm:w-auto sm:self-center"
        >
          + Subir estudio
        </button>
      </div>

      <EstudioUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        patientId={patient.id}
      />

      <ConfirmAlertDialog
        open={estudioPendingRemove !== null}
        onOpenChange={(next) => {
          if (!next) setEstudioPendingRemove(null);
        }}
        title="¿Quitar este estudio?"
        description="Se eliminará de la ficha y del almacenamiento. Esta acción no se puede deshacer."
        confirmLabel="Quitar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => {
          const e = estudioPendingRemove;
          setEstudioPendingRemove(null);
          if (e) void executeRemoveEstudio(e);
        }}
      />

      {estudios.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#aaa]">
          Sin estudios adjuntos
        </div>
      ) : (
        <ul className="list-none space-y-4 p-0">
          {estudios.map((e) => (
            <li key={e.id}>
              <EstudioCard e={e} onRemoveClick={setEstudioPendingRemove} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
