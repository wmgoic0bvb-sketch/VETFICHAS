"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePatients } from "@/components/providers/patients-provider";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { parseFechaHoraLocal } from "@/lib/proximo-control-utils";
import { getSucursalById } from "@/lib/sucursales";
import type { Paciente, ProximoControl } from "@/types/patient";

function hoyDDMMAAAA(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function esControlDeHoy(fechaHora: string): boolean {
  const dt = parseFechaHoraLocal(fechaHora);
  if (!dt) return false;
  const hoy = new Date();
  return (
    dt.getDate() === hoy.getDate() &&
    dt.getMonth() === hoy.getMonth() &&
    dt.getFullYear() === hoy.getFullYear()
  );
}

interface ControlDeHoy {
  paciente: Paciente;
  control: ProximoControl;
}

function horaDeTexto(fechaHora: string): string {
  const partes = fechaHora.split(" ");
  return partes[1] ?? "";
}

function formatDueños(p: Paciente): string {
  return p.dueños
    .filter((d) => d.nombre.trim())
    .map((d) => d.nombre)
    .join(" / ");
}

function BadgeAsistencia({ asistencia }: { asistencia?: string | null }) {
  if (!asistencia) return null;
  if (asistencia === "asistio") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        Asistió
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
      Ausente
    </span>
  );
}

export function CalendarioView() {
  const { patients, ready } = usePatients();

  const controlesHoy = useMemo((): ControlDeHoy[] => {
    const result: ControlDeHoy[] = [];
    for (const p of patients) {
      for (const c of p.proximosControles) {
        if (esControlDeHoy(c.fechaHora)) {
          result.push({ paciente: p, control: c });
        }
      }
    }
    result.sort((a, b) => {
      const ta = parseFechaHoraLocal(a.control.fechaHora)?.getTime() ?? 0;
      const tb = parseFechaHoraLocal(b.control.fechaHora)?.getTime() ?? 0;
      return ta - tb;
    });
    return result;
  }, [patients]);

  const fechaHoy = hoyDDMMAAAA();

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <LottieSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#5c1838]">Calendario</h1>
        <p className="mt-0.5 text-sm text-[#888]">
          Controles programados para hoy · {fechaHoy}
        </p>
      </div>

      {controlesHoy.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4c5bc] bg-[#faf7f5] px-6 py-12 text-center">
          <p className="text-[15px] font-medium text-[#888]">
            No hay controles programados para hoy
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {controlesHoy.map(({ paciente, control }) => {
            const sucursal = getSucursalById(control.sucursalId);
            const hora = horaDeTexto(control.fechaHora);
            const dueños = formatDueños(paciente);
            return (
              <li key={`${paciente.id}-${control.id}`}>
                <Link
                  href={`/patient/${paciente.id}`}
                  className="flex items-start gap-4 rounded-xl border border-[#e8e0d8] bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-[#c4a898] hover:bg-[#faf7f5]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5c1838]/8 text-xl">
                    {paciente.especie === "Perro" ? "🐶" : "🐱"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-[#1a1a1a]">
                        {paciente.nombre}
                      </span>
                      <BadgeAsistencia asistencia={control.asistencia} />
                    </div>
                    {dueños ? (
                      <p className="truncate text-sm text-[#666]">{dueños}</p>
                    ) : null}
                    {control.nota ? (
                      <p className="mt-1 truncate text-sm text-[#888] italic">
                        {control.nota}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {hora ? (
                      <p className="text-sm font-semibold text-[#5c1838]">
                        {hora}
                      </p>
                    ) : null}
                    {sucursal ? (
                      <p className="mt-0.5 text-[11px] text-[#888]">
                        {sucursal.nombre}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {controlesHoy.length > 0 ? (
        <p className="mt-4 text-right text-xs text-[#aaa]">
          {controlesHoy.length}{" "}
          {controlesHoy.length === 1 ? "control" : "controles"}
        </p>
      ) : null}
    </div>
  );
}
