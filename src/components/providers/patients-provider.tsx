"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  combinarMaskedAFechaHoraGuardada,
  esFechaMaskedAnteriorAHoy,
  isFechaHoraProximoControlValida,
} from "@/lib/proximo-control-utils";
import {
  appendEstudio,
  createPatient,
  deletePatient as deletePatientApi,
  fetchLastUpdated,
  fetchPatients,
  removeEstudioRemote,
  replacePatient,
} from "@/lib/patients-api";
import { DEFAULT_SUCURSAL_ID } from "@/lib/sucursales";
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
  isRefreshing: boolean;
  refresh: () => void;
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
  updateConsulta: (
    patientId: string,
    consultaId: string,
    data: Omit<Consulta, "id">,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const lastServerTs = useRef<number>(0);

  const reloadFromServer = useCallback(async () => {
    const list = await fetchPatients();
    setPatients(list);
  }, []);

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const [list, ts] = await Promise.all([fetchPatients(), fetchLastUpdated()]);
      setPatients(list);
      lastServerTs.current = ts;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudieron cargar los pacientes.",
      );
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
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
        const [list, ts] = await Promise.all([fetchPatients(), fetchLastUpdated()]);
        if (!cancelled) {
          setPatients(list);
          lastServerTs.current = ts;
        }
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

  // Poll for remote changes every 45s and auto-reload when detected
  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(async () => {
      try {
        const ts = await fetchLastUpdated();
        if (ts > lastServerTs.current && !isRefreshingRef.current) {
          isRefreshingRef.current = true;
          setIsRefreshing(true);
          try {
            const list = await fetchPatients();
            setPatients(list);
            lastServerTs.current = ts;
          } finally {
            isRefreshingRef.current = false;
            setIsRefreshing(false);
          }
        }
      } catch {
        // silent — no toast for background polling errors
      }
    }, 10_000);
    return () => clearInterval(id);
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
          historialInternaciones:
            data.historialInternaciones !== undefined
              ? data.historialInternaciones
              : cur.historialInternaciones,
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
        const refMasked = consulta.meds.trim();
        const shouldAutoControl =
          consulta.tipo === "Vacuna" &&
          /^\d{2}\/\d{2}\/\d{4}$/.test(refMasked) &&
          !esFechaMaskedAnteriorAHoy(refMasked);
        const autoFechaHora = shouldAutoControl
          ? combinarMaskedAFechaHoraGuardada(refMasked, "09:00")
          : null;
        const autoNota = shouldAutoControl ? "Refuerzo de vacuna" : "";
        const exists =
          shouldAutoControl &&
          autoFechaHora &&
          cur.proximosControles.some(
            (c) => c.fechaHora === autoFechaHora && (c.nota ?? "") === autoNota,
          );
        const autoControl: ProximoControl | null =
          shouldAutoControl &&
          autoFechaHora &&
          !exists &&
          isFechaHoraProximoControlValida(autoFechaHora)
            ? {
                id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                fechaHora: autoFechaHora,
                sucursalId: DEFAULT_SUCURSAL_ID,
                nota: autoNota,
                asistencia: null,
              }
            : null;
        nextPatient = {
          ...cur,
          consultas: [...(cur.consultas ?? []), consulta],
          proximosControles: autoControl
            ? [...cur.proximosControles, autoControl]
            : cur.proximosControles,
        };
        return prev.map((p) =>
          p.id === patientId ? nextPatient! : p,
        );
      });
      if (nextPatient) await persistOne(nextPatient);
    },
    [persistOne],
  );

  const updateConsulta = useCallback(
    async (
      patientId: string,
      consultaId: string,
      data: Omit<Consulta, "id">,
    ) => {
      let nextPatient: Paciente | undefined;
      setPatients((prev) => {
        const cur = prev.find((p) => p.id === patientId);
        if (!cur) return prev;
        const list = cur.consultas ?? [];
        const idx = list.findIndex((c) => c.id === consultaId);
        if (idx === -1) return prev;
        const nextList = [...list];
        nextList[idx] = { ...data, id: consultaId };
        const refMasked = data.meds.trim();
        const shouldAutoControl =
          data.tipo === "Vacuna" &&
          /^\d{2}\/\d{2}\/\d{4}$/.test(refMasked) &&
          !esFechaMaskedAnteriorAHoy(refMasked);
        const autoFechaHora = shouldAutoControl
          ? combinarMaskedAFechaHoraGuardada(refMasked, "09:00")
          : null;
        const autoNota = shouldAutoControl ? "Refuerzo de vacuna" : "";
        const exists =
          shouldAutoControl &&
          autoFechaHora &&
          cur.proximosControles.some(
            (c) => c.fechaHora === autoFechaHora && (c.nota ?? "") === autoNota,
          );
        const autoControl: ProximoControl | null =
          shouldAutoControl &&
          autoFechaHora &&
          !exists &&
          isFechaHoraProximoControlValida(autoFechaHora)
            ? {
                id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                fechaHora: autoFechaHora,
                sucursalId: DEFAULT_SUCURSAL_ID,
                nota: autoNota,
                asistencia: null,
              }
            : null;
        nextPatient = {
          ...cur,
          consultas: nextList,
          proximosControles: autoControl
            ? [...cur.proximosControles, autoControl]
            : cur.proximosControles,
        };
        return prev.map((p) => (p.id === patientId ? nextPatient! : p));
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
      isRefreshing,
      refresh,
      addPatient,
      updatePatient,
      addProximoControl,
      updateProximoControl,
      removeProximoControl,
      removePatient,
      getById,
      addConsulta,
      updateConsulta,
      addEstudio,
      removeEstudio,
    }),
    [
      patients,
      ready,
      isRefreshing,
      refresh,
      addPatient,
      updatePatient,
      addProximoControl,
      updateProximoControl,
      removeProximoControl,
      removePatient,
      getById,
      addConsulta,
      updateConsulta,
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
