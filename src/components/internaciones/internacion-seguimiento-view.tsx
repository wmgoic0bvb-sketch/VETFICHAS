"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  draftFromPatient,
  PencilIcon,
} from "@/components/dashboard/patient-ficha-edit-form";
import { usePatients } from "@/components/providers/patients-provider";
import { HistorialModificacionesPanel } from "@/components/dashboard/historial-modificaciones-panel";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import { calcularEdad, formatFecha, todayISODate } from "@/lib/date-utils";
import { exportInternacionPdf } from "@/lib/export-internacion-pdf";
import {
  defaultDatosInternacion,
  diasInternacionDesdeIngreso,
  evolucionesOrdenadas,
  formatFechaHoraDisplay,
  ordenesTratamientoRecientesPrimero,
} from "@/lib/internacion-utils";
import {
  type DatosInternacion,
  type EvolucionRondaInternacion,
  type EstadoGeneralEvolucion,
  type OrdenTratamientoInternacion,
} from "@/types/patient";

const cardClass =
  "rounded-2xl border border-[#ebe6df] bg-white p-5 shadow-sm";

function datosSeguros(d: DatosInternacion | undefined): DatosInternacion {
  return d ?? defaultDatosInternacion();
}

export function InternacionSeguimientoView() {
  const params = useParams<{ id: string | string[] }>();
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { getById, ready, updatePatient } = usePatients();
  const patient = patientId ? getById(patientId) : undefined;

  const datos = useMemo(
    () => (patient ? datosSeguros(patient.datosInternacion) : null),
    [patient],
  );

  const puedeEditar = patient?.internado === true;

  const [headerFecha, setHeaderFecha] = useState("");
  const [headerHora, setHeaderHora] = useState("");
  const [headerMotivo, setHeaderMotivo] = useState("");
  const [headerVet, setHeaderVet] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [editandoDatosIngreso, setEditandoDatosIngreso] = useState(false);
  const datosIngresoInicializados = useRef(false);

  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [evoModalOpen, setEvoModalOpen] = useState(false);

  const [vetOpciones, setVetOpciones] = useState<{ id: string; nombre: string }[]>(
    [],
  );
  const [vetListLoading, setVetListLoading] = useState(true);
  const [vetListError, setVetListError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!patient) return;
    const d = datosSeguros(patient.datosInternacion);
    setHeaderFecha(d.fechaIngreso || todayISODate());
    setHeaderHora(d.horaIngreso ?? "");
    setHeaderMotivo(d.motivoIngreso);
    setHeaderVet(d.veterinarioResponsable);
    if (!datosIngresoInicializados.current) {
      datosIngresoInicializados.current = true;
      const tieneData = !!(d.motivoIngreso.trim() || d.veterinarioResponsable.trim());
      setEditandoDatosIngreso(!tieneData);
    }
  }, [patient, patient?.datosInternacion]);

  useEffect(() => {
    let cancelled = false;
    setVetListLoading(true);
    setVetListError(null);
    void (async () => {
      try {
        const res = await fetch("/api/veterinarios");
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            typeof (j as { error?: string }).error === "string"
              ? (j as { error: string }).error
              : "No se pudo cargar la lista de veterinarios",
          );
        }
        const data = (await res.json()) as {
          veterinarios: { id: string; nombre: string }[];
        };
        if (!cancelled) setVetOpciones(data.veterinarios);
      } catch (e) {
        if (!cancelled) {
          setVetListError(
            e instanceof Error ? e.message : "Error al cargar veterinarios",
          );
          setVetOpciones([]);
        }
      } finally {
        if (!cancelled) setVetListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistDatos = useCallback(
    async (next: DatosInternacion) => {
      if (!patient) return;
      setSaving("datos");
      try {
        await updatePatient(patient.id, {
          ...draftFromPatient(patient),
          datosInternacion: next,
        });
      } finally {
        setSaving(null);
      }
    },
    [patient, updatePatient],
  );

  const guardarDatosIngreso = async () => {
    if (!patient || !datos) return;
    const vetNombre = headerVet.trim();
    if (
      !vetNombre ||
      !vetOpciones.some((v) => v.nombre === vetNombre)
    ) {
      toast.error("Elegí el veterinario responsable de la lista.");
      return;
    }
    await persistDatos({
      ...datos,
      fechaIngreso: headerFecha.slice(0, 10),
      horaIngreso: headerHora.trim() || undefined,
      motivoIngreso: headerMotivo.trim(),
      veterinarioResponsable: vetNombre,
    });
    setEditandoDatosIngreso(false);
    toast.success("Datos de ingreso guardados");
  };

  const toggleOrdenActiva = async (ordenId: string) => {
    if (!patient || !datos) return;
    const di = datosSeguros(patient.datosInternacion);
    const ordenes = di.ordenes.map((o) =>
      o.id === ordenId ? { ...o, activa: !o.activa } : o,
    );
    await persistDatos({ ...di, ordenes });
  };

  const diasInternacion = useMemo(() => {
    if (!datos || !patient) return 0;
    return diasInternacionDesdeIngreso(
      datos.fechaIngreso,
      patient.internado,
      datos.fechaAlta,
    );
  }, [datos, patient]);

  const headerVetSelectValue = useMemo(() => {
    if (!headerVet.trim()) return "";
    return vetOpciones.some((v) => v.nombre === headerVet) ? headerVet : "";
  }, [headerVet, vetOpciones]);

  const handleExportInternacionPdf = useCallback(async () => {
    if (!patient) return;
    const di = datosSeguros(patient.datosInternacion);
    setPdfLoading(true);
    try {
      await exportInternacionPdf(
        {
          nombre: patient.nombre,
          especie: patient.especie,
          raza: patient.raza,
        },
        di,
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo generar el PDF",
      );
    } finally {
      setPdfLoading(false);
    }
  }, [patient]);

  if (!ready) {
    return (
      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-[#888]">
        <LottieSpinner size={140} />
        <span className="text-sm">Cargando…</span>
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
        <Link
          href="/internaciones"
          className="text-sm font-medium text-[#5c1838] underline"
        >
          ← Volver a internaciones
        </Link>
        <p className="mt-6 text-[15px] text-[#888]">
          No se encontró el paciente con este enlace.
        </p>
      </main>
    );
  }

  if (!patient.datosInternacion && !patient.internado) {
    return (
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
        <Link
          href="/internaciones"
          className="text-sm font-medium text-[#5c1838] underline"
        >
          ← Volver a internaciones
        </Link>
        <p className="mt-6 text-[15px] text-[#555]">
          Este paciente no tiene un registro de internación activo o
          reciente.
        </p>
      </main>
    );
  }

  const d = datos!;

  return (
    <main
      id="internacion-seguimiento"
      className="mx-auto w-full max-w-[900px] flex-1 scroll-mt-24 px-4 py-6"
    >
      <Link
        href="/internaciones"
        className="text-sm font-medium text-[#5c1838] underline"
      >
        ← Volver a internaciones
      </Link>

      {/* Header paciente */}
      <section className={`${cardClass} mt-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold capitalize text-[#1a1a1a]">
              <Link
                href={`/patient/${patient.id}`}
                className="rounded-sm text-inherit underline-offset-4 outline-none transition-colors hover:text-[#5c1838] hover:underline focus-visible:ring-2 focus-visible:ring-[#5c1838]/35"
              >
                {patient.nombre}
              </Link>
            </h1>
            <p className="mt-1 text-[14px] text-[#555]">
              {patient.especie}
              {patient.raza ? ` · ${patient.raza}` : ""} · Edad:{" "}
              {calcularEdad(patient.fnac)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={pdfLoading}
              onClick={() => void handleExportInternacionPdf()}
              className="rounded-lg border border-[#5c1838]/35 bg-white px-3 py-1.5 text-xs font-semibold text-[#5c1838] shadow-sm transition-colors hover:bg-[#5c1838]/10 disabled:pointer-events-none disabled:opacity-50"
            >
              {pdfLoading ? "Generando PDF…" : "Exportar PDF"}
            </button>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                patient.internado
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-stone-200 text-stone-800"
              }`}
            >
              {patient.internado ? "Internado" : "Alta"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#ebe6df] pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#8b7355]">
            Datos de ingreso
          </span>
          {puedeEditar && !editandoDatosIngreso && (
            <button
              type="button"
              onClick={() => setEditandoDatosIngreso(true)}
              className="-m-1 flex items-center gap-1.5 rounded-lg p-1 text-[13px] font-medium text-[#5c1838] hover:bg-[#f5f0eb]"
              aria-label="Editar datos de ingreso"
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </button>
          )}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#8b7355]">
              Fecha de ingreso
            </label>
            <input
              type="date"
              value={headerFecha.slice(0, 10)}
              onChange={(e) => setHeaderFecha(e.target.value)}
              disabled={!puedeEditar || !editandoDatosIngreso}
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3 py-2 text-sm outline-none focus:border-[#5c1838] disabled:bg-[#f5f5f5]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#8b7355]">
              Hora
            </label>
            <input
              type="time"
              value={headerHora}
              onChange={(e) => setHeaderHora(e.target.value)}
              disabled={!puedeEditar || !editandoDatosIngreso}
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3 py-2 text-sm outline-none focus:border-[#5c1838] disabled:bg-[#f5f5f5]"
            />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#8b7355]">
              Días internado
            </p>
            <p className="whitespace-nowrap rounded-xl border border-transparent bg-[#f5f0eb] px-3 py-2 text-sm font-medium text-[#333]">
              {diasInternacion} día{diasInternacion !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#8b7355]">
            Motivo de ingreso
          </label>
          <textarea
            value={headerMotivo}
            onChange={(e) => setHeaderMotivo(e.target.value)}
            disabled={!puedeEditar || !editandoDatosIngreso}
            rows={2}
            className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3 py-2 text-sm outline-none focus:border-[#5c1838] disabled:bg-[#f5f5f5]"
          />
        </div>

        <div className="mt-3">
          <label
            htmlFor="internacion-vet-responsable"
            className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#8b7355]"
          >
            Veterinario responsable
          </label>
          <select
            id="internacion-vet-responsable"
            value={headerVetSelectValue}
            disabled={!puedeEditar || !editandoDatosIngreso || vetListLoading}
            onChange={(e) => setHeaderVet(e.target.value)}
            aria-invalid={Boolean(vetListError)}
            aria-describedby={
              vetListError ? "internacion-vet-list-err" : undefined
            }
            className={`w-full min-h-[48px] cursor-pointer rounded-xl border-[1.5px] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:shadow-[0_0_0_3px_rgba(92,24,56,0.12)] disabled:cursor-wait disabled:opacity-70 ${inputErrorRing(
              Boolean(vetListError),
            )}`}
          >
            <option value="">
              {vetListLoading
                ? "Cargando veterinarios…"
                : "Elegir veterinario..."}
            </option>
            {vetOpciones.map((v) => (
              <option key={v.id} value={v.nombre}>
                {v.nombre}
              </option>
            ))}
          </select>
          {vetListError ? (
            <FieldError id="internacion-vet-list-err" message={vetListError} />
          ) : null}
        </div>

        {puedeEditar && editandoDatosIngreso ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={saving === "datos"}
              onClick={() => void guardarDatosIngreso()}
              className="rounded-full bg-[#5c1838] px-5 py-2 text-sm font-medium text-white hover:bg-[#401127] disabled:opacity-60"
            >
              {saving === "datos" ? "Guardando…" : "Guardar datos de ingreso"}
            </button>
          </div>
        ) : null}
      </section>

      {/* Diagnóstico presuntivo */}
      <section className={`${cardClass} mt-5`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-[#5c1838]">
            Diagnóstico presuntivo
          </h2>
          {puedeEditar ? (
            <button
              type="button"
              onClick={() => setDiagModalOpen(true)}
              className="-m-1 flex shrink-0 items-center justify-center rounded-lg p-1 text-[#5c1838] hover:bg-[#f0faf5]"
              aria-label="Editar diagnóstico presuntivo"
              title="Editar diagnóstico presuntivo"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {d.diagnosticoPrincipal.trim() ? (
          <div className="mt-4 rounded-xl border border-[#ebe6df] bg-[#faf8f5] p-4">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#333]">
              {d.diagnosticoPrincipal}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-[14px] text-[#888]">
            {puedeEditar
              ? "No hay diagnóstico registrado. Agregalo tocando el lápiz de arriba."
              : "No hay diagnóstico registrado."}
          </p>
        )}
        <p className="mt-3 text-[12px] text-[#888]">
          Última edición:{" "}
          {d.diagnosticoEditadoEn
            ? formatFechaHoraDisplay(d.diagnosticoEditadoEn)
            : "—"}
        </p>

        {puedeEditar ? (
          <DiagnosticoPresuntivoModal
            open={diagModalOpen}
            onClose={() => setDiagModalOpen(false)}
            initialText={d.diagnosticoPrincipal}
            saving={saving === "datos"}
            onSave={async (text) => {
              if (!patient || !datos) return;
              await persistDatos({
                ...datos,
                diagnosticoPrincipal: text,
                diagnosticoEditadoEn: new Date().toISOString(),
              });
              toast.success("Diagnóstico guardado");
              setDiagModalOpen(false);
            }}
          />
        ) : null}
      </section>

      {/* Plan */}
      <section className={`${cardClass} mt-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-[#5c1838]">
            Plan de tratamiento
          </h2>
          {puedeEditar ? (
            <button
              type="button"
              onClick={() => setPlanModalOpen(true)}
              className="text-sm font-medium text-[#5c1838] underline"
            >
              + Agregar orden
            </button>
          ) : null}
        </div>

        <PlanesTratamientoLista
          items={ordenesTratamientoRecientesPrimero(d.ordenes)}
          puedeEditar={puedeEditar}
          toggleDisabled={saving === "datos"}
          onToggleActiva={(id) => void toggleOrdenActiva(id)}
        />

        {puedeEditar ? (
          <PlanTratamientoModal
            open={planModalOpen}
            onClose={() => setPlanModalOpen(false)}
            onSave={async (orden) => {
              if (!patient) return;
              const di = datosSeguros(patient.datosInternacion);
              await persistDatos({
                ...di,
                ordenes: [orden, ...di.ordenes],
              });
              toast.success("Orden registrada");
              setPlanModalOpen(false);
            }}
          />
        ) : null}
      </section>

      {/* Evoluciones */}
      <section className={`${cardClass} mt-5 mb-8`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-[#5c1838]">
            Hoja de evolución por ronda
          </h2>
          {puedeEditar ? (
            <button
              type="button"
              onClick={() => setEvoModalOpen(true)}
              className="text-sm font-medium text-[#5c1838] underline"
            >
              + Registrar evolución
            </button>
          ) : null}
        </div>

        <EvolucionesLista
          items={evolucionesOrdenadas(d.evoluciones)}
        />

        {puedeEditar ? (
          <EvolucionModal
            open={evoModalOpen}
            onClose={() => setEvoModalOpen(false)}
            vetOpciones={vetOpciones}
            vetListLoading={vetListLoading}
            vetListError={vetListError}
            onSave={async (evo) => {
              if (!patient) return;
              const di = datosSeguros(patient.datosInternacion);
              await persistDatos({
                ...di,
                evoluciones: [evo, ...di.evoluciones],
              });
              toast.success("Evolución registrada");
              setEvoModalOpen(false);
            }}
          />
        ) : null}
      </section>

      <div className="mt-5 mb-8">
        <HistorialModificacionesPanel items={patient.historialModificaciones} />
      </div>
    </main>
  );
}

function DiagnosticoPresuntivoModal({
  open,
  onClose,
  initialText,
  saving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialText: string;
  saving: boolean;
  onSave: (text: string) => void | Promise<void>;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    setText(initialText);
  }, [open, initialText]);

  const guardar = async () => {
    await onSave(text.trim());
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="diag-presuntivo-titulo">
      <h2 id="diag-presuntivo-titulo" className="text-lg font-bold text-[#5c1838]">
        Diagnóstico presuntivo
      </h2>
      <div className="mt-4">
        <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
          Texto
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="max-h-[min(60vh,400px)] w-full rounded-xl border border-[#e8e0d8] px-3 py-2.5 text-sm leading-relaxed"
          placeholder="Diagnóstico presuntivo o confirmado…"
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#e8e0d8] px-4 py-2 text-sm font-medium text-[#555]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void guardar()}
          className="rounded-full bg-[#5c1838] px-4 py-2 text-sm font-medium text-white hover:bg-[#401127] disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

function PlanesTratamientoLista({
  items,
  puedeEditar,
  toggleDisabled,
  onToggleActiva,
}: {
  items: OrdenTratamientoInternacion[];
  puedeEditar: boolean;
  toggleDisabled?: boolean;
  onToggleActiva: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="mt-4 text-[14px] text-[#888]">
        No hay órdenes registradas. Agregá la primera con el botón de arriba.
      </p>
    );
  }
  const pillClass = (activa: boolean) =>
    `rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
      activa
        ? "bg-emerald-100 text-emerald-900"
        : "bg-stone-200 text-stone-800"
    }`;

  return (
    <ul className="mt-4 space-y-4">
      {items.map((o) => (
        <li
          key={o.id}
          className="rounded-xl border border-[#ebe6df] bg-[#faf8f5] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebe6df] pb-2">
            <span className="text-sm font-semibold text-[#1a1a1a]">
              {o.medicamentoOProcedimiento || "Orden"}
            </span>
            {puedeEditar ? (
              <button
                type="button"
                disabled={toggleDisabled}
                onClick={() => onToggleActiva(o.id)}
                title={
                  o.activa
                    ? "Marcar como finalizada"
                    : "Marcar como activa"
                }
                aria-pressed={o.activa}
                className={`${pillClass(o.activa)} shrink-0 cursor-pointer border-0 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c1838]/35 disabled:cursor-wait disabled:opacity-60`}
              >
                {o.activa ? "Activa" : "Finalizada"}
              </button>
            ) : (
              <span className={`${pillClass(o.activa)} shrink-0`}>
                {o.activa ? "Activa" : "Finalizada"}
              </span>
            )}
          </div>
          <div className="mt-2 grid gap-1.5 text-[13px] text-[#555] sm:grid-cols-2">
            <span>
              <span className="text-[#888]">Vía: </span>
              {o.viaAdministracion.trim() || "—"}
            </span>
            <span>
              <span className="text-[#888]">Dosis: </span>
              {o.dosis.trim() || "—"}
            </span>
            <span>
              <span className="text-[#888]">Frecuencia: </span>
              {o.frecuencia.trim() || "—"}
            </span>
            <span>
              <span className="text-[#888]">Inicio: </span>
              {o.fechaInicio ? formatFecha(o.fechaInicio.slice(0, 10)) : "—"}
            </span>
            <span className="sm:col-span-2">
              <span className="text-[#888]">Fin: </span>
              {o.fechaFin?.trim()
                ? formatFecha(o.fechaFin.slice(0, 10))
                : "—"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlanTratamientoModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (o: OrdenTratamientoInternacion) => void | Promise<void>;
}) {
  const [medicamento, setMedicamento] = useState("");
  const [via, setVia] = useState("");
  const [dosis, setDosis] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [fechaInicio, setFechaInicio] = useState(todayISODate());
  const [fechaFin, setFechaFin] = useState("");
  const [activa, setActiva] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMedicamento("");
    setVia("");
    setDosis("");
    setFrecuencia("");
    setFechaInicio(todayISODate());
    setFechaFin("");
    setActiva(true);
  }, [open]);

  const guardar = async () => {
    const med = medicamento.trim();
    if (!med) {
      toast.error("Indicá medicamento o procedimiento.");
      return;
    }
    setSaving(true);
    try {
      const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const orden: OrdenTratamientoInternacion = {
        id,
        medicamentoOProcedimiento: med,
        viaAdministracion: via.trim(),
        dosis: dosis.trim(),
        frecuencia: frecuencia.trim(),
        fechaInicio: fechaInicio.slice(0, 10),
        fechaFin: fechaFin.trim() ? fechaFin.slice(0, 10) : undefined,
        activa,
      };
      await onSave(orden);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="plan-orden-titulo">
      <h2 id="plan-orden-titulo" className="text-lg font-bold text-[#5c1838]">
        Nueva orden de tratamiento
      </h2>
      <div className="mt-4 max-h-[min(70vh,520px)] space-y-3 overflow-y-auto pr-1">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
            Medicamento / procedimiento *
          </label>
          <input
            value={medicamento}
            onChange={(e) => setMedicamento(e.target.value)}
            className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
            Vía de administración
          </label>
          <input
            value={via}
            onChange={(e) => setVia(e.target.value)}
            className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              Dosis
            </label>
            <input
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              Frecuencia
            </label>
            <input
              value={frecuencia}
              onChange={(e) => setFrecuencia(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
              placeholder="ej. cada 8 hs"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={fechaInicio.slice(0, 10)}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              Fecha de fin (opcional)
            </label>
            <input
              type="date"
              value={fechaFin.slice(0, 10)}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#333]">
          <input
            type="checkbox"
            checked={activa}
            onChange={(e) => setActiva(e.target.checked)}
            className="h-4 w-4 rounded border-[#ccc] text-[#5c1838]"
          />
          Orden activa
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#e8e0d8] px-4 py-2 text-sm font-medium text-[#555]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void guardar()}
          className="rounded-full bg-[#5c1838] px-4 py-2 text-sm font-medium text-white hover:bg-[#401127] disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar orden"}
        </button>
      </div>
    </Modal>
  );
}

function EvolucionesLista({
  items,
}: {
  items: EvolucionRondaInternacion[];
}) {
  if (items.length === 0) {
    return (
      <p className="mt-4 text-[14px] text-[#888]">
        Aún no hay evoluciones registradas.
      </p>
    );
  }
  return (
    <ul className="mt-4 space-y-4">
      {items.map((e) => (
        <li
          key={e.id}
          className="rounded-xl border border-[#ebe6df] bg-[#faf8f5] p-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ebe6df] pb-2">
            <span className="text-sm font-semibold text-[#1a1a1a]">
              {formatFechaHoraDisplay(e.fechaHora)}
            </span>
            <span className="text-[13px] text-[#5c1838]">
              👨‍⚕️ {e.veterinario || "—"}
            </span>
          </div>
          <div className="mt-2 grid gap-1 text-[13px] text-[#555] sm:grid-cols-2">
            <span>Temp: {e.temperatura || "—"} °C</span>
            <span>FC: {e.frecuenciaCardiaca || "—"} lpm</span>
            <span>FR: {e.frecuenciaRespiratoria || "—"} rpm</span>
            <span>Peso: {e.peso?.trim() ? `${e.peso} kg` : "—"}</span>
          </div>
          {e.observaciones.trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[#333]">
              {e.observaciones}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function EvolucionModal({
  open,
  onClose,
  vetOpciones,
  vetListLoading,
  vetListError,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  vetOpciones: { id: string; nombre: string }[];
  vetListLoading: boolean;
  vetListError: string | null;
  onSave: (e: EvolucionRondaInternacion) => void | Promise<void>;
}) {
  const [fechaHora, setFechaHora] = useState("");
  const [veterinario, setVeterinario] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [peso, setPeso] = useState("");
  const [estadoGeneral, setEstadoGeneral] =
    useState<EstadoGeneralEvolucion>("Estable");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setFechaHora(local);
    setVeterinario("");
    setTemperatura("");
    setFc("");
    setFr("");
    setPeso("");
    setEstadoGeneral("Estable");
    setObservaciones("");
  }, [open]);

  const guardar = async () => {
    const fh = fechaHora.trim();
    if (!fh) {
      toast.error("Indicá fecha y hora.");
      return;
    }
    const iso = new Date(fh).toISOString();
    if (Number.isNaN(Date.parse(iso))) {
      toast.error("Fecha u hora no válida.");
      return;
    }
    const vetNombre = veterinario.trim();
    if (!vetNombre || !vetOpciones.some((v) => v.nombre === vetNombre)) {
      toast.error("Elegí el veterinario de la lista.");
      return;
    }
    setSaving(true);
    try {
      const id = `evo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const evo: EvolucionRondaInternacion = {
        id,
        fechaHora: iso,
        veterinario: vetNombre,
        temperatura: temperatura.trim(),
        frecuenciaCardiaca: fc.trim(),
        frecuenciaRespiratoria: fr.trim(),
        peso: peso.trim() || undefined,
        estadoGeneral,
        observaciones: observaciones.trim(),
      };
      await onSave(evo);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="evo-titulo">
      <h2 id="evo-titulo" className="text-lg font-bold text-[#5c1838]">
        Registrar evolución
      </h2>
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
            Fecha y hora
          </label>
          <input
            type="datetime-local"
            value={fechaHora}
            onChange={(e) => setFechaHora(e.target.value)}
            className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
          />
        </div>
        <div
          className="rounded-[14px] border border-[#b7d5c9] bg-[#f0faf5] p-3.5"
        >
          <label
            htmlFor="evo-modal-vet"
            className="mb-1.5 block text-[13px] font-semibold text-[#401127]"
          >
            Veterinario *
          </label>
          <select
            id="evo-modal-vet"
            value={veterinario}
            disabled={vetListLoading}
            onChange={(e) => setVeterinario(e.target.value)}
            aria-invalid={Boolean(vetListError)}
            aria-describedby={
              vetListError ? "evo-modal-vet-list-err" : undefined
            }
            className={`w-full min-h-[48px] cursor-pointer rounded-xl border-[1.5px] border-[#5c1838] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#401127] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.2)] disabled:cursor-wait disabled:opacity-70 ${inputErrorRing(
              Boolean(vetListError),
            )}`}
          >
            <option value="">
              {vetListLoading
                ? "Cargando veterinarios…"
                : "Elegir veterinario..."}
            </option>
            {vetOpciones.map((v) => (
              <option key={v.id} value={v.nombre}>
                {v.nombre}
              </option>
            ))}
          </select>
          {vetListError ? (
            <FieldError id="evo-modal-vet-list-err" message={vetListError} />
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              Temp (°C)
            </label>
            <input
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              Peso (kg)
            </label>
            <input
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              FC (lpm)
            </label>
            <input
              value={fc}
              onChange={(e) => setFc(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
              FR (rpm)
            </label>
            <input
              value={fr}
              onChange={(e) => setFr(e.target.value)}
              className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase text-[#8b7355]">
            Observaciones
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#e8e0d8] px-4 py-2 text-sm font-medium text-[#555]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={saving || vetListLoading || Boolean(vetListError)}
          onClick={() => void guardar()}
          className="rounded-full bg-[#5c1838] px-4 py-2 text-sm font-medium text-white hover:bg-[#401127] disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar evolución"}
        </button>
      </div>
    </Modal>
  );
}
