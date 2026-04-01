"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LocalStoragePatientRepository,
  type PatientRepository,
} from "@/lib/repositories/patient-repository";
import type { Consulta, Paciente, PacienteDraft } from "@/types/patient";

function createDefaultRepository() {
  return new LocalStoragePatientRepository();
}

interface PatientsContextValue {
  patients: Paciente[];
  ready: boolean;
  addPatient: (draft: PacienteDraft) => Paciente;
  removePatient: (id: string) => void;
  getById: (id: string) => Paciente | undefined;
  addConsulta: (patientId: string, consulta: Omit<Consulta, "id">) => void;
}

const PatientsContext = createContext<PatientsContextValue | null>(null);

export function PatientsProvider({
  children,
  repository: repositoryProp,
}: {
  children: ReactNode;
  repository?: PatientRepository;
}) {
  const repository = useMemo(
    () => repositoryProp ?? createDefaultRepository(),
    [repositoryProp],
  );

  const [patients, setPatients] = useState<Paciente[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPatients(repository.load());
    setReady(true);
  }, [repository]);

  const addPatient = useCallback(
    (draft: PacienteDraft): Paciente => {
      const paciente: Paciente = {
        ...draft,
        id: `${Date.now()}`,
        consultas: draft.consultas ?? [],
      };
      setPatients((prev) => {
        const next = [paciente, ...prev];
        repository.persist(next);
        return next;
      });
      return paciente;
    },
    [repository],
  );

  const removePatient = useCallback(
    (id: string) => {
      setPatients((prev) => {
        const next = prev.filter((p) => p.id !== id);
        repository.persist(next);
        return next;
      });
    },
    [repository],
  );

  const getById = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients],
  );

  const addConsulta = useCallback(
    (patientId: string, data: Omit<Consulta, "id">) => {
      const consulta: Consulta = { ...data, id: `${Date.now()}` };
      setPatients((prev) => {
        const next = prev.map((p) =>
          p.id === patientId
            ? { ...p, consultas: [...(p.consultas ?? []), consulta] }
            : p,
        );
        repository.persist(next);
        return next;
      });
    },
    [repository],
  );

  const value = useMemo(
    () => ({
      patients,
      ready,
      addPatient,
      removePatient,
      getById,
      addConsulta,
    }),
    [patients, ready, addPatient, removePatient, getById, addConsulta],
  );

  return (
    <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>
  );
}

export function usePatients(): PatientsContextValue {
  const ctx = useContext(PatientsContext);
  if (!ctx) {
    throw new Error("usePatients must be used within PatientsProvider");
  }
  return ctx;
}
