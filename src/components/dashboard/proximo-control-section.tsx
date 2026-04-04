"use client";

import { useEffect, useMemo, useState } from "react";
import {
  combinarMaskedAFechaHoraGuardada,
  diasCalendarioHastaFechaHora,
  esControlFechaYaOcurrida,
  esFechaMaskedAnteriorAHoy,
  fechaHoraGuardadaToMaskedInputs,
  isFechaHoraProximoControlValida,
  maskInputFechaDDMMYYYY,
  sortProximosControlesPorFecha,
} from "@/lib/proximo-control-utils";
import {
  DEFAULT_SUCURSAL_ID,
  getSucursalById,
  SUCURSALES,
} from "@/lib/sucursales";
import type { Paciente, ProximoControl } from "@/types/patient";

const HORA_DEFECTO_GUARDADO = "09:00";
const FECHA_COMPLETA_DDMMYYYY = /^\d{2}\/\d{2}\/\d{4}$/;

const shellClass =
  "rounded-2xl border border-[#ebe6df] bg-white p-5 shadow-sm";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 font-mono text-[15px] tabular-nums tracking-wide outline-none transition-colors placeholder:text-[#c4bbb0] focus:border-[#2d6a4f] focus:bg-white";

function badgeFor(fechaHora: string) {
  const d = diasCalendarioHastaFechaHora(fechaHora);
  if (d !== null && d >= 0 && d <= 7) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
        Próximo
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
      Programado
    </span>
  );
}

type FormMode = null | { type: "new" } | { type: "edit"; id: string };

export function ProximosControlesSection({
  patient,
  onAdd,
  onUpdate,
  onRemove,
}: {
  patient: Paciente;
  onAdd: (data: Omit<ProximoControl, "id">) => void;
  onUpdate: (
    controlId: string,
    patch: Partial<Omit<ProximoControl, "id">>,
  ) => void;
  onRemove: (controlId: string) => void;
}) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [fechaInput, setFechaInput] = useState("");
  const [sucursalId, setSucursalId] = useState(DEFAULT_SUCURSAL_ID);
  const [nota, setNota] = useState("");
  const [fechaHoraError, setFechaHoraError] = useState<string | null>(null);

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

  const guardarForm = () => {
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
    if (formMode?.type === "edit") {
      const prev = patient.proximosControles.find((c) => c.id === formMode.id);
      onUpdate(formMode.id, {
        fechaHora: t,
        sucursalId,
        nota: notaTrim || undefined,
        asistencia: prev?.asistencia ?? null,
      });
    } else {
      onAdd({
        fechaHora: t,
        sucursalId,
        nota: notaTrim || undefined,
        asistencia: null,
      });
    }
    setFormMode(null);
  };

  const abrirNuevo = () => {
    setFormMode({ type: "new" });
  };

  return (
    <section className={shellClass}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
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
            className="mt-3 rounded-xl bg-[#2d6a4f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1b4332]"
          >
            Programar próximo control
          </button>
        </div>
      ) : null}

      <ul className="space-y-3">
        {ordenados.map((pc) => {
          const yaOcurrio = esControlFechaYaOcurrida(pc.fechaHora);
          const vistaFecha = fechaHoraGuardadaToMaskedInputs(pc.fechaHora).fecha;
          return (
            <li
              key={pc.id}
              className={`rounded-xl border p-4 ${
                yaOcurrio
                  ? "border-stone-200 bg-stone-100/90 text-stone-500"
                  : "border-[#b7d5c9] bg-[#f0faf5] text-[#1a1a1a]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className={`text-lg font-semibold ${
                    yaOcurrio ? "text-stone-500" : "text-[#1b4332]"
                  }`}
                >
                  {vistaFecha || pc.fechaHora}
                </span>
                {yaOcurrio ? (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate(pc.id, {
                        asistencia:
                          pc.asistencia === "ausente" ? "asistio" : "ausente",
                      })
                    }
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                      pc.asistencia === "ausente"
                        ? "bg-red-100 text-red-800 ring-red-300 focus-visible:ring-red-400"
                        : "bg-emerald-100 text-emerald-900 ring-emerald-300 focus-visible:ring-emerald-500"
                    }`}
                  >
                    {pc.asistencia === "ausente" ? "Ausente" : "Realizado"}
                  </button>
                ) : (
                  badgeFor(pc.fechaHora)
                )}
              </div>

              {!yaOcurrio ? (
                <p className="mt-2 text-sm font-medium text-[#1a1a1a]">
                  📍 {getSucursalById(pc.sucursalId)?.nombre ?? pc.sucursalId}
                </p>
              ) : null}

              {pc.nota ? (
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    yaOcurrio ? "text-stone-500" : "text-[#333]"
                  }`}
                >
                  {pc.nota}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={yaOcurrio}
                  title={
                    yaOcurrio
                      ? "El control ya se realizó. Agregá uno nuevo abajo."
                      : undefined
                  }
                  onClick={() => setFormMode({ type: "edit", id: pc.id })}
                  className={
                    yaOcurrio
                      ? "cursor-not-allowed rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-400"
                      : "rounded-xl border border-[#2d6a4f] bg-white px-3 py-2 text-sm font-medium text-[#1b4332] hover:bg-[#e8f5ef]"
                  }
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(pc.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    yaOcurrio
                      ? "border-stone-300 bg-stone-50/80 text-stone-600 hover:bg-stone-100"
                      : "border-[#e8e0d8] bg-transparent text-[#666] hover:bg-[#f5f0eb]"
                  }`}
                >
                  Quitar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {ordenados.length > 0 && !formMode ? (
        <button
          type="button"
          onClick={abrirNuevo}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-[#b7d5c9] bg-transparent py-3 text-sm font-semibold text-[#2d6a4f] hover:bg-[#f0faf5]"
        >
          + Agregar otro próximo control
        </button>
      ) : null}

      {formMode ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-[#2d6a4f]/30 bg-[#f8faf8] p-4">
          <p className="text-[13px] font-semibold text-[#1b4332]">
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
              className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f]"
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
              className="min-h-[72px] w-full resize-y rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#2d6a4f]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={guardarForm}
              className="rounded-xl bg-[#2d6a4f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1b4332]"
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
