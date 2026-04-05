"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { draftFromPatient } from "@/components/dashboard/patient-ficha-edit-form";
import { PatientCard } from "@/components/dashboard/patient-card";
import { PatientSearch } from "@/components/dashboard/patient-search";
import { usePatients } from "@/components/providers/patients-provider";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { defaultDatosInternacion } from "@/lib/internacion-utils";
import {
  dueñosParaBusqueda,
  formatDueñosCorto,
} from "@/lib/dueños-utils";
import type { Paciente } from "@/types/patient";

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
  const router = useRouter();
  const { patients, ready, updatePatient } = usePatients();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const finalizarInternacion = async (p: Paciente) => {
    setBusyId(p.id);
    try {
      const base = p.datosInternacion ?? defaultDatosInternacion();
      await updatePatient(p.id, {
        ...draftFromPatient(p),
        internado: false,
        datosInternacion: {
          ...base,
          fechaAlta: new Date().toISOString(),
        },
      });
      toast.success(`Internación finalizada para ${p.nombre}`);
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
                      <span className="block font-semibold text-[#1a1a1a]">
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
                  onOpen={(id) => router.push(`/internaciones/${id}`)}
                />
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => void finalizarInternacion(p)}
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
    </main>
  );
}
