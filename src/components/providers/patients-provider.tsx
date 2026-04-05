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
import type {
  Consulta,
  Estudio,
  Paciente,
  PacienteDraft,
  ProximoControl,
} from "@/types/patient";

function createDefaultRepository() {
  return new LocalStoragePatientRepository();
}

/** Campos editables de la ficha (sin id ni historial de consultas). */
export type PacienteEditable = Omit<PacienteDraft, "consultas">;

interface PatientsContextValue {
  patients: Paciente[];
  ready: boolean;
  addPatient: (draft: PacienteDraft) => Paciente;
  updatePatient: (id: string, data: PacienteEditable) => void;
  addProximoControl: (
    patientId: string,
    data: Omit<ProximoControl, "id">,
  ) => void;
  updateProximoControl: (
    patientId: string,
    controlId: string,
    patch: Partial<Omit<ProximoControl, "id">>,
  ) => void;
  removeProximoControl: (patientId: string, controlId: string) => void;
  removePatient: (id: string) => void;
  getById: (id: string) => Paciente | undefined;
  addConsulta: (patientId: string, consulta: Omit<Consulta, "id">) => void;
  addEstudio: (patientId: string, estudio: Omit<Estudio, "id" | "fecha">) => void;
  removeEstudio: (patientId: string, estudioId: string) => void;
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
        estado: draft.estado ?? "activo",
        id: `${Date.now()}`,
        consultas: draft.consultas ?? [],
        estudios: draft.estudios ?? [],
        proximosControles: draft.proximosControles ?? [],
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

  const updatePatient = useCallback(
    (id: string, data: PacienteEditable) => {
      setPatients((prev) => {
        const next = prev.map((p) =>
          p.id === id
            ? {
                ...p,
                especie: data.especie,
                nombre: data.nombre,
                raza: data.raza,
                sexo: data.sexo,
                fnac: data.fnac,
                castrado: data.castrado,
                color: data.color,
                dueños: data.dueños,
                dir: data.dir,
                estado: data.estado ?? "activo",
                esExterno: data.esExterno,
                esUnicaConsulta: data.esUnicaConsulta,
                proximosControles: data.proximosControles ?? [],
              }
            : p,
        );
        repository.persist(next);
        return next;
      });
    },
    [repository],
  );

  const addProximoControl = useCallback(
    (patientId: string, data: Omit<ProximoControl, "id">) => {
      const control: ProximoControl = {
        ...data,
        id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      };
      setPatients((prev) => {
        const next = prev.map((p) =>
          p.id === patientId
            ? { ...p, proximosControles: [...p.proximosControles, control] }
            : p,
        );
        repository.persist(next);
        return next;
      });
    },
    [repository],
  );

  const updateProximoControl = useCallback(
    (
      patientId: string,
      controlId: string,
      patch: Partial<Omit<ProximoControl, "id">>,
    ) => {
      setPatients((prev) => {
        const next = prev.map((p) => {
          if (p.id !== patientId) return p;
          return {
            ...p,
            proximosControles: p.proximosControles.map((c) =>
              c.id === controlId ? { ...c, ...patch } : c,
            ),
          };
        });
        repository.persist(next);
        return next;
      });
    },
    [repository],
  );

  const removeProximoControl = useCallback(
    (patientId: string, controlId: string) => {
      setPatients((prev) => {
        const next = prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                proximosControles: p.proximosControles.filter(
                  (c) => c.id !== controlId,
                ),
              }
            : p,
        );
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

  const addEstudio = useCallback(
    (patientId: string, data: Omit<Estudio, "id" | "fecha">) => {
      const estudio: Estudio = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        fecha: new Date().toISOString(),
      };
      setPatients((prev) => {
        const next = prev.map((p) =>
          p.id === patientId
            ? { ...p, estudios: [...(p.estudios ?? []), estudio] }
            : p,
        );
        repository.persist(next);
        return next;
      });
    },
    [repository],
  );

  const removeEstudio = useCallback(
    (patientId: string, estudioId: string) => {
      setPatients((prev) => {
        const next = prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                estudios: (p.estudios ?? []).filter((e) => e.id !== estudioId),
              }
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
      updatePatient,
      addProximoControl,
      updateProximoControl,
      removeProximoControl,
      removePatient,
      getById,
      addConsulta,
      addEstudio,
      removeEstudio,
    }),
    [
      patients,
      ready,
      addPatient,
      updatePatient,
      addProximoControl,
      updateProximoControl,
      removeProximoControl,
      removePatient,
      getById,
      addConsulta,
      addEstudio,
      removeEstudio,
    ],
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
