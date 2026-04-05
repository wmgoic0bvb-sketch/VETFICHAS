"use client";

import { useEffect, useRef, useState } from "react";
import { usePatients } from "@/components/providers/patients-provider";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import type { EstudioCategoria } from "@/types/patient";

const CATEGORIAS: EstudioCategoria[] = [
  "Sangre / laboratorio",
  "Radiografía",
  "Ecografía",
  "Otro",
];

export function EstudioUploadModal({
  open,
  onClose,
  patientId,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string;
}) {
  const { addEstudio } = usePatients();
  const [categoria, setCategoria] = useState<EstudioCategoria>("Sangre / laboratorio");
  const [titulo, setTitulo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setCategoria("Sangre / laboratorio");
    setTitulo("");
    setError(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [open]);

  const handleFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("patientId", patientId);

      const res = await fetch("/api/blob", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        contentType?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Error al subir el archivo");
      }

      if (!data.url || !data.contentType) {
        throw new Error("Respuesta incompleta del servidor");
      }

      await addEstudio(patientId, {
        categoria,
        titulo: titulo.trim(),
        url: data.url,
        nombreArchivo: file.name,
        contentType: data.contentType,
      });
      setTitulo("");
      if (inputRef.current) inputRef.current.value = "";
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const requestClose = () => {
    if (uploading) return;
    onClose();
  };

  const inputBase =
    "w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#2d6a4f] focus:bg-white";

  return (
    <Modal
      open={open}
      onClose={requestClose}
      labelledBy="estudio-upload-title"
      overlayClassName="z-[210]"
    >
      <div className="relative">
        <DbLoadingOverlay
          show={uploading}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/85 backdrop-blur-sm"
        />
      <button
        type="button"
        onClick={requestClose}
        disabled={uploading}
        className="absolute right-[18px] top-4 text-[22px] leading-none text-[#aaa] hover:text-[#333] disabled:opacity-50"
        aria-label="Cerrar"
      >
        ✕
      </button>
      <h2 id="estudio-upload-title" className="text-xl font-bold text-[#1a1a1a]">
        Subir estudio 📎
      </h2>
      <div className="mt-4 space-y-4 rounded-[14px] bg-[#f8f6f3] p-4">
        <div>
          <label
            htmlFor="estudio-modal-categoria"
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Tipo
          </label>
          <select
            id="estudio-modal-categoria"
            value={categoria}
            onChange={(ev) =>
              setCategoria(ev.target.value as EstudioCategoria)
            }
            disabled={uploading}
            className={`${inputBase} cursor-pointer disabled:opacity-60`}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="estudio-modal-titulo"
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Título o nota (opcional)
          </label>
          <input
            id="estudio-modal-titulo"
            value={titulo}
            onChange={(ev) => setTitulo(ev.target.value)}
            placeholder="Ej. hemograma, tórax VD…"
            disabled={uploading}
            className={`${inputBase} disabled:opacity-60`}
          />
        </div>
        <div>
          <label
            htmlFor="estudio-modal-file"
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Archivo (PDF, JPG, PNG…)
          </label>
          <input
            ref={inputRef}
            id="estudio-modal-file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif,.pdf"
            disabled={uploading}
            onChange={(ev) => void handleFile(ev.target.files)}
            className="block w-full text-sm text-[#555] file:mr-3 file:rounded-lg file:border-0 file:bg-[#2d6a4f] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1b4332] disabled:opacity-60"
          />
          <p className="mt-1 text-[11px] text-[#999]">
            Máx. 4 MB. Se guarda en Vercel Blob (requiere token en el servidor).
          </p>
        </div>
        {error ? (
          <p className="text-[13px] font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={requestClose}
          disabled={uploading}
          className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-3 text-[15px] font-medium text-[#555] hover:bg-[#f5f0eb] disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
      </div>
    </Modal>
  );
}
