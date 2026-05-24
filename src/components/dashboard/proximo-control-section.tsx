"use client";

import { useEffect, useMemo, useState } from "react";
import {
  combinarMaskedAFechaHoraGuardada,
  esFechaMaskedAnteriorAHoy,
  fechaHoraGuardadaToMaskedInputs,
  isFechaHoraProximoControlValida,
  maskInputFechaDDMMYYYY,
  sortProximosControlesPorFecha,
} from "@/lib/proximo-control-utils";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { ControlCard } from "./control-card";
import { DEFAULT_SUCURSAL_ID, SUCURSALES } from "@/lib/sucursales";
import type { Paciente, ProximoControl } from "@/types/patient";

const HORA_DEFECTO_GUARDADO = "09:00";
const FECHA_COMPLETA_DDMMYYYY = /^\d{2}\/\d{2}\/\d{4}$/;

const shellClass =
  "rounded-2xl border border-[#ebe6df] bg-white p-5 shadow-sm";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 font-mono text-[15px] tabular-nums tracking-wide outline-none transition-colors placeholder:text-[#c4bbb0] focus:border-[#5c1838] focus:bg-white";

type FormMode = null | { type: "new" } | { type: "edit"; id: string };

export function ProximosControlesSection({
  patient,
  onAdd,
  onUpdate,
  onRemove,
}: {
  patient: Paciente;
  onAdd: (data: Omit<ProximoControl, "id">) => void | Promise<void>;
  onUpdate: (
    controlId: string,
    patch: Partial<Omit<ProximoControl, "id">>,
  ) => void | Promise<void>;
  onRemove: (controlId: string) => void | Promise<void>;
}) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [fechaInput, setFechaInput] = useState("");
  const [sucursalId, setSucursalId] = useState(DEFAULT_SUCURSAL_ID);
  const [nota, setNota] = useState("");
  const [fechaHoraError, setFechaHoraError] = useState<string | null>(null);
  const [persisting, setPersisting] = useState(false);

  const ordenados = useMemo(
    () => sortProximosControlesPorFecha(patient.proximosControles),
    [patient.proximosControles],
  );

  const resetFormFields = () => {
    setFechaInput("");
    setSucursalId(DEFAULT_SUCURSAL_ID);
    setNota("");
    setFechaHoraError(null);
  };

  useEffect(() => {
    if (!formMode) return;
    if (formMode.type === "new") {
      resetFormFields();
      return;
    }
    const pc = patient.proximosControles.find((c) => c.id === formMode.id);
    if (pc) {
      setFechaInput(fechaHoraGuardadaToMaskedInputs(pc.fechaHora).fecha);
      setSucursalId(pc.sucursalId);
      setNota(pc.nota ?? "");
      setFechaHoraError(null);
    }
  }, [formMode, patient.proximosControles]);

  const handleFechaChange = (raw: string) => {
    const next = maskInputFechaDDMMYYYY(raw);
    if (
      FECHA_COMPLETA_DDMMYYYY.test(next) &&
      esFechaMaskedAnteriorAHoy(next)
    ) {
      setFechaHoraError("La fecha no puede ser anterior a hoy.");
      return;
    }
    if (fechaHoraError) setFechaHoraError(null);
    setFechaInput(next);
  };

  const guardarForm = async () => {
    const fecha = fechaInput.trim();
    if (!fecha) {
      setFechaHoraError("Completá la fecha.");
      return;
    }
    if (FECHA_COMPLETA_DDMMYYYY.test(fecha) && esFechaMaskedAnteriorAHoy(fecha)) {
      setFechaHoraError("La fecha no puede ser anterior a hoy.");
      return;
    }
    const t = combinarMaskedAFechaHoraGuardada(fecha, HORA_DEFECTO_GUARDADO);
    if (!isFechaHoraProximoControlValida(t)) {
      setFechaHoraError("Revisá la fecha (DD/MM/AAAA).");
      return;
    }
    if (!sucursalId) {
      setFechaHoraError("Elegí una sucursal.");
      return;
    }
    setFechaHoraError(null);
    const notaTrim = nota.trim();
    setPersisting(true);
    try {
      if (formMode?.type === "edit") {
        const prev = patient.proximosControles.find((c) => c.id === formMode.id);
        await onUpdate(formMode.id, {
          fechaHora: t,
          sucursalId,
          nota: notaTrim || undefined,
          asistencia: prev?.asistencia ?? null,
        });
      } else {
        await onAdd({
          fechaHora: t,
          sucursalId,
          nota: notaTrim || undefined,
          asistencia: null,
        });
      }
      setFormMode(null);
    } finally {
      setPersisting(false);
    }
  };

  const abrirNuevo = () => {
    setFormMode({ type: "new" });
  };

  return (
    <section className={`relative ${shellClass}`}>
      <DbLoadingOverlay show={persisting} />
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#5c1838]">
        Próximos controles
      </h2>

      {ordenados.length === 0 && !formMode ? (
        <div className="rounded-xl border border-dashed border-[#c4bbb0] bg-[#faf8f5] px-4 py-6 text-center">
          <p className="text-sm text-[#666]">
            Todavía no hay controles programados.
          </p>
          <button
            type="button"
            onClick={abrirNuevo}
            className="mt-3 rounded-xl bg-[#5c1838] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#401127]"
          >
            Programar próximo control
          </button>
        </div>
      ) : null}

      <ul className="space-y-2">
        {ordenados.map((pc) => (
          <ControlCard
            key={pc.id}
            pc={pc}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onEdit={(id) => setFormMode({ type: "edit", id })}
            setPersisting={setPersisting}
          />
        ))}
      </ul>

      {ordenados.length > 0 && !formMode ? (
        <button
          type="button"
          onClick={abrirNuevo}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-[#b7d5c9] bg-transparent py-3 text-sm font-semibold text-[#5c1838] hover:bg-[#f0faf5]"
        >
          + Próximo control
        </button>
      ) : null}

      {formMode ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-[#5c1838]/30 bg-[#f8faf8] p-4">
          <p className="text-[13px] font-semibold text-[#401127]">
            {formMode.type === "edit"
              ? "Editar control"
              : "Nuevo próximo control"}
          </p>
          <div
            role="group"
            aria-labelledby="proximo-fecha-group-title"
            className={`rounded-2xl border border-[#e8e0d8] bg-[#faf9f7] p-4 ${
              fechaHoraError ? "ring-2 ring-red-200" : ""
            }`}
          >
            <p
              id="proximo-fecha-group-title"
              className="mb-3 text-[13px] font-semibold text-[#444]"
            >
              Fecha
            </p>
            <div>
              <label
                htmlFor="proximo-fecha-form"
                className="mb-1.5 block text-[12px] font-medium text-[#666]"
              >
                Día del control
              </label>
              <input
                id="proximo-fecha-form"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                placeholder="DD/MM/AAAA"
                value={fechaInput}
                onChange={(e) => handleFechaChange(e.target.value)}
                className={inputClass}
              />
            </div>
            {fechaHoraError ? (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {fechaHoraError}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="proximo-sucursal-form"
              className="mb-1.5 block text-[13px] font-semibold text-[#555]"
            >
              Sucursal *
            </label>
            <select
              id="proximo-sucursal-form"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838]"
            >
              {SUCURSALES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="proximo-nota-form"
              className="mb-1.5 block text-[13px] font-semibold text-[#555]"
            >
              Nota (opcional)
            </label>
            <textarea
              id="proximo-nota-form"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              placeholder="Ej: traer análisis previos, ayuno..."
              className="min-h-[72px] w-full resize-y rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#5c1838]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void guardarForm()}
              disabled={persisting}
              className="rounded-xl bg-[#5c1838] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#401127] disabled:opacity-60"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setFormMode(null);
                setFechaHoraError(null);
              }}
              className="rounded-xl border border-[#e8e0d8] bg-transparent px-4 py-2.5 text-sm font-medium text-[#555] hover:bg-[#f5f0eb]"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
