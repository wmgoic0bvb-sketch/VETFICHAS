"use client";

import { useMemo, useState } from "react";
import { EstudioUploadModal } from "@/components/dashboard/estudio-upload-modal";
import { EstudiosGroupCard } from "@/components/dashboard/estudios-group-card";
import { usePatients } from "@/components/providers/patients-provider";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import type { Estudio, Paciente } from "@/types/patient";
import { toast } from "sonner";

function toProtectedBlobUrl(url: string): string {
  return `/api/blob/file?url=${encodeURIComponent(url)}`;
}

interface EstudioGroup {
  key: string;
  estudios: Estudio[];
}

function groupEstudios(estudios: Estudio[]): EstudioGroup[] {
  const groups = new Map<string, EstudioGroup>();
  for (const e of estudios) {
    const key = e.loteId?.trim() ? `lote:${e.loteId}` : `single:${e.id}`;
    const current = groups.get(key);
    if (current) current.estudios.push(e);
    else groups.set(key, { key, estudios: [e] });
  }
  return [...groups.values()];
}

function fileExt(estudio: Estudio): string {
  const fromName = estudio.nombreArchivo.split(".").pop()?.trim().toLowerCase() ?? "";
  if (fromName) return fromName;
  if (estudio.contentType === "application/pdf") return "pdf";
  if (estudio.contentType.startsWith("image/")) return estudio.contentType.split("/")[1] ?? "jpg";
  return "bin";
}

function sanitizeFilenamePart(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function estudioTipoDescarga(categoria: Estudio["categoria"]): string {
  if (categoria === "Sangre / laboratorio") return "Laboratorio";
  return categoria;
}

export function PatientEstudiosSection({ patient }: { patient: Paciente }) {
  const { removeEstudio } = usePatients();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [estudioPendingRemove, setEstudioPendingRemove] = useState<Estudio | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const estudios = [...(patient.estudios ?? [])].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
  const grupos = useMemo(() => groupEstudios(estudios), [estudios]);
  const selectedGroups = grupos.filter((g) => selectedGroupKeys.includes(g.key));
  const selectedFilesCount = selectedGroups.reduce((acc, g) => acc + g.estudios.length, 0);

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

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedGroupKeys([]);
  };

  const toggleGroupSelection = (key: string) => {
    setSelectedGroupKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const downloadSelected = async () => {
    if (selectedGroups.length === 0) {
      toast.error("Seleccioná al menos una card para descargar.");
      return;
    }
    const petName = sanitizeFilenamePart(patient.nombre) || "Mascota";
    const usedNames = new Map<string, number>();
    setDownloading(true);
    try {
      for (const group of selectedGroups) {
        for (const estudio of group.estudios) {
          const categoria =
            sanitizeFilenamePart(estudioTipoDescarga(estudio.categoria)) || "Estudio";
          const ext = fileExt(estudio);
          const base = `${categoria}-${petName}`;
          const prevUses = usedNames.get(`${base}.${ext}`) ?? 0;
          const nextUses = prevUses + 1;
          usedNames.set(`${base}.${ext}`, nextUses);
          const suffix = nextUses > 1 ? `-${nextUses}` : "";
          const filename = `${base}${suffix}.${ext}`;
          const res = await fetch(toProtectedBlobUrl(estudio.url));
          if (!res.ok) throw new Error("No se pudo descargar uno de los archivos.");
          const blob = await res.blob();
          const localUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = localUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(localUrl);
        }
      }
      toast.success("Descargas iniciadas.");
      exitSelectionMode();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al descargar.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="relative">
      <DbLoadingOverlay show={removing || downloading} />
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#5c1838]">
          Estudios (PDF / imágenes) ({estudios.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={() => void downloadSelected()}
                disabled={selectedGroupKeys.length === 0 || downloading}
                className="rounded-xl bg-[#5c1838] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#401127] disabled:opacity-50"
              >
                Descargar seleccionados ({selectedFilesCount})
              </button>
              <button
                type="button"
                onClick={exitSelectionMode}
                disabled={downloading}
                className="rounded-xl border border-[#5c1838]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#5c1838] hover:bg-[#f8f1f5] disabled:opacity-50"
              >
                Cancelar selección
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSelectionMode(true)}
              aria-label="Seleccionar para descargar"
              title="Seleccionar para descargar"
              className="rounded-xl border border-[#5c1838]/30 bg-[#f5f0eb] px-3 py-2.5 text-[#5c1838] transition-colors hover:bg-[#efe7df]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="shrink-0 rounded-xl bg-[#5c1838] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#401127] sm:w-auto sm:self-center"
          >
            + Subir estudio
          </button>
        </div>
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

      {grupos.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#aaa]">
          Sin estudios adjuntos
        </div>
      ) : (
        <ul className="list-none space-y-4 p-0">
          {grupos.map((group) => (
            <li key={group.key}>
              <EstudiosGroupCard
                group={group.estudios}
                selected={selectedGroupKeys.includes(group.key)}
                selectable={selectionMode}
                onToggleSelect={() => toggleGroupSelection(group.key)}
                onRemoveClick={setEstudioPendingRemove}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
