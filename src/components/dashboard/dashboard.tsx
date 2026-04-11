"use client";

import { useEffect, useMemo, useState } from "react";
import { usePatients } from "@/components/providers/patients-provider";
import { dueñosParaBusqueda } from "@/lib/dueños-utils";
import {
  esPacienteActivo,
  type Consulta,
  type Paciente,
} from "@/types/patient";
import { DbLoadingOverlay, LottieSpinner } from "@/components/ui/lottie-loading";
import { useSession } from "next-auth/react";
import { usePendingNavigation } from "@/lib/use-pending-navigation";
import type { SucursalPaciente } from "@/types/patient";
import { ConsultaModal } from "./consulta-modal";
import { AppShell } from "@/components/layout/app-shell";
import { NewPatientWizard } from "./new-patient-wizard";
import { PatientGrid } from "./patient-grid";
import { PatientSearch } from "./patient-search";

export function Dashboard() {
  const { push, isPending } = usePendingNavigation();
  const { data: session } = useSession();
  const { patients, ready, isRefreshing, refresh, addPatient, addConsulta } = usePatients();
  const [query, setQuery] = useState("");
  const [sucursalFiltro, setSucursalFiltro] = useState<SucursalPaciente | null>(null);
  const [filtroInicializado, setFiltroInicializado] = useState(false);

  useEffect(() => {
    if (filtroInicializado || !session) return;
    setSucursalFiltro(session.user?.sucursal ?? null);
    setFiltroInicializado(true);
  }, [session, filtroInicializado]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [consultaOpen, setConsultaOpen] = useState(false);
  const [detailAfterConsulta, setDetailAfterConsulta] = useState(false);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);

  const {
    principales,
    externosOUnica,
    archivPrincipales,
    archivExternos,
    totalArchivados,
  } = useMemo(() => {
    const term = query.toLowerCase().trim();
    const match = (p: Paciente) =>
      (!term ||
        p.nombre.toLowerCase().includes(term) ||
        dueñosParaBusqueda(p).toLowerCase().includes(term) ||
        (p.raza || "").toLowerCase().includes(term)) &&
      (!sucursalFiltro || p.sucursal === sucursalFiltro);

    const activos = patients.filter(esPacienteActivo);
    const archiv = patients.filter((p) => !esPacienteActivo(p));

    const filteredActivos = activos.filter(match);
    const filteredArch = archiv.filter(match);
    return {
      principales: filteredActivos.filter(
        (p) => !p.esExterno && !p.esUnicaConsulta,
      ),
      externosOUnica: filteredActivos.filter(
        (p) => p.esExterno || p.esUnicaConsulta,
      ),
      archivPrincipales: filteredArch.filter(
        (p) => !p.esExterno && !p.esUnicaConsulta,
      ),
      archivExternos: filteredArch.filter(
        (p) => p.esExterno || p.esUnicaConsulta,
      ),
      totalArchivados: archiv.length,
    };
  }, [patients, query, sucursalFiltro]);

  const openFicha = (id: string) => {
    push(`/patient/${id}`);
  };

  if (!ready) {
    return (
      <AppShell onNewPatient={() => {}}>
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 text-[#888]"
          role="status"
          aria-label="Cargando pacientes"
        >
          <LottieSpinner size={140} />
          <span className="text-sm">Cargando…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell onNewPatient={() => setWizardOpen(true)}>
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
        <div className="mb-5 flex items-center gap-2 [&>div:first-child]:mb-0 [&>div:first-child]:flex-1 [&>div:first-child]:min-w-0">
          <PatientSearch value={query} onChange={setQuery} />
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            aria-label="Actualizar lista de pacientes"
            title="Actualizar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8e0d8] bg-white text-[#5c1838] transition hover:bg-[#efe8e0] disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
              aria-hidden
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          {(
            [
              { label: "Todas", value: null },
              { label: "AVENIDA", value: "AVENIDA" },
              { label: "VILLEGAS", value: "VILLEGAS" },
              { label: "MITRE", value: "MITRE" },
            ] as const
          ).map(({ label, value }) => {
            const active = sucursalFiltro === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSucursalFiltro(value)}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "border-[#8b5e3c] bg-[#8b5e3c] text-white"
                    : "border-[#e8e0d8] bg-white text-[#8b5e3c] hover:border-[#8b5e3c]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <section className="mb-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-[#5c1838]">
            Pacientes
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
            <PatientGrid patients={principales} onOpen={openFicha} />
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.06em] text-[#8b7355]">
            Externos y única consulta
          </h2>
          <p className="mb-3 text-[13px] text-[#888]">
            Pacientes de otra veterinaria o marcados como única consulta.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
            <PatientGrid
              patients={externosOUnica}
              onOpen={openFicha}
              emptyMessage={
                <p className="text-[15px]">
                  Ningún paciente en esta categoría con el filtro actual.
                </p>
              }
            />
          </div>
        </section>

        {totalArchivados > 0 ? (
          <section className="mt-10 border-t border-[#e8e0d8] pt-8">
            <button
              type="button"
              onClick={() => setMostrarArchivados((v) => !v)}
              className="mb-4 text-left text-[13px] font-semibold text-[#6b5b4a] underline decoration-[#c4bbb0] underline-offset-2 hover:text-[#5c1838]"
            >
              {mostrarArchivados ? "Ocultar" : "Mostrar"} fichas archivadas (
              {totalArchivados}) — ocultos del listado principal
            </button>
            {mostrarArchivados ? (
              <>
                <section className="mb-10">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-[#6b5b4a]">
                    Archivados — pacientes
                  </h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                    <PatientGrid
                      patients={archivPrincipales}
                      onOpen={openFicha}
                      emptyMessage={
                        <p className="text-[15px]">
                          Ninguno en esta categoría con el filtro actual.
                        </p>
                      }
                    />
                  </div>
                </section>
                <section>
                  <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.06em] text-[#6b5b4a]">
                    Archivados — externos y única consulta
                  </h2>
                  <p className="mb-3 text-[13px] text-[#888]">
                    Mismo criterio que arriba, pero ya no en seguimiento activo.
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                    <PatientGrid
                      patients={archivExternos}
                      onOpen={openFicha}
                      emptyMessage={
                        <p className="text-[15px]">
                          Ninguno en esta categoría con el filtro actual.
                        </p>
                      }
                    />
                  </div>
                </section>
              </>
            ) : null}
          </section>
        ) : null}
      </main>

      <NewPatientWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        defaultSucursal={session?.user?.sucursal ?? null}
        onSave={async (draft) => {
          const p = await addPatient(draft);
          setSelectedId(p.id);
          setDetailAfterConsulta(true);
          setConsultaOpen(true);
        }}
      />

      <ConsultaModal
        open={consultaOpen}
        onClose={() => {
          setConsultaOpen(false);
          setDetailAfterConsulta(false);
        }}
        onSave={async (data: Omit<Consulta, "id">) => {
          if (!selectedId) return;
          await addConsulta(selectedId, data);
          if (detailAfterConsulta) {
            const id = selectedId;
            setDetailAfterConsulta(false);
            setSelectedId(null);
            push(`/patient/${id}`);
          }
        }}
      />

      <DbLoadingOverlay show={isPending} label="Cargando ficha…" />
    </AppShell>
  );
}
