"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { usePatients } from "@/components/providers/patients-provider";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { mismoDia } from "@/lib/calendario-fecha";
import { pacientesActividadDelDia } from "@/lib/calendario-paciente-actividad";
import { parseFechaHoraLocal } from "@/lib/proximo-control-utils";
import { SUCURSALES } from "@/lib/sucursales";
import { MiniCalendario } from "./mini-calendario";
import { useCalendarioTour } from "./use-calendario-tour";
import {
  CalendarioSeccionActividadFichas,
  CalendarioSeccionControles,
  type ControlDelDia,
} from "./calendario-secciones-dia";
import "driver.js/dist/driver.css";

function formatDDMMAAAA(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function esControlDeDia(fechaHora: string, dia: Date): boolean {
  const dt = parseFechaHoraLocal(fechaHora);
  if (!dt) return false;
  return mismoDia(dt, dia);
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function CalendarioView() {
  const { patients, ready, updateProximoControl } = usePatients();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [filtroSucursal, setFiltroSucursal] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mostrarCalendario) return;
    function handler(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setMostrarCalendario(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mostrarCalendario]);

  const controles = useMemo((): ControlDelDia[] => {
    const result: ControlDelDia[] = [];
    for (const p of patients) {
      for (const c of p.proximosControles) {
        if (!esControlDeDia(c.fechaHora, fechaSeleccionada)) continue;
        if (filtroSucursal && c.sucursalId !== filtroSucursal) continue;
        result.push({ paciente: p, control: c });
      }
    }
    result.sort((a, b) => {
      const ta = parseFechaHoraLocal(a.control.fechaHora)?.getTime() ?? 0;
      const tb = parseFechaHoraLocal(b.control.fechaHora)?.getTime() ?? 0;
      return ta - tb;
    });
    return result;
  }, [patients, fechaSeleccionada, filtroSucursal]);

  const actividades = useMemo(
    () =>
      pacientesActividadDelDia(patients, fechaSeleccionada, filtroSucursal),
    [patients, fechaSeleccionada, filtroSucursal],
  );

  const handleSetAsistencia = useCallback(
    (
      pacienteId: string,
      controlId: string,
      asistencia: "asistio" | "ausente" | null,
    ) => {
      void updateProximoControl(pacienteId, controlId, { asistencia });
    },
    [updateProximoControl],
  );

  useCalendarioTour(ready, controles.length > 0);

  const hoy = new Date();
  const esHoy = mismoDia(fechaSeleccionada, hoy);
  const fechaLabel = formatDDMMAAAA(fechaSeleccionada);
  const totalAsistieron = controles.filter(
    (c) => c.control.asistencia === "asistio",
  ).length;

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <LottieSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#5c1838]">Calendario</h1>
          <p className="mt-0.5 text-sm text-[#888]">
            {esHoy ? "Hoy" : fechaLabel}
            {esHoy ? ` · ${fechaLabel}` : null}
            {controles.length > 0 ? (
              <span className="ml-2 text-xs text-[#aaa]">
                {totalAsistieron}/{controles.length} controles
              </span>
            ) : null}
            {actividades.length > 0 ? (
              <span className="ml-2 text-xs text-amber-800/80">
                · {actividades.length} paciente
                {actividades.length === 1 ? "" : "s"} con actividad en fichas
              </span>
            ) : null}
          </p>
        </div>

        <div className="relative" id="tour-selector-fecha">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setMostrarCalendario((v) => !v)}
            aria-label="Seleccionar fecha"
            aria-expanded={mostrarCalendario}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              mostrarCalendario
                ? "border-[#5c1838] bg-[#5c1838]/8 text-[#5c1838]"
                : "border-[#e8e0d8] bg-white text-[#555] hover:border-[#c4a898] hover:text-[#5c1838]"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            {!esHoy ? <span>{fechaLabel}</span> : null}
          </button>

          {mostrarCalendario ? (
            <div
              ref={popoverRef}
              className="absolute right-0 top-full z-50 mt-2"
            >
              <MiniCalendario
                selected={fechaSeleccionada}
                onSelect={(d) => {
                  setFechaSeleccionada(d);
                  setMostrarCalendario(false);
                }}
                patients={patients}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div id="tour-filtro-sucursal" className="mb-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFiltroSucursal(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filtroSucursal === null
              ? "bg-[#5c1838] text-white"
              : "bg-[#f5f0eb] text-[#666] hover:bg-[#ebe3db]"
          }`}
        >
          Todas
        </button>
        {SUCURSALES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              setFiltroSucursal(s.id === filtroSucursal ? null : s.id)
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroSucursal === s.id
                ? "bg-[#5c1838] text-white"
                : "bg-[#f5f0eb] text-[#666] hover:bg-[#ebe3db]"
            }`}
          >
            {s.nombre}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] text-[#aaa]">
        Mini calendario: punto oscuro = control; punto ámbar = alta o consulta.
      </p>

      <CalendarioSeccionControles
        controles={controles}
        onSetAsistencia={handleSetAsistencia}
      />
      <CalendarioSeccionActividadFichas actividades={actividades} />
    </div>
  );
}
