"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { draftFromPatient } from "@/components/dashboard/patient-ficha-edit-form";
import { PatientCard } from "@/components/dashboard/patient-card";
import { PatientSearch } from "@/components/dashboard/patient-search";
import { usePatients } from "@/components/providers/patients-provider";
import { DbLoadingOverlay, LottieSpinner } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import { usePendingNavigation } from "@/lib/use-pending-navigation";
import { defaultDatosInternacion } from "@/lib/internacion-utils";
import {
  dueñosParaBusqueda,
  formatDueñosCorto,
} from "@/lib/dueños-utils";
import type { InternacionHistorial, Paciente, TipoEgreso } from "@/types/patient";

interface EgresoModalState {
  paciente: Paciente;
  tipo: TipoEgreso;
  fechaHoraLocal: string;
  causa: string;
}

function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function matchPaciente(query: string, p: Paciente): boolean {
  const term = query.toLowerCase().trim();
  if (!term) return false;
  return (
    p.nombre.toLowerCase().includes(term) ||
    dueñosParaBusqueda(p).toLowerCase().includes(term) ||
    (p.raza || "").toLowerCase().includes(term)
  );
}

export function InternacionesView() {
  const { push, isPending } = usePendingNavigation();
  const { patients, ready, updatePatient } = usePatients();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [egresoModal, setEgresoModal] = useState<EgresoModalState | null>(null);

  const internados = useMemo(
    () => patients.filter((p) => p.internado),
    [patients],
  );

  const candidatos = useMemo(() => {
    if (!query.trim()) return [];
    return patients.filter(
      (p) => matchPaciente(query, p) && !p.internado,
    );
  }, [patients, query]);

  const hayCoincidenciasPeroTodosInternados = useMemo(() => {
    const term = query.trim();
    if (!term) return false;
    const matches = patients.filter((p) => matchPaciente(query, p));
    return matches.length > 0 && matches.every((p) => p.internado);
  }, [patients, query]);

  const internar = async (p: Paciente) => {
    setBusyId(p.id);
    try {
      await updatePatient(p.id, {
        ...draftFromPatient(p),
        internado: true,
        datosInternacion: defaultDatosInternacion(),
      });
      toast.success(`${p.nombre} ingresó a internación`);
      setQuery("");
    } catch {
      /* toast en updatePatient */
    } finally {
      setBusyId(null);
    }
  };

  const abrirEgresoModal = (p: Paciente) => {
    setEgresoModal({ paciente: p, tipo: "alta", fechaHoraLocal: nowDatetimeLocal(), causa: "" });
  };

  const confirmarEgreso = async () => {
    if (!egresoModal) return;
    const { paciente, tipo, fechaHoraLocal, causa } = egresoModal;
    setEgresoModal(null);
    setBusyId(paciente.id);
    try {
      const base = paciente.datosInternacion ?? defaultDatosInternacion();
      const internacionCompletada = {
        ...base,
        fechaAlta: new Date(fechaHoraLocal).toISOString(),
        tipoEgreso: tipo,
        ...(tipo === "fallecimiento" && causa.trim()
          ? { causaFallecimiento: causa.trim() }
          : {}),
      };
      const histEntry: InternacionHistorial = {
        ...internacionCompletada,
        id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      await updatePatient(paciente.id, {
        ...draftFromPatient(paciente),
        internado: false,
        datosInternacion: undefined,
        historialInternaciones: [
          ...(paciente.historialInternaciones ?? []),
          histEntry,
        ],
      });
      toast.success(
        tipo === "fallecimiento"
          ? `Fallecimiento registrado para ${paciente.nombre}`
          : `Internación finalizada para ${paciente.nombre}`,
      );
    } catch {
      /* toast en updatePatient */
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) {
    return (
      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-[#888]">
        <LottieSpinner size={140} />
        <span className="text-sm">Cargando…</span>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#5c1838]">
        Internaciones
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#555]">
        Buscá un paciente para registrar su ingreso a internación. Los
        internados activos aparecen abajo.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-[#5c1838]">
          Buscar e ingresar
        </h2>
        <PatientSearch value={query} onChange={setQuery} />

        {query.trim() ? (
          candidatos.length > 0 ? (
            <ul
              className="mb-2 divide-y divide-[#ebe6df] overflow-hidden rounded-2xl border-[1.5px] border-[#e8e0d8] bg-white"
              role="listbox"
              aria-label="Resultados de búsqueda"
            >
              {candidatos.slice(0, 20).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => void internar(p)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f5f0eb] disabled:opacity-60"
                  >
                    <span className="text-2xl" aria-hidden>
                      {p.especie === "Perro" ? "🐶" : "🐱"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold capitalize text-[#1a1a1a]">
                        {p.nombre}
                      </span>
                      <span className="text-[13px] text-[#888]">
                        {p.raza || p.especie} · 👤{" "}
                        {formatDueñosCorto(p.dueños)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#5c1838] px-3 py-1.5 text-[12px] font-semibold text-white">
                      {busyId === p.id ? "…" : "Internar"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : hayCoincidenciasPeroTodosInternados ? (
            <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
              Los pacientes que coinciden con la búsqueda ya figuran como
              internados.
            </p>
          ) : (
            <p className="text-[15px] text-[#888]">
              No hay pacientes que coincidan con &ldquo;{query.trim()}
              &rdquo;.
            </p>
          )
        ) : (
          <p className="text-[14px] text-[#888]">
            Escribí nombre, dueño, teléfono o raza para buscar en la base.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-[#5c1838]">
          Internados
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
          {internados.length > 0 ? (
            internados.map((p) => (
              <div key={p.id} className="flex flex-col">
                <PatientCard
                  patient={p}
                  onOpen={(id) => push(`/internaciones/${id}`)}
                />
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => abrirEgresoModal(p)}
                  className="mt-2 rounded-xl border border-[#e8e0d8] bg-white px-3 py-2 text-[13px] font-medium text-[#5c1838] transition-colors hover:bg-[#f5f0eb] disabled:opacity-50"
                >
                  {busyId === p.id ? "Guardando…" : "Finalizar internación"}
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-[#aaa]">
              <p className="text-[15px]">
                No hay pacientes internados en este momento.
              </p>
            </div>
          )}
        </div>
      </section>

      <DbLoadingOverlay show={isPending} label="Cargando internación…" />

      {/* Modal de egreso */}
      <Modal
        open={egresoModal !== null}
        onClose={() => setEgresoModal(null)}
        labelledBy="egreso-modal-title"
      >
        {egresoModal && (
          <div className="flex flex-col gap-5">
            <div>
              <h2
                id="egreso-modal-title"
                className="text-[17px] font-bold text-[#1a1a1a]"
              >
                Registrar egreso
              </h2>
              <p className="mt-0.5 text-[14px] capitalize text-[#888]">
                {egresoModal.paciente.nombre}
              </p>
            </div>

            {/* Tipo de egreso */}
            <div className="flex gap-3">
              {(["alta", "fallecimiento"] as TipoEgreso[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setEgresoModal((prev) => prev && { ...prev, tipo: t })
                  }
                  className={`flex-1 rounded-xl border-2 px-3 py-3 text-[13px] font-semibold transition-colors ${
                    egresoModal.tipo === t
                      ? t === "fallecimiento"
                        ? "border-rose-600 bg-rose-50 text-rose-700"
                        : "border-[#5c1838] bg-[#f5f0eb] text-[#5c1838]"
                      : "border-[#e8e0d8] bg-white text-[#555] hover:bg-[#f5f0eb]"
                  }`}
                >
                  {t === "alta" ? "Alta médica" : "Fallecimiento"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {/* Fecha y hora — siempre visible */}
              <div>
                <label
                  htmlFor="egreso-fecha"
                  className="mb-1 block text-[13px] font-semibold text-[#1a1a1a]"
                >
                  Fecha y hora
                </label>
                <input
                  id="egreso-fecha"
                  type="datetime-local"
                  value={egresoModal.fechaHoraLocal}
                  onChange={(e) =>
                    setEgresoModal(
                      (prev) =>
                        prev && { ...prev, fechaHoraLocal: e.target.value },
                    )
                  }
                  className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-[14px] focus:outline-none focus:border-[#5c1838]"
                />
              </div>

              {/* Causa — solo para fallecimiento */}
              {egresoModal.tipo === "fallecimiento" && (
                <div>
                  <label
                    htmlFor="egreso-causa"
                    className="mb-1 block text-[13px] font-semibold text-[#1a1a1a]"
                  >
                    Causa{" "}
                    <span className="font-normal text-[#aaa]">(opcional)</span>
                  </label>
                  <input
                    id="egreso-causa"
                    type="text"
                    placeholder="Ej: insuficiencia cardíaca, trauma…"
                    value={egresoModal.causa}
                    onChange={(e) =>
                      setEgresoModal(
                        (prev) => prev && { ...prev, causa: e.target.value },
                      )
                    }
                    className="w-full rounded-xl border border-[#e8e0d8] px-3 py-2 text-[14px] focus:border-rose-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEgresoModal(null)}
                className="rounded-xl border border-[#e8e0d8] bg-white px-4 py-2 text-[13px] font-medium text-[#555] transition-colors hover:bg-[#f5f0eb]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarEgreso()}
                className={`rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-colors ${
                  egresoModal.tipo === "fallecimiento"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#5c1838] hover:bg-[#7a2149]"
                }`}
              >
                {egresoModal.tipo === "fallecimiento"
                  ? "Registrar fallecimiento"
                  : "Confirmar alta"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
