"use client";

import { useState } from "react";
import {
  diasCalendarioHastaFechaHora,
  esControlFechaPasadaOHoy,
  esControlFechaYaOcurrida,
  fechaHoraGuardadaToMaskedInputs,
} from "@/lib/proximo-control-utils";
import { getSucursalById } from "@/lib/sucursales";
import type { ProximoControl } from "@/types/patient";

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
    <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-900">
      Programado
    </span>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ControlCard({
  pc,
  onUpdate,
  onRemove,
  onEdit,
  setPersisting,
}: {
  pc: ProximoControl;
  onUpdate: (id: string, patch: Partial<Omit<ProximoControl, "id">>) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onEdit: (id: string) => void;
  setPersisting: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const yaOcurrio = esControlFechaYaOcurrida(pc.fechaHora);
  const puedeMarcarAsistencia = esControlFechaPasadaOHoy(pc.fechaHora);
  const vistaFecha = fechaHoraGuardadaToMaskedInputs(pc.fechaHora).fecha;
  const sucNombre = getSucursalById(pc.sucursalId)?.nombre ?? pc.sucursalId;

  const badge = pc.asistencia === "asistio" ? (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
      Asistió
    </span>
  ) : pc.asistencia === "ausente" ? (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800">
      Ausente
    </span>
  ) : (
    badgeFor(pc.fechaHora)
  );

  return (
    <li
      className={`rounded-xl border ${
        yaOcurrio
          ? "border-stone-200 bg-stone-100/90 text-stone-500"
          : "border-[#b7d5c9] bg-[#f0faf5] text-[#1a1a1a]"
      }`}
    >
      {/* Preview compacta */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`text-base font-semibold ${yaOcurrio ? "text-stone-500" : "text-[#401127]"}`}>
            {vistaFecha || pc.fechaHora}
          </span>
          {badge}
          <span className={`text-xs ${yaOcurrio ? "text-stone-400" : "text-[#888]"}`}>
            📍 {sucNombre}
          </span>
        </div>
        <ChevronDown open={open} />
      </button>

      {/* Nota visible en preview */}
      {pc.nota ? (
        <p className={`px-4 pb-2 text-sm leading-relaxed ${yaOcurrio ? "text-stone-500" : "text-[#333]"}`}>
          {pc.nota}
        </p>
      ) : null}

      {/* Desplegable */}
      {open ? (
        <div className="border-t border-inherit px-4 pb-4 pt-3">

          <div className="flex flex-wrap gap-2">
            {puedeMarcarAsistencia ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setPersisting(true);
                    void Promise.resolve(
                      onUpdate(pc.id, { asistencia: pc.asistencia === "asistio" ? null : "asistio" }),
                    ).finally(() => setPersisting(false));
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    pc.asistencia === "asistio"
                      ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                      : "border-emerald-300 bg-transparent text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  Asistió
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersisting(true);
                    void Promise.resolve(
                      onUpdate(pc.id, { asistencia: pc.asistencia === "ausente" ? null : "ausente" }),
                    ).finally(() => setPersisting(false));
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    pc.asistencia === "ausente"
                      ? "border-red-400 bg-red-100 text-red-800"
                      : "border-red-300 bg-transparent text-red-600 hover:bg-red-50"
                  }`}
                >
                  Ausente
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled={yaOcurrio}
              title={yaOcurrio ? "El control ya se realizó. Agregá uno nuevo abajo." : undefined}
              onClick={() => onEdit(pc.id)}
              className={
                yaOcurrio
                  ? "cursor-not-allowed rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-400"
                  : "rounded-xl border border-[#5c1838] bg-white px-3 py-2 text-sm font-medium text-[#401127] hover:bg-[#e8f5ef]"
              }
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                setPersisting(true);
                void Promise.resolve(onRemove(pc.id)).finally(() => setPersisting(false));
              }}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                yaOcurrio
                  ? "border-stone-300 bg-stone-50/80 text-stone-600 hover:bg-stone-100"
                  : "border-[#e8e0d8] bg-transparent text-[#666] hover:bg-[#f5f0eb]"
              }`}
            >
              Quitar
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
