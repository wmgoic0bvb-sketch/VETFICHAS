"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePatients } from "@/components/providers/patients-provider";
import { dueñosParaBusqueda } from "@/lib/dueños-utils";
import type { Consulta, Paciente } from "@/types/patient";
import { ConsultaModal } from "./consulta-modal";
import { DashboardNav } from "./dashboard-nav";
import { NewPatientWizard } from "./new-patient-wizard";
import { PatientDetailModal } from "./patient-detail-modal";
import { PatientGrid } from "./patient-grid";
import { PatientSearch } from "./patient-search";

export function Dashboard() {
  const router = useRouter();
  const { patients, ready, addPatient, removePatient, getById, addConsulta } =
    usePatients();
  const [query, setQuery] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [consultaOpen, setConsultaOpen] = useState(false);

  const { principales, externosOUnica } = useMemo(() => {
    const term = query.toLowerCase().trim();
    const match = (p: Paciente) =>
      !term ||
      p.nombre.toLowerCase().includes(term) ||
      dueñosParaBusqueda(p).toLowerCase().includes(term) ||
      (p.raza || "").toLowerCase().includes(term);

    const filtered = patients.filter(match);
    return {
      principales: filtered.filter((p) => !p.esExterno && !p.esUnicaConsulta),
      externosOUnica: filtered.filter((p) => p.esExterno || p.esUnicaConsulta),
    };
  }, [patients, query]);

  const selected = selectedId ? getById(selectedId) : null;

  const openFicha = (id: string) => setSelectedId(id);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f0eb]">
        <DashboardNav onNewPatient={() => {}} />
        <div className="flex flex-1 items-center justify-center text-[#888]">
          Cargando…
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
      </main>

      <NewPatientWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={(draft) => {
          const p = addPatient(draft);
          setSelectedId(p.id);
          setConsultaOpen(true);
        }}
      />

      <PatientDetailModal
        patient={selected ?? null}
        open={Boolean(selectedId && selected)}
        onClose={() => setSelectedId(null)}
        onDelete={removePatient}
        onAddConsulta={() => setConsultaOpen(true)}
        onOpenDetails={(id) => {
          setSelectedId(null);
          router.push(`/patient/${id}`);
        }}
      />

      <ConsultaModal
        open={consultaOpen}
        onClose={() => setConsultaOpen(false)}
        onSave={(data: Omit<Consulta, "id">) => {
          if (selectedId) addConsulta(selectedId, data);
        }}
      />
    </div>
  );
}
