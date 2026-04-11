"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConsultaModal } from "@/components/dashboard/consulta-modal";
import { AppShell } from "@/components/layout/app-shell";
import { PatientDangerZone } from "@/components/dashboard/patient-danger-zone";
import {
  PatientFichaEditForm,
  PencilIcon,
} from "@/components/dashboard/patient-ficha-edit-form";
import { PatientEstudiosSection } from "@/components/dashboard/patient-estudios-section";
import { ProximosControlesSection } from "@/components/dashboard/proximo-control-section";
import { usePatients } from "@/components/providers/patients-provider";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { calcularEdad, formatFecha } from "@/lib/date-utils";
import { exportConsultaPdf } from "@/lib/export-consulta-pdf";
import { exportInternacionPdf } from "@/lib/export-internacion-pdf";
import { buildWhatsAppUrl } from "@/lib/phone-utils";
import { toast } from "sonner";
import {
  ESTADO_PACIENTE_LABELS,
  esPacienteActivo,
  type Consulta,
  type InternacionHistorial,
  type Paciente,
} from "@/types/patient";

const tipoClass: Record<string, string> = {
  Consulta: "bg-violet-100 text-violet-900",
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

const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
const ddmmyyyy = /^\d{2}\/\d{2}\/\d{4}$/;

function formatRefuerzoDisplay(raw: string) {
  const t = raw.trim();
  if (ddmmyyyy.test(t)) return t;
  if (isoDateOnly.test(t)) return formatFecha(t);
  return t;
}

function ConsultaCard({
  c,
  patient,
  onEdit,
}: {
  c: Consulta;
  patient: Pick<Paciente, "nombre" | "especie" | "raza">;
  onEdit: (consulta: Consulta) => void;
}) {
  const esVacuna = c.tipo === "Vacuna";
  const hasDetails = esVacuna
    ? Boolean(c.diag || c.trat || c.meds)
    : Boolean(c.peso || c.temp || c.diag || c.trat || c.meds);
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const panelId = `consulta-detail-${c.id}`;
  const triggerId = `consulta-trigger-${c.id}`;

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      await exportConsultaPdf(
        {
          nombre: patient.nombre,
          especie: patient.especie,
          raza: patient.raza,
        },
        c,
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo generar el PDF",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const editBtn = (
    <button
      type="button"
      onClick={() => onEdit(c)}
      className="-m-1 flex shrink-0 items-center justify-center rounded-lg p-1 text-[#5c1838] hover:bg-[#f0faf5]"
      aria-label="Editar consulta"
      title="Editar consulta"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="mb-2.5 overflow-hidden rounded-[14px] border-l-[3px] border-[#5c1838]/35 bg-[#f5f0eb] last:mb-0">
      {hasDetails ? (
        <div className="flex items-start gap-1 px-4 py-3.5 transition-colors hover:bg-[#efeae2]/80">
          <button
            type="button"
            id={triggerId}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex min-w-0 flex-1 items-start gap-2 text-left"
          >
            <ConsultaHeader c={c} />
            <span
              className={`mt-1 inline-block shrink-0 text-[10px] leading-none text-[#888] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden
            >
              ▼
            </span>
          </button>
          {editBtn}
        </div>
      ) : (
        <div className="flex items-start gap-1 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <ConsultaHeader c={c} />
          </div>
          {editBtn}
        </div>
      )}
      {hasDetails && open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="border-t border-[#e0d9cf] bg-[#faf8f5] px-4 py-3"
        >
          {!esVacuna && (c.peso || c.temp) ? (
            <div className="text-[13px] leading-relaxed text-[#555]">
              {c.peso ? `⚖️ Peso: ${c.peso} kg` : ""}
              {c.peso && c.temp ? " · " : ""}
              {c.temp ? `🌡️ Temp: ${c.temp}°C` : ""}
            </div>
          ) : null}
          {esVacuna ? (
            <>
              {c.diag ? (
                <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  🏷️ Marca: {c.diag}
                </div>
              ) : null}
              {c.trat ? (
                <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  📦 Lote: {c.trat}
                </div>
              ) : null}
              {c.meds ? (
                <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  📅 Próximo refuerzo: {formatRefuerzoDisplay(c.meds)}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {c.diag ? (
                <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  📋 {c.diag}
                </div>
              ) : null}
              {c.trat ? (
                <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  💊 {c.trat}
                </div>
              ) : null}
              {c.meds ? (
                <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
                  🧴 {c.meds}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      <div className="flex justify-end border-t border-[#e0d9cf]/80 bg-[#faf8f5]/60 px-4 py-2.5">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={pdfLoading}
          className="rounded-lg border border-[#5c1838]/35 bg-white px-3 py-1.5 text-xs font-semibold text-[#5c1838] shadow-sm transition-colors hover:bg-[#5c1838]/10 disabled:pointer-events-none disabled:opacity-50"
        >
          {pdfLoading ? "Generando PDF…" : "Exportar PDF"}
        </button>
      </div>
    </div>
  );
}

function InternacionHistorialCard({
  entry,
  patient,
}: {
  entry: InternacionHistorial;
  patient: Pick<Paciente, "nombre" | "especie" | "raza">;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await exportInternacionPdf(
        { nombre: patient.nombre, especie: patient.especie, raza: patient.raza },
        entry,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const etiquetaEgreso =
    entry.tipoEgreso === "fallecimiento" ? "Fallecimiento" : "Alta";
  const colorEgreso =
    entry.tipoEgreso === "fallecimiento"
      ? "text-rose-700"
      : "text-emerald-800";

  return (
    <div className="mb-2.5 overflow-hidden rounded-[14px] border-l-[3px] border-[#5c1838]/35 bg-[#f5f0eb] last:mb-0">
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-xs text-[#888]">
              Ingreso: {formatFecha(entry.fechaIngreso)}
              {entry.fechaAlta ? (
                <span className={`ml-3 font-medium ${colorEgreso}`}>
                  {etiquetaEgreso}: {formatFecha(entry.fechaAlta.slice(0, 10))}
                </span>
              ) : null}
            </div>
            {entry.diagnosticoPrincipal.trim() ? (
              <div className="text-[14px] font-semibold leading-snug text-[#1a1a1a] line-clamp-2">
                {entry.diagnosticoPrincipal}
              </div>
            ) : (
              <div className="text-[13px] italic text-[#aaa]">
                Sin diagnóstico registrado
              </div>
            )}
            {entry.veterinarioResponsable ? (
              <div className="text-[13px] text-[#555]">
                👨‍⚕️ {entry.veterinarioResponsable}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-[#e0d9cf]/80 bg-[#faf8f5]/60 px-4 py-2.5">
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="rounded-lg border border-[#5c1838]/35 bg-white px-3 py-1.5 text-xs font-semibold text-[#5c1838] shadow-sm transition-colors hover:bg-[#5c1838]/10 disabled:pointer-events-none disabled:opacity-50"
        >
          {pdfLoading ? "Generando PDF…" : "Exportar PDF"}
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-[#888]">{label}</span>
      <span
        className={`text-right font-medium text-[#1a1a1a] ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    ready,
    getById,
    addConsulta,
    updateConsulta,
    addProximoControl,
    updateProximoControl,
    removeProximoControl,
  } = usePatients();
  const [consultaOpen, setConsultaOpen] = useState(false);
  const [vacunaOpen, setVacunaOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(
    null,
  );
  const [editFichaOpen, setEditFichaOpen] = useState(false);

  const patient = patientId ? getById(patientId) : undefined;
  const consultas = useMemo(
    () => [...(patient?.consultas ?? [])].reverse(),
    [patient?.consultas],
  );

  const whatsapp1Url = useMemo(() => {
    if (!patient) return null;
    const tel = patient.dueños[0].tel;
    if (!tel?.trim()) return null;
    const nombreDueño = patient.dueños[0].nombre.trim();
    const mensaje = nombreDueño ? `Hola ${nombreDueño}` : "Hola";
    return buildWhatsAppUrl(tel, mensaje);
  }, [patient]);

  const whatsapp2Url = useMemo(() => {
    if (!patient) return null;
    const tel = patient.dueños[1].tel;
    if (!tel?.trim()) return null;
    const nombreDueño = patient.dueños[1].nombre.trim();
    const mensaje = nombreDueño ? `Hola ${nombreDueño}` : "Hola";
    return buildWhatsAppUrl(tel, mensaje);
  }, [patient]);

  const mainClass = "mx-auto w-full max-w-[1200px] px-4 py-6";

  if (!ready) {
    return (
      <AppShell>
        <main
          className={`${mainClass} flex flex-col items-center justify-center gap-3 py-16 text-[#888]`}
          role="status"
          aria-label="Cargando ficha"
        >
          <LottieSpinner size={140} />
          <span className="text-sm">Cargando…</span>
        </main>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <main className={mainClass}>
          <Link href="/" className="text-sm font-medium text-[#5c1838] underline">
            ← Volver al dashboard
          </Link>
          <div className={`mt-6 ${cardClass} text-[#555]`}>
            No se encontró el paciente.
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className={mainClass}>
        <Link href="/" className="text-sm font-medium text-[#5c1838] underline">
          ← Volver al dashboard
        </Link>

        {!esPacienteActivo(patient) ? (
          <div
            className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-[14px] leading-snug text-amber-950"
            role="status"
          >
            Esta ficha no aparece en el listado principal:{" "}
            <strong>
              {ESTADO_PACIENTE_LABELS[patient.estado ?? "activo"]}
            </strong>
            . El historial se conserva; podés reactivarla desde la zona de riesgo
            al final de la página o desde Editar ficha.
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <section className={cardClass}>
              <div className="text-center">
                <span className="mb-2 block text-[56px] leading-none" aria-hidden>
                  {emoji(patient.especie)}
                </span>
                <h1 className="text-xl font-bold capitalize text-[#1a1a1a]">
                  {patient.nombre}
                </h1>
                <p className="mt-1 text-sm text-[#888]">
                  {patient.raza || patient.especie} · {calcularEdad(patient.fnac)}
                </p>
                {patient.internado ? (
                  <div className="mt-3 flex justify-center">
                    <Link
                      href={`/internaciones/${patient.id}#internacion-seguimiento`}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900 transition-colors hover:bg-emerald-200/90"
                    >
                      Internado
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>

            <section className={cardClass}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#5c1838]">
                  Datos del paciente
                </h2>
                <button
                  type="button"
                  onClick={() => setEditFichaOpen(true)}
                  className="-m-1 flex shrink-0 items-center justify-center rounded-lg p-1 text-[#5c1838] hover:bg-[#f0faf5]"
                  aria-label="Editar datos del paciente y contacto"
                  title="Editar ficha"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
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
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#5c1838]">
                Dueños / Contacto
              </h2>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-[#ebe6df] bg-[#faf8f5] p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#5c1838]">
                      Responsable 1
                    </p>
                    {whatsapp1Url ? (
                      <a
                        href={whatsapp1Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#25D366]/45 bg-[#dcf8c6]/40 px-2 py-1 text-[11px] font-semibold text-[#128C7E] transition-colors hover:bg-[#dcf8c6]/70"
                        aria-label="Abrir WhatsApp con el responsable 1"
                      >
                        <WhatsAppIcon className="shrink-0" />
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <Row
                    label="Nombre"
                    value={patient.dueños[0].nombre || "—"}
                    capitalize
                  />
                  {patient.dueños[0].tel ? (
                    <Row label="Teléfono" value={patient.dueños[0].tel} />
                  ) : null}
                </div>
                {(patient.dueños[1].nombre || patient.dueños[1].tel) ? (
                  <div className="rounded-xl border border-dashed border-[#d4ccc0] p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#888]">
                        Responsable 2
                      </p>
                      {whatsapp2Url ? (
                        <a
                          href={whatsapp2Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#25D366]/45 bg-[#dcf8c6]/40 px-2 py-1 text-[11px] font-semibold text-[#128C7E] transition-colors hover:bg-[#dcf8c6]/70"
                          aria-label="Abrir WhatsApp con el responsable 2"
                        >
                          <WhatsAppIcon className="shrink-0" />
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                    <Row
                      label="Nombre"
                      value={patient.dueños[1].nombre || "—"}
                      capitalize
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

            <ProximosControlesSection
              patient={patient}
              onAdd={(data) => addProximoControl(patient.id, data)}
              onUpdate={(controlId, patch) =>
                updateProximoControl(patient.id, controlId, patch)
              }
              onRemove={(controlId) =>
                removeProximoControl(patient.id, controlId)
              }
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <section className={cardClass}>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#5c1838]">
                  Historial de consultas ({patient.consultas?.length ?? 0})
                </h2>
                <div className="relative shrink-0 sm:self-center">
                  <button
                    type="button"
                    onClick={() => setAddMenuOpen((v) => !v)}
                    className="rounded-xl bg-[#5c1838] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#401127]"
                  >
                    + Agregar consulta
                  </button>
                  {addMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
                      <div className="absolute right-0 top-full z-20 pt-1">
                        <div className="min-w-[190px] overflow-hidden rounded-xl border border-[#e8e0d8] bg-white shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setAddMenuOpen(false);
                              setEditingConsulta(null);
                              setConsultaOpen(true);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[#333] hover:bg-[#f5f0eb]"
                          >
                            Agregar consulta
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddMenuOpen(false);
                              setEditingConsulta(null);
                              setVacunaOpen(true);
                            }}
                            className="w-full border-t border-[#e8e0d8] px-4 py-2.5 text-left text-sm text-[#333] hover:bg-[#f5f0eb]"
                          >
                            Agregar vacuna
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {consultas.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#aaa]">
                  Sin consultas registradas aún
                </div>
              ) : (
                consultas.map((c) => (
                  <ConsultaCard
                    key={c.id}
                    c={c}
                    patient={patient}
                    onEdit={(consulta) => {
                      setEditingConsulta(consulta);
                    }}
                  />
                ))
              )}
            </section>

            <section className={cardClass}>
                <PatientEstudiosSection key={patient.id} patient={patient} />
            </section>

            {(patient.historialInternaciones?.length ?? 0) > 0 ? (
              <section className={cardClass}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#5c1838]">
                  Historial de internaciones ({patient.historialInternaciones!.length})
                </h2>
                {[...(patient.historialInternaciones ?? [])].reverse().map((entry) => (
                  <InternacionHistorialCard
                    key={entry.id}
                    entry={entry}
                    patient={patient}
                  />
                ))}
              </section>
            ) : null}
          </div>
        </div>

        <PatientDangerZone patient={patient} />

        <ConsultaModal
          open={consultaOpen || vacunaOpen || editingConsulta !== null}
          initialConsulta={editingConsulta}
          initialTipo={vacunaOpen ? "Vacuna" : undefined}
          onClose={() => {
            setConsultaOpen(false);
            setVacunaOpen(false);
            setEditingConsulta(null);
          }}
          onSave={async (data) => {
            if (editingConsulta) {
              await updateConsulta(patient.id, editingConsulta.id, data);
            } else {
              await addConsulta(patient.id, data);
            }
          }}
        />

        <Modal
          open={editFichaOpen}
          onClose={() => setEditFichaOpen(false)}
          labelledBy="editar-ficha-titulo"
          overlayClassName="z-[210]"
        >
          <button
            type="button"
            onClick={() => setEditFichaOpen(false)}
            className="absolute right-[18px] top-4 text-[22px] leading-none text-[#aaa] hover:text-[#333]"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <h2 id="editar-ficha-titulo" className="sr-only">
            Editar ficha del paciente
          </h2>
          <PatientFichaEditForm
            key={patient.id}
            patient={patient}
            onCancel={() => setEditFichaOpen(false)}
            onSaved={() => setEditFichaOpen(false)}
          />
        </Modal>
      </main>
    </AppShell>
  );
}
