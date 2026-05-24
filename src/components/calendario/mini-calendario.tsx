"use client";

import { useMemo, useState } from "react";
import { diasDelMesConActividadFicha } from "@/lib/calendario-paciente-actividad";
import { mismoDia } from "@/lib/calendario-fecha";
import { parseFechaHoraLocal } from "@/lib/proximo-control-utils";
import type { Paciente } from "@/types/patient";

export { mismoDia } from "@/lib/calendario-fecha";

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      {dir === "left"
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

function diasConControles(patients: Paciente[], año: number, mes: number): Set<number> {
  const set = new Set<number>();
  for (const p of patients) {
    for (const c of p.proximosControles) {
      const dt = parseFechaHoraLocal(c.fechaHora);
      if (dt && dt.getFullYear() === año && dt.getMonth() === mes) {
        set.add(dt.getDate());
      }
    }
  }
  return set;
}

export function MiniCalendario({
  selected,
  onSelect,
  patients,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  patients: Paciente[];
}) {
  const [vistaAño, setVistaAño] = useState(selected.getFullYear());
  const [vistaMes, setVistaMes] = useState(selected.getMonth());
  const hoy = new Date();

  const diasMarcados = useMemo(
    () => diasConControles(patients, vistaAño, vistaMes),
    [patients, vistaAño, vistaMes],
  );

  const diasActividadFicha = useMemo(
    () => diasDelMesConActividadFicha(patients, vistaAño, vistaMes),
    [patients, vistaAño, vistaMes],
  );

  const primerDia = new Date(vistaAño, vistaMes, 1);
  const offsetLunes = (primerDia.getDay() + 6) % 7;
  const totalDias = new Date(vistaAño, vistaMes + 1, 0).getDate();

  const celdas: (number | null)[] = [
    ...Array(offsetLunes).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  const irMesAnterior = () => {
    if (vistaMes === 0) { setVistaMes(11); setVistaAño(y => y - 1); }
    else setVistaMes(m => m - 1);
  };
  const irMesSiguiente = () => {
    if (vistaMes === 11) { setVistaMes(0); setVistaAño(y => y + 1); }
    else setVistaMes(m => m + 1);
  };

  return (
    <div className="w-64 rounded-2xl border border-[#e8e0d8] bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={irMesAnterior}
          className="rounded-lg p-1 text-[#888] hover:bg-[#f5f0eb] hover:text-[#5c1838]"
          aria-label="Mes anterior"
        >
          <ChevronIcon dir="left" />
        </button>
        <span className="text-[13px] font-semibold text-[#333]">
          {MESES[vistaMes]} {vistaAño}
        </span>
        <button
          type="button"
          onClick={irMesSiguiente}
          className="rounded-lg p-1 text-[#888] hover:bg-[#f5f0eb] hover:text-[#5c1838]"
          aria-label="Mes siguiente"
        >
          <ChevronIcon dir="right" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-[#aaa]">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {celdas.map((dia, i) => {
          if (dia === null) return <span key={`e-${i}`} />;
          const estaFecha = new Date(vistaAño, vistaMes, dia);
          const esHoy = mismoDia(estaFecha, hoy);
          const esSeleccionado = mismoDia(estaFecha, selected);
          const tieneControl = diasMarcados.has(dia);
          const tieneActividad = diasActividadFicha.has(dia);
          return (
            <button
              key={dia}
              type="button"
              onClick={() => onSelect(estaFecha)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium transition-colors ${
                esSeleccionado
                  ? "bg-[#5c1838] text-white"
                  : esHoy
                  ? "border border-[#5c1838] text-[#5c1838]"
                  : "text-[#333] hover:bg-[#f5f0eb]"
              }`}
              aria-label={`${dia} de ${MESES[vistaMes]}`}
              aria-pressed={esSeleccionado}
            >
              {dia}
              {(tieneControl || tieneActividad) && !esSeleccionado ? (
                <span className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {tieneControl ? (
                    <span
                      className="h-1 w-1 rounded-full bg-[#5c1838]/50"
                      aria-hidden
                    />
                  ) : null}
                  {tieneActividad ? (
                    <span
                      className="h-1 w-1 rounded-full bg-amber-500/90"
                      aria-hidden
                    />
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
