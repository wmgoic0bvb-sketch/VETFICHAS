"use client";

import { useState } from "react";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";

export type VacunaRow = {
  id: string;
  nombre: string;
  descripcion: string;
};

export function AdminVacunaForm({
  mode,
  initial,
  onCancel,
  onSaved,
}: {
  mode: "create" | "edit";
  initial?: VacunaRow;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/vacunas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof j.error === "string" ? j.error : "Error al crear");
          return;
        }
        await onSaved();
        return;
      }

      if (!initial) return;
      const res = await fetch(`/api/admin/vacunas/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Error al guardar");
        return;
      }
      await onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="vacuna-nombre"
            className="mb-1 block text-sm font-medium text-[#333]"
          >
            Nombre
          </label>
          <input
            id="vacuna-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#5c1838]"
            required
            autoComplete="off"
            maxLength={160}
          />
        </div>
        <div>
          <label
            htmlFor="vacuna-desc"
            className="mb-1 block text-sm font-medium text-[#333]"
          >
            Descripción (contra qué protege)
          </label>
          <textarea
            id="vacuna-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-[#e8e0d8] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#5c1838]"
            placeholder="Ej.: Panleucopenia, rinotraqueitis, calicivirus…"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#5c1838] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#401127] disabled:opacity-60"
          >
            {mode === "create" ? "Crear vacuna" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#e8e0d8] bg-white px-5 py-2.5 text-sm font-medium text-[#555] hover:bg-[#f5f0eb]"
          >
            Cancelar
          </button>
        </div>
      </form>
      <DbLoadingOverlay show={submitting} />
    </>
  );
}
