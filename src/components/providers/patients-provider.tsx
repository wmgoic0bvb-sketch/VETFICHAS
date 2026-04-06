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
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  appendEstudio,
  createPatient,
  deletePatient as deletePatientApi,
  fetchPatients,
  removeEstudioRemote,
  replacePatient,
} from "@/lib/patients-api";
import type {
  Consulta,
  Estudio,
  Paciente,
  PacienteDraft,
  ProximoControl,
} from "@/types/patient";

/** Campos editables de la ficha (sin id ni historial de consultas). */
export type PacienteEditable = Omit<PacienteDraft, "consultas">;

interface PatientsContextValue {
  patients: Paciente[];
  ready: boolean;
  addPatient: (draft: PacienteDraft) => Promise<Paciente>;
  updatePatient: (id: string, data: PacienteEditable) => Promise<void>;
  addProximoControl: (
    patientId: string,
    data: Omit<ProximoControl, "id">,
  ) => Promise<void>;
  updateProximoControl: (
    patientId: string,
    controlId: string,
    patch: Partial<Omit<ProximoControl, "id">>,
  ) => Promise<void>;
  removeProximoControl: (patientId: string, controlId: string) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  getById: (id: string) => Paciente | undefined;
  addConsulta: (
    patientId: string,
    consulta: Omit<Consulta, "id">,
  ) => Promise<void>;
  addEstudio: (
    patientId: string,
    estudio: Omit<Estudio, "id" | "fecha">,
  ) => Promise<void>;
  removeEstudio: (patientId: string, estudioId: string) => Promise<void>;
}

const PatientsContext = createContext<PatientsContextValue | null>(null);

export function PatientsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [ready, setReady] = useState(false);

  const reloadFromServer = useCallback(async () => {
    const list = await fetchPatients();
    setPatients(list);
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (status === "unauthenticated") {
      setPatients([]);
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const list = await fetchPatients();
        if (!cancelled) setPatients(list);
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar los pacientes desde el servidor.",
        );
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const addPatient = useCallback(async (draft: PacienteDraft): Promise<Paciente> => {
    try {
      const patient = await createPatient(draft);
      setPatients((prev) => [patient, ...prev]);
      return patient;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo crear el paciente.",
      );
      throw e;
    }
  }, []);

  const removePatient = useCallback(async (id: string) => {
    try {
      await deletePatientApi(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo eliminar el paciente.",
      );
      try {
        await reloadFromServer();
      } catch {
        /* ignore */
      }
    }
  }, [reloadFromServer]);

  const updatePatient = useCallback(
    async (id: string, data: PacienteEditable) => {
      let merged: Paciente | undefined;
      setPatients((prev) => {
        const cur = prev.find((p) => p.id === id);
        if (!cur) return prev;
        merged = {
          ...cur,
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
          internado: data.internado,
          datosInternacion:
            data.datosInternacion !== undefined
              ? data.datosInternacion
              : cur.datosInternacion,
          proximosControles: data.proximosControles ?? [],
          consultas: cur.consultas,
          estudios: cur.estudios,
          historialModificaciones: cur.historialModificaciones,
        };
        return prev.map((p) => (p.id === id ? merged! : p));
      });
      if (!merged) return;
      try {
        const saved = await replacePatient(merged);
        setPatients((prev) => prev.map((p) => (p.id === id ? saved : p)));
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo guardar la ficha.",
        );
        try {
          await reloadFromServer();
        } catch {
          /* ignore */
        }
      }
    },
    [reloadFromServer],
  );

  const persistOne = useCallback(
    async (next: Paciente) => {
      try {
        const saved = await replacePatient(next);
        setPatients((prev) =>
          prev.map((p) => (p.id === saved.id ? saved : p)),
        );
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudieron guardar los cambios.",
        );
        try {
          await reloadFromServer();
        } catch {
          /* ignore */
        }
      }
    },
    [reloadFromServer],
  );

  const addProximoControl = useCallback(
    async (patientId: string, data: Omit<ProximoControl, "id">) => {
      const control: ProximoControl = {
        ...data,
        id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      };
      let nextPatient: Paciente | undefined;
      setPatients((prev) => {
        const cur = prev.find((p) => p.id === patientId);
        if (!cur) return prev;
        nextPatient = {
          ...cur,
          proximosControles: [...cur.proximosControles, control],
        };
        return prev.map((p) =>
          p.id === patientId ? nextPatient! : p,
        );
      });
      if (nextPatient) await persistOne(nextPatient);
    },
    [persistOne],
  );

  const updateProximoControl = useCallback(
    async (
      patientId: string,
      controlId: string,
      patch: Partial<Omit<ProximoControl, "id">>,
    ) => {
      let nextPatient: Paciente | undefined;
      setPatients((prev) => {
        const cur = prev.find((p) => p.id === patientId);
        if (!cur) return prev;
        nextPatient = {
          ...cur,
          proximosControles: cur.proximosControles.map((c) =>
            c.id === controlId ? { ...c, ...patch } : c,
          ),
        };
        return prev.map((p) =>
          p.id === patientId ? nextPatient! : p,
        );
      });
      if (nextPatient) await persistOne(nextPatient);
    },
    [persistOne],
  );

  const removeProximoControl = useCallback(
    async (patientId: string, controlId: string) => {
      let nextPatient: Paciente | undefined;
      setPatients((prev) => {
        const cur = prev.find((p) => p.id === patientId);
        if (!cur) return prev;
        nextPatient = {
          ...cur,
          proximosControles: cur.proximosControles.filter(
            (c) => c.id !== controlId,
          ),
        };
        return prev.map((p) =>
          p.id === patientId ? nextPatient! : p,
        );
      });
      if (nextPatient) await persistOne(nextPatient);
    },
    [persistOne],
  );

  const getById = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients],
  );

  const addConsulta = useCallback(
    async (patientId: string, data: Omit<Consulta, "id">) => {
      const consulta: Consulta = { ...data, id: `${Date.now()}` };
      let nextPatient: Paciente | undefined;
      setPatients((prev) => {
        const cur = prev.find((p) => p.id === patientId);
        if (!cur) return prev;
        nextPatient = {
          ...cur,
          consultas: [...(cur.consultas ?? []), consulta],
        };
        return prev.map((p) =>
          p.id === patientId ? nextPatient! : p,
        );
      });
      if (nextPatient) await persistOne(nextPatient);
    },
    [persistOne],
  );

  const addEstudio = useCallback(
    async (patientId: string, data: Omit<Estudio, "id" | "fecha">) => {
      try {
        const saved = await appendEstudio(patientId, data);
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? saved : p)),
        );
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo guardar el estudio.",
        );
        try {
          await reloadFromServer();
        } catch {
          /* ignore */
        }
      }
    },
    [reloadFromServer],
  );

  const removeEstudio = useCallback(
    async (patientId: string, estudioId: string) => {
      try {
        const saved = await removeEstudioRemote(patientId, estudioId);
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? saved : p)),
        );
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo quitar el estudio.",
        );
        try {
          await reloadFromServer();
        } catch {
          /* ignore */
        }
      }
    },
    [reloadFromServer],
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
