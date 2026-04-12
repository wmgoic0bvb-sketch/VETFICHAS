"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { buildWhatsAppUrl } from "@/lib/phone-utils";
import { esControlFechaPasadaOHoy } from "@/lib/proximo-control-utils";
import { getSucursalById } from "@/lib/sucursales";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type {
  AsistenciaProximoControl,
  Paciente,
  ProximoControl,
} from "@/types/patient";

function formatDueños(p: Paciente): string {
  return p.dueños
    .filter((d) => d.nombre.trim())
    .map((d) => d.nombre)
    .join(" / ");
}

function NotaControlTruncada({ nota }: { nota: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      setOverflow(el.scrollWidth > el.clientWidth + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nota]);

  return (
    <p
      ref={ref}
      title={overflow ? nota : undefined}
      className="mt-0.5 truncate pl-7 text-sm text-[#888] italic"
    >
      {nota}
    </p>
  );
}

function AsistenciaSwitch({
  asistio,
  ausente,
  pacienteNombre,
  onToggle,
  idTour,
}: {
  asistio: boolean;
  ausente: boolean;
  pacienteNombre: string;
  onToggle: () => void;
  idTour?: string;
}) {
  const label = asistio
    ? "Asistió al control"
    : ausente
      ? "Ausente al control"
      : "Asistencia al control sin marcar";

  return (
    <button
      id={idTour}
      type="button"
      role="switch"
      aria-checked={asistio}
      aria-label={`${pacienteNombre}: ${label}. Activar si asistió.`}
      title={asistio ? "Desactivar: marcar como ausente" : "Activar: marcar que asistió"}
      onClick={onToggle}
      className={`relative h-5 w-8 shrink-0 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5c1838] ${
        asistio
          ? "border-emerald-600 bg-emerald-500"
          : ausente
            ? "border-red-300/90 bg-red-100"
            : "border-[#d8d2cc] bg-[#ebe6e1]"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          asistio ? "translate-x-3.5" : "translate-x-0"
        }`}
        aria-hidden
      />
    </button>
  );
}

export function CalendarioFilaControl({
  paciente,
  control,
  onSetAsistencia,
  tourAsistencia = false,
}: {
  paciente: Paciente;
  control: ProximoControl;
  onSetAsistencia: (
    pacienteId: string,
    controlId: string,
    asistencia: AsistenciaProximoControl | null,
  ) => void;
  tourAsistencia?: boolean;
}) {
  const puedeMarcar = esControlFechaPasadaOHoy(control.fechaHora);
  const asistio = control.asistencia === "asistio";
  const ausente = control.asistencia === "ausente";
  const nombreAtendido = asistio || ausente;

  const sucursal = getSucursalById(control.sucursalId);
  const dueños = formatDueños(paciente);

  const tel = paciente.dueños[0]?.tel?.trim();
  const sucNombre = sucursal?.nombre ?? "";
  const mensaje = `Hola! Nos comunicamos de ZooVet para recordarte que hoy ${paciente.nombre} tiene control programado${sucNombre ? ` en ${sucNombre}` : ""}. ¡Gracias!`;
  const waUrl = tel ? buildWhatsAppUrl(tel, mensaje) : null;

  const toggleSwitch = () => {
    onSetAsistencia(
      paciente.id,
      control.id,
      asistio ? "ausente" : "asistio",
    );
  };

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#e8e0d8] bg-white px-4 py-4 transition-colors hover:bg-[#faf7f5]">
      {puedeMarcar ? (
        <AsistenciaSwitch
          asistio={asistio}
          ausente={ausente}
          pacienteNombre={paciente.nombre}
          onToggle={toggleSwitch}
          idTour={tourAsistencia ? "tour-checkbox-asistencia" : undefined}
        />
      ) : (
        <div
          className="flex h-5 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-[#ddd] bg-[#fafafa] text-[9px] font-medium leading-none text-[#aaa]"
          title="La asistencia se registra el día del turno o después"
        >
          —
        </div>
      )}

      <Link href={`/patient/${paciente.id}`} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-base">
              {paciente.especie === "Perro" ? "🐶" : "🐱"}
            </span>
            <span
              className={`truncate text-base font-medium capitalize ${
                nombreAtendido ? "text-[#888] line-through" : "text-[#1a1a1a]"
              }`}
            >
              {paciente.nombre}
            </span>
            {dueños ? (
              <span className="hidden truncate text-sm capitalize text-[#999] sm:inline">
                · {dueños}
              </span>
            ) : null}
          </div>
          {ausente ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
              Ausente
            </span>
          ) : null}
        </div>
        {control.nota ? <NotaControlTruncada nota={control.nota} /> : null}
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {sucursal ? (
          <span className="text-xs text-[#aaa]">{sucursal.nombre}</span>
        ) : null}
        {waUrl ? (
          <a
            id={tourAsistencia ? "tour-whatsapp-btn" : undefined}
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
