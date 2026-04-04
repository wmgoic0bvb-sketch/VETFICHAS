"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConsultaModal } from "@/components/dashboard/consulta-modal";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PatientEstudiosSection } from "@/components/dashboard/patient-estudios-section";
import { usePatients } from "@/components/providers/patients-provider";
import { calcularEdad, formatFecha } from "@/lib/date-utils";
import type { Consulta } from "@/types/patient";

const tipoClass: Record<string, string> = {
  Control: "bg-emerald-100 text-emerald-900",
  Urgencia: "bg-red-100 text-red-900",
  "Cirugía": "bg-amber-100 text-amber-900",
  Vacuna: "bg-sky-100 text-sky-900",
};

const cardClass =
  "rounded-2xl border border-[#ebe6df] bg-white p-5 shadow-sm";

function emoji(especie: "Perro" | "Gato") {
  return especie === "Perro" ? "🐶" : "🐱";
}

function ConsultaHeader({ c }: { c: Consulta }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-xs text-[#888]">{formatFecha(c.fecha)}</div>
      <span
        className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tipoClass[c.tipo] ?? tipoClass.Control}`}
      >
        {c.tipo}
      </span>
      <div className="text-[15px] font-semibold leading-snug text-[#1a1a1a]">{c.motivo}</div>
      {c.veterinario ? (
        <div className="mt-1 text-[13px] text-[#555]">👨‍⚕️ {c.veterinario}</div>
      ) : null}
    </div>
  );
}

function ConsultaCard({ c }: { c: Consulta }) {
  const hasDetails = Boolean(c.peso || c.temp || c.diag || c.trat || c.meds);
  const [open, setOpen] = useState(false);
  const panelId = `consulta-detail-${c.id}`;
  const triggerId = `consulta-trigger-${c.id}`;

  return (
    <div className="mb-2.5 overflow-hidden rounded-[14px] border-l-[3px] border-[#2d6a4f]/35 bg-[#f5f0eb] last:mb-0">
      {hasDetails ? (
        <button
          type="button"
          id={triggerId}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start gap-2 px-4 py-3.5 text-left transition-colors hover:bg-[#efeae2]"
        >
          <ConsultaHeader c={c} />
          <span
            className={`mt-1 inline-block shrink-0 text-[10px] leading-none text-[#888] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▼
          </span>
        </button>
      ) : (
        <div className="px-4 py-3.5">
          <ConsultaHeader c={c} />
        </div>
      )}
      {hasDetails && open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="border-t border-[#e0d9cf] bg-[#faf8f5] px-4 py-3"
        >
          {(c.peso || c.temp) && (
            <div className="text-[13px] leading-relaxed text-[#555]">
              {c.peso ? `⚖️ Peso: ${c.peso} kg` : ""}
              {c.peso && c.temp ? " · " : ""}
              {c.temp ? `🌡️ Temp: ${c.temp}°C` : ""}
            </div>
          )}
          {c.diag ? (
            <div className="mt-1 text-[13px] leading-relaxed text-[#555]">📋 {c.diag}</div>
          ) : null}
          {c.trat ? (
            <div className="mt-1 text-[13px] leading-relaxed text-[#555]">💊 {c.trat}</div>
          ) : null}
          {c.meds ? (
            <div className="mt-1 text-[13px] leading-relaxed text-[#555]">🧴 {c.meds}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-[#888]">{label}</span>
      <span className="text-right font-medium text-[#1a1a1a]">{value}</span>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { ready, getById, addConsulta } = usePatients();
  const [consultaOpen, setConsultaOpen] = useState(false);

  const patient = patientId ? getById(patientId) : undefined;
  const consultas = useMemo(
    () => [...(patient?.consultas ?? [])].reverse(),
    [patient?.consultas],
  );

  const mainClass = "mx-auto w-full max-w-[1200px] px-4 py-6";

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
        <DashboardNav />
        <main className={`${mainClass} text-[#888]`}>Cargando...</main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
        <DashboardNav />
        <main className={mainClass}>
          <Link href="/" className="text-sm font-medium text-[#2d6a4f] underline">
            ← Volver al dashboard
          </Link>
          <div className={`mt-6 ${cardClass} text-[#555]`}>
            No se encontró el paciente.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
      <DashboardNav />
      <main className={mainClass}>
        <Link href="/" className="text-sm font-medium text-[#2d6a4f] underline">
          ← Volver al dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <section className={cardClass}>
              <div className="text-center">
                <span className="mb-2 block text-[56px] leading-none" aria-hidden>
                  {emoji(patient.especie)}
                </span>
                <h1 className="text-xl font-bold text-[#1a1a1a]">{patient.nombre}</h1>
                <p className="mt-1 text-sm text-[#888]">
                  {patient.raza || patient.especie} · {calcularEdad(patient.fnac)}
                </p>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                Datos del paciente
              </h2>
              <div className="divide-y divide-[#f0ebe4] text-sm">
                <Row label="Especie" value={patient.especie} />
                {patient.raza ? <Row label="Raza" value={patient.raza} /> : null}
                {patient.sexo ? <Row label="Sexo" value={patient.sexo} /> : null}
                {patient.fnac ? (
                  <Row label="Nacimiento" value={formatFecha(patient.fnac)} />
                ) : null}
                {patient.castrado ? <Row label="Castrado/a" value={patient.castrado} /> : null}
                {patient.color ? <Row label="Color" value={patient.color} /> : null}
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                Dueños / Contacto
              </h2>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-[#ebe6df] bg-[#faf8f5] p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#2d6a4f]">
                    Responsable 1
                  </p>
                  <Row label="Nombre" value={patient.dueños[0].nombre || "—"} />
                  {patient.dueños[0].tel ? (
                    <Row label="Teléfono" value={patient.dueños[0].tel} />
                  ) : null}
                </div>
                {(patient.dueños[1].nombre || patient.dueños[1].tel) ? (
                  <div className="rounded-xl border border-dashed border-[#d4ccc0] p-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#888]">
                      Responsable 2
                    </p>
                    <Row
                      label="Nombre"
                      value={patient.dueños[1].nombre || "—"}
                    />
                    {patient.dueños[1].tel ? (
                      <Row label="Teléfono" value={patient.dueños[1].tel} />
                    ) : null}
                  </div>
                ) : null}
                {patient.dir ? (
                  <div className="border-t border-[#f0ebe4] pt-3">
                    <Row label="Dirección" value={patient.dir} />
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <section className={cardClass}>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                  Historial de consultas ({patient.consultas?.length ?? 0})
                </h2>
                <button
                  type="button"
                  onClick={() => setConsultaOpen(true)}
                  className="shrink-0 rounded-xl bg-[#2d6a4f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1b4332] sm:w-auto sm:self-center"
                >
                  + Agregar consulta
                </button>
              </div>
              {consultas.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#aaa]">
                  Sin consultas registradas aún
                </div>
              ) : (
                consultas.map((c) => <ConsultaCard key={c.id} c={c} />)
              )}
            </section>

            <section className={cardClass}>
                <PatientEstudiosSection key={patient.id} patient={patient} />
            </section>
          </div>
        </div>

        <ConsultaModal
          open={consultaOpen}
          onClose={() => setConsultaOpen(false)}
          onSave={(data) => {
            addConsulta(patient.id, data);
          }}
        />
      </main>
    </div>
  );
}
