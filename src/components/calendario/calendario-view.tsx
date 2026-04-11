"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePatients } from "@/components/providers/patients-provider";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { parseFechaHoraLocal } from "@/lib/proximo-control-utils";
import { buildWhatsAppUrl } from "@/lib/phone-utils";
import { getSucursalById, SUCURSALES } from "@/lib/sucursales";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { MiniCalendario, mismoDia } from "./mini-calendario";
import { useCalendarioTour } from "./use-calendario-tour";
import "driver.js/dist/driver.css";
import type { Paciente, ProximoControl } from "@/types/patient";

// TODO: Filtro temporal por string hardcodeado (sucursalId === "roca-1844", etc).
// Reemplazar cuando cada control tenga sucursal asignada desde DB.

function formatDDMMAAAA(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function esControlDeDia(fechaHora: string, dia: Date): boolean {
  const dt = parseFechaHoraLocal(fechaHora);
  if (!dt) return false;
  return mismoDia(dt, dia);
}

interface ControlDelDia {
  paciente: Paciente;
  control: ProximoControl;
}

function formatDueños(p: Paciente): string {
  return p.dueños.filter((d) => d.nombre.trim()).map((d) => d.nombre).join(" / ");
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FilaControl({
  paciente,
  control,
  onToggle,
  isFirst = false,
}: {
  paciente: Paciente;
  control: ProximoControl;
  onToggle: (pacienteId: string, controlId: string, checked: boolean) => void;
  isFirst?: boolean;
}) {
  const asistio = control.asistencia === "asistio";
  const sucursal = getSucursalById(control.sucursalId);
  const dueños = formatDueños(paciente);

  const tel = paciente.dueños[0]?.tel?.trim();
  const nombreDueño = paciente.dueños[0]?.nombre?.trim();
  const sucNombre = sucursal?.nombre ?? "";
  const mensaje = `Hola! Nos comunicamos de ZooVet para recordarte que hoy ${paciente.nombre} tiene control programado${sucNombre ? ` en ${sucNombre}` : ""}. ¡Gracias!`;
  const waUrl = tel ? buildWhatsAppUrl(tel, mensaje) : null;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#e8e0d8] bg-white px-4 py-4 transition-colors hover:bg-[#faf7f5]">
      <button
        id={isFirst ? "tour-checkbox-asistencia" : undefined}
        type="button"
        onClick={() => onToggle(paciente.id, control.id, !asistio)}
        title={asistio ? "Desmarcar asistencia" : "El paciente asistió"}
        aria-label={asistio ? "Desmarcar asistencia" : "Marcar asistencia"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          asistio
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-[#ccc] bg-white hover:border-emerald-400"
        }`}
      >
        {asistio ? <CheckIcon className="h-3.5 w-3.5" /> : null}
      </button>

      <Link
        href={`/patient/${paciente.id}`}
        className="min-w-0 flex-1"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">
            {paciente.especie === "Perro" ? "🐶" : "🐱"}
          </span>
          <span className={`truncate text-base font-medium ${
            asistio ? "text-[#888] line-through" : "text-[#1a1a1a]"
          }`}>
            {paciente.nombre}
          </span>
          {dueños ? (
            <span className="hidden truncate text-sm text-[#999] sm:inline">
              · {dueños}
            </span>
          ) : null}
        </div>
        {control.nota ? (
          <p className="mt-0.5 truncate pl-7 text-sm text-[#888] italic">
            {control.nota}
          </p>
        ) : null}
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {sucursal ? (
          <span className="text-xs text-[#aaa]">{sucursal.nombre}</span>
        ) : null}
        {waUrl ? (
          <a
            id={isFirst ? "tour-whatsapp-btn" : undefined}
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Enviar recordatorio por WhatsApp"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#25D366]/40 bg-[#dcf8c6]/30 text-[#128C7E] transition-colors hover:bg-[#dcf8c6]/60"
          >
            <WhatsAppIcon size={14} />
          </a>
        ) : null}
      </div>
    </li>
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
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
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
        // Filtro por sucursalId hardcodeado (ver TODO arriba)
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

  const handleToggle = useCallback(
    (pacienteId: string, controlId: string, checked: boolean) => {
      void updateProximoControl(pacienteId, controlId, {
        asistencia: checked ? "asistio" : null,
      });
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
                {totalAsistieron}/{controles.length}
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

      {/* Filtro por sucursal */}
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
            onClick={() => setFiltroSucursal(s.id === filtroSucursal ? null : s.id)}
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

      {controles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4c5bc] bg-[#faf7f5] px-6 py-10 text-center">
          <p className="text-sm font-medium text-[#888]">
            Sin controles para este día
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {controles.map(({ paciente, control }, i) => (
            <FilaControl
              key={`${paciente.id}-${control.id}`}
              paciente={paciente}
              control={control}
              onToggle={handleToggle}
              isFirst={i === 0}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
