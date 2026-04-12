"use client";

import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/phone-utils";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { EntradaActividadPacienteCalendario } from "@/lib/calendario-paciente-actividad";
import type { Paciente } from "@/types/patient";

function formatDueños(p: Paciente): string {
  return p.dueños
    .filter((d) => d.nombre.trim())
    .map((d) => d.nombre)
    .join(" / ");
}

export function CalendarioPacienteActividadRow({
  entrada,
}: {
  entrada: EntradaActividadPacienteCalendario;
}) {
  const { paciente, motivos, consultasEseDia } = entrada;
  const dueños = formatDueños(paciente);
  const tel = paciente.dueños[0]?.tel?.trim();
  const waUrl = tel
    ? buildWhatsAppUrl(
        tel,
        `Hola! Nos comunicamos de ZooVet respecto a ${paciente.nombre}.`,
      )
    : null;

  const resumenConsultas =
    consultasEseDia.length === 0
      ? null
      : consultasEseDia.length === 1
        ? consultasEseDia[0]!.tipo
        : `${consultasEseDia.length} consultas`;

  return (
    <li className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-4 transition-colors hover:bg-amber-50/70">
      <div
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-amber-300 bg-white text-[11px]"
        aria-hidden
      >
        📋
      </div>

      <Link href={`/patient/${paciente.id}`} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-base">
            {paciente.especie === "Perro" ? "🐶" : "🐱"}
          </span>
          <span className="truncate text-base font-medium capitalize text-[#1a1a1a]">
            {paciente.nombre}
          </span>
          {dueños ? (
            <span className="hidden truncate text-sm capitalize text-[#999] sm:inline">
              · {dueños}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5 pl-0 sm:pl-7">
          {motivos.includes("alta") ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-900">
              Alta
            </span>
          ) : null}
          {motivos.includes("consulta") ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-900">
              Consulta
            </span>
          ) : null}
        </div>
        {resumenConsultas ? (
          <p className="mt-1 pl-0 text-sm text-[#666] sm:pl-7">
            {resumenConsultas}
            {consultasEseDia[0]?.motivo?.trim() ? (
              <span className="text-[#888]">
                {" "}
                · {consultasEseDia[0]!.motivo.trim()}
              </span>
            ) : null}
          </p>
        ) : null}
      </Link>

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#25D366]/40 bg-[#dcf8c6]/30 text-[#128C7E] transition-colors hover:bg-[#dcf8c6]/60"
        >
          <WhatsAppIcon size={14} />
        </a>
      ) : null}
    </li>
  );
}
