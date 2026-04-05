"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePatients } from "@/components/providers/patients-provider";
import { dueñosParaBusqueda } from "@/lib/dueños-utils";
import {
  esPacienteActivo,
  type Consulta,
  type Paciente,
} from "@/types/patient";
import { LottieSpinner } from "@/components/ui/lottie-loading";
import { ConsultaModal } from "./consulta-modal";
import { DashboardNav } from "./dashboard-nav";
import { NewPatientWizard } from "./new-patient-wizard";
import { PatientGrid } from "./patient-grid";
import { PatientSearch } from "./patient-search";

export function Dashboard() {
  const router = useRouter();
  const { patients, ready, addPatient, addConsulta } = usePatients();
  const [query, setQuery] = useState("");
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
      !term ||
      p.nombre.toLowerCase().includes(term) ||
      dueñosParaBusqueda(p).toLowerCase().includes(term) ||
      (p.raza || "").toLowerCase().includes(term);

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
  }, [patients, query]);

  const openFicha = (id: string) => {
    router.push(`/patient/${id}`);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
        <DashboardNav onNewPatient={() => {}} />
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 text-[#888]"
          role="status"
          aria-label="Cargando pacientes"
        >
          <LottieSpinner size={140} />
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
      <DashboardNav onNewPatient={() => setWizardOpen(true)} />

      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
        <PatientSearch value={query} onChange={setQuery} />

        <section className="mb-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-[#2d6a4f]">
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
              className="mb-4 text-left text-[13px] font-semibold text-[#6b5b4a] underline decoration-[#c4bbb0] underline-offset-2 hover:text-[#2d6a4f]"
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
            router.push(`/patient/${id}`);
          }
        }}
      />
    </div>
  );
}
