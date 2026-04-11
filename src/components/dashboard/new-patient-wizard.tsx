"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import { parDueñosVacío, formatDueñosCorto } from "@/lib/dueños-utils";
import { toPascalCase } from "@/lib/name-case";
import {
  DuplicadoPacienteError,
  type PacienteSimilarResumen,
} from "@/lib/patients-api";
import { normalizePhoneInput } from "@/lib/phone-utils";
import type {
  DueñoContacto,
  Especie,
  PacienteDraft,
  SucursalPaciente,
} from "@/types/patient";

const SUCURSALES: SucursalPaciente[] = ["AVENIDA", "VILLEGAS", "MITRE"];

const steps = [1, 2, 3] as const;

type FieldKeys = "especie" | "nombre" | "dueño1";
type FieldErrors = Partial<Record<FieldKeys, string>>;

export function NewPatientWizard({
  open,
  onClose,
  onSave,
  defaultSucursal,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    draft: PacienteDraft,
    opts?: { force?: boolean },
  ) => void | Promise<void>;
  defaultSucursal?: SucursalPaciente | null;
}) {
  const [paso, setPaso] = useState(1);
  const [especie, setEspecie] = useState<Especie | "">("");
  const [sucursal, setSucursal] = useState<SucursalPaciente | null>(defaultSucursal ?? null);
  const [nombre, setNombre] = useState("");
  const [raza, setRaza] = useState("");
  const [sexo, setSexo] = useState("");
  const [fnac, setFnac] = useState("");
  const [castrado, setCastrado] = useState("");
  const [color, setColor] = useState("");
  const [dueños, setDueños] = useState(parDueñosVacío);
  const [dir, setDir] = useState("");
  const [esExterno, setEsExterno] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [duplicados, setDuplicados] = useState<PacienteSimilarResumen[] | null>(
    null,
  );

  const clearFieldError = (key: FieldKeys) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const reset = useCallback(() => {
    setPaso(1);
    setEspecie("");
    setSucursal(defaultSucursal ?? null);
    setNombre("");
    setRaza("");
    setSexo("");
    setFnac("");
    setCastrado("");
    setColor("");
    setDueños(parDueñosVacío());
    setDir("");
    setEsExterno(false);
    setFieldErrors({});
    setDuplicados(null);
  }, []);

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const go = (n: number) => setPaso(n);

  const construirDraft = (): PacienteDraft => {
    const d1 = toPascalCase(dueños[0].nombre);
    return {
      especie: especie as Especie,
      sucursal: sucursal ?? null,
      nombre: toPascalCase(nombre),
      raza: raza.trim(),
      sexo,
      fnac,
      castrado,
      color: color.trim(),
      dueños: [
        { nombre: d1, tel: normalizePhoneInput(dueños[0].tel) },
        {
          nombre: toPascalCase(dueños[1].nombre),
          tel: normalizePhoneInput(dueños[1].tel),
        },
      ],
      dir: dir.trim(),
      estado: "activo",
      esExterno,
      esUnicaConsulta: false,
      internado: false,
      consultas: [],
    };
  };

  const ejecutarGuardado = async (opts?: { force?: boolean }) => {
    setSaving(true);
    try {
      await onSave(construirDraft(), opts);
      reset();
      onClose();
    } catch (e) {
      if (e instanceof DuplicadoPacienteError) {
        setDuplicados(e.similares);
      }
      /* otros errores: el provider ya mostró toast */
    } finally {
      setSaving(false);
    }
  };

  const guardar = async () => {
    const n = nombre.trim();
    const d1 = dueños[0].nombre.trim();
    const nextErrors: FieldErrors = {};
    if (!especie) nextErrors.especie = "Elegí si es perro o gato.";
    if (!n) nextErrors.nombre = "Ingresá el nombre de la mascota.";
    if (!d1)
      nextErrors.dueño1 = "Ingresá al menos el nombre del primer dueño o responsable.";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      if (!especie) setPaso(1);
      else if (!n) setPaso(2);
      else setPaso(3);
      return;
    }
    setFieldErrors({});
    await ejecutarGuardado();
  };

  const confirmarCrearIgual = async () => {
    setDuplicados(null);
    await ejecutarGuardado({ force: true });
  };

  const stepClass = (i: number) => {
    if (i < paso) return "bg-[#5c1838]";
    if (i === paso) return "bg-[#9d6278]";
    return "bg-[#e8e0d8]";
  };

  return (
    <Modal open={open} onClose={handleClose} labelledBy="wizard-title">
      <div className="relative">
        <DbLoadingOverlay
          show={saving}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/85 backdrop-blur-sm"
        />
      <button
        type="button"
        onClick={handleClose}
        disabled={saving}
        className="absolute right-[18px] top-4 z-[1] text-[22px] leading-none text-[#aaa] hover:text-[#333] disabled:opacity-50"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div className="mb-6 flex gap-2">
        {steps.map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${stepClass(i)} transition-colors`}
          />
        ))}
      </div>

      {paso === 1 && (
        <div>
          <h2 id="wizard-title" className="text-xl font-bold text-[#1a1a1a]">
            ¿Quién viene hoy? 🐾
          </h2>
          <p className="mb-5 text-sm text-[#888]">Paso 1 de 3 — Tipo de mascota</p>
          <div className="mb-5 flex gap-3">
            {(["Perro", "Gato"] as const).map((esp) => (
              <button
                key={esp}
                type="button"
                onClick={() => {
                  setEspecie(esp);
                  clearFieldError("especie");
                }}
                className={`flex-1 rounded-2xl border-2 px-2.5 py-4 text-center transition-all hover:border-[#c4a3a8] ${
                  especie === esp
                    ? "border-[#5c1838] bg-[#f5eef0]"
                    : "border-[#e8e0d8]"
                }`}
              >
                <span className="mb-1.5 block text-4xl">
                  {esp === "Perro" ? "🐶" : "🐱"}
                </span>
                <span className="text-sm font-semibold text-[#333]">{esp}</span>
              </button>
            ))}
          </div>
          {fieldErrors.especie ? (
            <FieldError message={fieldErrors.especie} />
          ) : null}

          <div className="mt-5">
            <p className="mb-2 text-[13px] font-semibold text-[#555]">Sucursal</p>
            <div className="flex gap-2">
              {SUCURSALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSucursal(sucursal === s ? null : s)}
                  className={`flex-1 rounded-xl border-[1.5px] py-2.5 text-[13px] font-semibold transition-colors ${
                    sucursal === s
                      ? "border-[#5c1838] bg-[#5c1838] text-white"
                      : "border-[#e8e0d8] bg-[#faf9f7] text-[#555] hover:border-[#c4a3a8]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-2.5">
            <button
              type="button"
              disabled={!especie}
              onClick={() => go(2)}
              className="flex-[2] rounded-xl bg-[#5c1838] py-3 text-[15px] font-semibold text-white hover:bg-[#401127] disabled:cursor-not-allowed disabled:bg-[#d4c4c8]"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            Datos de la mascota 🐾
          </h2>
          <p className="mb-5 text-sm text-[#888]">
            Paso 2 de 3 — Información del animal
          </p>
          <div className="mb-4">
            <label
              htmlFor="wizard-nombre"
              className="mb-1.5 block text-[13px] font-semibold text-[#555]"
            >
              Nombre de la mascota *
            </label>
            <input
              id="wizard-nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                clearFieldError("nombre");
              }}
              aria-invalid={Boolean(fieldErrors.nombre)}
              aria-describedby={
                fieldErrors.nombre ? "wizard-nombre-err" : undefined
              }
              className={`w-full rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm outline-none transition-colors ${inputErrorRing(
                Boolean(fieldErrors.nombre),
              )}`}
              placeholder="Ej: Toto, Luna..."
            />
            {fieldErrors.nombre ? (
              <FieldError id="wizard-nombre-err" message={fieldErrors.nombre} />
            ) : null}
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
                Raza
              </label>
              <input
                value={raza}
                onChange={(e) => setRaza(e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                placeholder="Ej: Golden, Siamés..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
                Sexo
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
              >
                <option value="">Elegir...</option>
                <option>Macho</option>
                <option>Hembra</option>
              </select>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={fnac}
                onChange={(e) => setFnac(e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
                ¿Castrado/a?
              </label>
              <select
                value={castrado}
                onChange={(e) => setCastrado(e.target.value)}
                className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
              >
                <option value="">Elegir...</option>
                <option>Sí</option>
                <option>No</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
              Color / señas particulares
            </label>
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
              placeholder="Ej: Negro con pecho blanco"
            />
          </div>
          <div className="mt-6 flex gap-2.5">
            <button
              type="button"
              onClick={() => go(1)}
              className="flex-1 rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-3 text-[15px] font-medium text-[#555] hover:bg-[#f5f0eb]"
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={() => go(3)}
              className="flex-[2] rounded-xl bg-[#5c1838] py-3 text-[15px] font-semibold text-white hover:bg-[#401127]"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {duplicados ? (
        <DuplicadosModal
          similares={duplicados}
          saving={saving}
          onCancelar={() => setDuplicados(null)}
          onCrearIgual={() => void confirmarCrearIgual()}
        />
      ) : null}

      {paso === 3 && (
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Dueños y contacto 👤</h2>
          <p className="mb-5 text-sm text-[#888]">Paso 3 de 3 — Hasta dos responsables</p>

          <div className="mb-4 rounded-xl border border-[#e8e0d8] bg-white p-3.5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-[#5c1838]">
              Responsable 1 *
            </p>
            <div className="mb-3">
              <label
                htmlFor="wizard-dueno-1"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Nombre *
              </label>
              <input
                id="wizard-dueno-1"
                value={dueños[0].nombre}
                onChange={(e) => {
                  setDueños((prev) => [
                    { ...prev[0], nombre: e.target.value },
                    prev[1],
                  ]);
                  clearFieldError("dueño1");
                }}
                aria-invalid={Boolean(fieldErrors.dueño1)}
                aria-describedby={
                  fieldErrors.dueño1 ? "wizard-dueno-1-err" : undefined
                }
                className={`w-full rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm outline-none transition-colors ${inputErrorRing(
                  Boolean(fieldErrors.dueño1),
                )}`}
                placeholder="Ej: Martín López"
              />
              {fieldErrors.dueño1 ? (
                <FieldError id="wizard-dueno-1-err" message={fieldErrors.dueño1} />
              ) : null}
            </div>
            <div>
              <label
                htmlFor="wizard-tel-1"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Teléfono
              </label>
              <input
                id="wizard-tel-1"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={dueños[0].tel}
                onChange={(e) =>
                  setDueños((prev) => [
                    { ...prev[0], tel: normalizePhoneInput(e.target.value) },
                    prev[1],
                  ])
                }
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                placeholder="Ej: 2984868120"
              />
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-dashed border-[#d4ccc0] bg-[#faf9f7] p-3.5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-[#888]">
              Responsable 2 (opcional)
            </p>
            <div className="mb-3">
              <label
                htmlFor="wizard-dueno-2"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Nombre
              </label>
              <input
                id="wizard-dueno-2"
                value={dueños[1].nombre}
                onChange={(e) =>
                  setDueños((prev) => [
                    prev[0],
                    { ...prev[1], nombre: e.target.value },
                  ])
                }
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                placeholder="Ej: Laura Gómez"
              />
            </div>
            <div>
              <label
                htmlFor="wizard-tel-2"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Teléfono
              </label>
              <input
                id="wizard-tel-2"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={dueños[1].tel}
                onChange={(e) =>
                  setDueños((prev) => [
                    prev[0],
                    {
                      ...prev[1],
                      tel: normalizePhoneInput(e.target.value),
                    },
                  ])
                }
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                placeholder="Ej: 2984868120"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
              Dirección (opcional)
            </label>
            <input
              value={dir}
              onChange={(e) => setDir(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
              placeholder="Ej: Belgrano 450"
            />
          </div>

          <div className="mb-4 rounded-xl border border-[#e0d9cf] bg-[#faf8f5] p-3.5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={esExterno}
                onChange={(e) => setEsExterno(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c4bbb0] text-[#5c1838] focus:ring-[#5c1838]"
              />
              <span className="text-sm leading-snug text-[#333]">
                Paciente de otra veterinaria
              </span>
            </label>
          </div>

          <div className="mt-6 flex gap-2.5">
            <button
              type="button"
              onClick={() => go(2)}
              className="flex-1 rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-3 text-[15px] font-medium text-[#555] hover:bg-[#f5f0eb]"
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={saving}
              className="flex-[2] rounded-xl bg-[#5c1838] py-3 text-[15px] font-semibold text-white hover:bg-[#401127] disabled:opacity-60"
            >
              ✓ Guardar ficha
            </button>
          </div>
        </div>
      )}
      </div>
    </Modal>
  );
}

function DuplicadosModal({
  similares,
  saving,
  onCancelar,
  onCrearIgual,
}: {
  similares: PacienteSimilarResumen[];
  saving: boolean;
  onCancelar: () => void;
  onCrearIgual: () => void;
}) {
  return (
    <Modal
      open
      onClose={onCancelar}
      labelledBy="duplicados-title"
      overlayClassName="z-[210]"
    >
      <h2
        id="duplicados-title"
        className="text-lg font-bold text-[#1a1a1a]"
      >
        ¿Ya existe este paciente?
      </h2>
      <p className="mt-1 mb-4 text-sm text-[#666]">
        Encontramos {similares.length === 1 ? "un paciente" : "pacientes"} con
        nombre de mascota y dueño muy parecidos:
      </p>
      <ul className="mb-5 flex flex-col gap-2">
        {similares.map((s) => {
          const pair: [DueñoContacto, DueñoContacto] = [
            s.dueños[0] ?? { nombre: "", tel: "" },
            s.dueños[1] ?? { nombre: "", tel: "" },
          ];
          return (
            <li
              key={s.id}
              className="rounded-xl border border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5"
            >
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {s.nombre}
                {s.estado === "archivado" ? (
                  <span className="ml-2 rounded-full bg-[#e8e0d8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#555]">
                    Archivado
                  </span>
                ) : null}
              </p>
              <p className="text-[13px] text-[#666]">
                {formatDueñosCorto(pair)}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mb-3 text-[12px] text-[#888]">
        Si es el mismo paciente, abrí la ficha existente. Si estás seguro de
        que es uno nuevo, podés crearlo igual.
      </p>
      <div className="mb-4 flex flex-col gap-1.5">
        {similares.map((s) => (
          <Link
            key={s.id}
            href={`/patient/${s.id}`}
            className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-[#5c1838] bg-white px-3 py-2 text-[14px] font-semibold text-[#5c1838] hover:bg-[#f5eef0]"
          >
            → Ir a la ficha de {s.nombre}
          </Link>
        ))}
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onCancelar}
          disabled={saving}
          className="flex-1 rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-3 text-[14px] font-medium text-[#555] hover:bg-[#f5f0eb] disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onCrearIgual}
          disabled={saving}
          className="flex-1 rounded-xl bg-[#5c1838] py-3 text-[14px] font-semibold text-white hover:bg-[#401127] disabled:opacity-60"
        >
          Crear igual
        </button>
      </div>
    </Modal>
  );
}
