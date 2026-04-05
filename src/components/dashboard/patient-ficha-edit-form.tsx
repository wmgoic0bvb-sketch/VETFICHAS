"use client";

import { useEffect, useId, useState } from "react";
import { usePatients } from "@/components/providers/patients-provider";
import type { PacienteEditable } from "@/components/providers/patients-provider";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import {
  ESTADO_PACIENTE_LABELS,
  type DueñoContacto,
  type EstadoPaciente,
  type Paciente,
} from "@/types/patient";

type FieldKeys = "especie" | "nombre" | "dueño1";
type FieldErrors = Partial<Record<FieldKeys, string>>;

export function draftFromPatient(p: Paciente): PacienteEditable {
  return {
    especie: p.especie,
    nombre: p.nombre,
    raza: p.raza,
    sexo: p.sexo,
    fnac: p.fnac,
    castrado: p.castrado,
    color: p.color,
    dueños: [{ ...p.dueños[0] }, { ...p.dueños[1] }] as [
      DueñoContacto,
      DueñoContacto,
    ],
    dir: p.dir,
    estado: p.estado ?? "activo",
    esExterno: p.esExterno,
    esUnicaConsulta: p.esUnicaConsulta,
    proximosControles: [...p.proximosControles],
  };
}

export function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function PatientFichaEditForm({
  patient,
  onCancel,
  onSaved,
  onDraftChange,
}: {
  patient: Paciente;
  onCancel: () => void;
  onSaved?: () => void;
  onDraftChange?: (draft: PacienteEditable) => void;
}) {
  const { updatePatient } = usePatients();
  const fid = useId();
  const [draft, setDraft] = useState<PacienteEditable>(() =>
    draftFromPatient(patient),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const next = draftFromPatient(patient);
    setDraft(next);
    setFieldErrors({});
  }, [patient.id]);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  const clearFieldError = (key: FieldKeys) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const saveEdit = async () => {
    const n = draft.nombre.trim();
    const d1 = draft.dueños[0].nombre.trim();
    const nextErrors: FieldErrors = {};
    if (!draft.especie) nextErrors.especie = "Elegí si es perro o gato.";
    if (!n) nextErrors.nombre = "Ingresá el nombre de la mascota.";
    if (!d1)
      nextErrors.dueño1 =
        "Ingresá al menos el nombre del primer dueño o responsable.";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    await updatePatient(patient.id, {
      ...draft,
      nombre: n,
      raza: draft.raza.trim(),
      color: draft.color.trim(),
      dueños: [
        { nombre: d1, tel: draft.dueños[0].tel.trim() },
        {
          nombre: draft.dueños[1].nombre.trim(),
          tel: draft.dueños[1].tel.trim(),
        },
      ],
      dir: draft.dir.trim(),
      estado: draft.estado,
      esExterno: draft.esExterno,
      esUnicaConsulta: draft.esUnicaConsulta,
      proximosControles: draft.proximosControles ?? [],
    });
    setFieldErrors({});
    onSaved?.();
  };

  const inputBase =
    "w-full rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm outline-none transition-colors";

  return (
    <section className="mb-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
          Editar datos del paciente
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-[#888] hover:text-[#333]"
        >
          Cancelar
        </button>
      </div>

      <div>
        <span className="mb-1.5 block text-[13px] font-semibold text-[#555]">
          Especie *
        </span>
        <div className="flex gap-3">
          {(["Perro", "Gato"] as const).map((esp) => (
            <button
              key={esp}
              type="button"
              onClick={() => {
                setDraft((prev) => ({ ...prev, especie: esp }));
                clearFieldError("especie");
              }}
              className={`flex-1 rounded-2xl border-2 px-2 py-3 text-center text-sm font-semibold transition-all ${
                draft.especie === esp
                  ? "border-[#2d6a4f] bg-[#f0faf5] text-[#333]"
                  : "border-[#e8e0d8] text-[#555] hover:border-[#52b788]"
              }`}
            >
              <span className="mb-1 block text-2xl">
                {esp === "Perro" ? "🐶" : "🐱"}
              </span>
              {esp}
            </button>
          ))}
        </div>
        {fieldErrors.especie ? (
          <FieldError message={fieldErrors.especie} />
        ) : null}
      </div>

      <div>
        <label
          htmlFor={`${fid}-nombre`}
          className="mb-1.5 block text-[13px] font-semibold text-[#555]"
        >
          Nombre de la mascota *
        </label>
        <input
          id={`${fid}-nombre`}
          value={draft.nombre}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, nombre: e.target.value }));
            clearFieldError("nombre");
          }}
          aria-invalid={Boolean(fieldErrors.nombre)}
          aria-describedby={
            fieldErrors.nombre ? `${fid}-nombre-err` : undefined
          }
          className={`${inputBase} ${inputErrorRing(Boolean(fieldErrors.nombre))}`}
        />
        {fieldErrors.nombre ? (
          <FieldError id={`${fid}-nombre-err`} message={fieldErrors.nombre} />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${fid}-raza`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Raza
          </label>
          <input
            id={`${fid}-raza`}
            value={draft.raza}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, raza: e.target.value }))
            }
            className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
          />
        </div>
        <div>
          <label
            htmlFor={`${fid}-sexo`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Sexo
          </label>
          <select
            id={`${fid}-sexo`}
            value={draft.sexo}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, sexo: e.target.value }))
            }
            className={`${inputBase} cursor-pointer border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
          >
            <option value="">Elegir...</option>
            <option>Macho</option>
            <option>Hembra</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${fid}-fnac`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Fecha de nacimiento
          </label>
          <input
            id={`${fid}-fnac`}
            type="date"
            value={draft.fnac}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, fnac: e.target.value }))
            }
            className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
          />
        </div>
        <div>
          <label
            htmlFor={`${fid}-castrado`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            ¿Castrado/a?
          </label>
          <select
            id={`${fid}-castrado`}
            value={draft.castrado}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, castrado: e.target.value }))
            }
            className={`${inputBase} cursor-pointer border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
          >
            <option value="">Elegir...</option>
            <option>Sí</option>
            <option>No</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor={`${fid}-color`}
          className="mb-1.5 block text-[13px] font-semibold text-[#555]"
        >
          Color / señas
        </label>
        <input
          id={`${fid}-color`}
          value={draft.color}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, color: e.target.value }))
          }
          className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
        />
      </div>

      <h4 className="pt-1 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
        Dueños / Contacto
      </h4>

      <div className="rounded-xl border border-[#e8e0d8] bg-[#faf9f7] p-3">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#2d6a4f]">
          Responsable 1 *
        </p>
        <div className="mb-3">
          <label
            htmlFor={`${fid}-dueno-1`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Nombre *
          </label>
          <input
            id={`${fid}-dueno-1`}
            value={draft.dueños[0].nombre}
            onChange={(e) => {
              setDraft((prev) => ({
                ...prev,
                dueños: [
                  { ...prev.dueños[0], nombre: e.target.value },
                  prev.dueños[1],
                ],
              }));
              clearFieldError("dueño1");
            }}
            aria-invalid={Boolean(fieldErrors.dueño1)}
            aria-describedby={
              fieldErrors.dueño1 ? `${fid}-dueno-1-err` : undefined
            }
            className={`${inputBase} ${inputErrorRing(Boolean(fieldErrors.dueño1))}`}
          />
          {fieldErrors.dueño1 ? (
            <FieldError
              id={`${fid}-dueno-1-err`}
              message={fieldErrors.dueño1}
            />
          ) : null}
        </div>
        <div>
          <label
            htmlFor={`${fid}-tel-1`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Teléfono
          </label>
          <input
            id={`${fid}-tel-1`}
            type="tel"
            value={draft.dueños[0].tel}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                dueños: [
                  { ...prev.dueños[0], tel: e.target.value },
                  prev.dueños[1],
                ],
              }))
            }
            className={`${inputBase} border-[#e8e0d8] bg-white focus:border-[#2d6a4f] focus:bg-white`}
          />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-[#d4ccc0] bg-white p-3">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#888]">
          Responsable 2 (opcional)
        </p>
        <div className="mb-3">
          <label
            htmlFor={`${fid}-dueno-2`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Nombre
          </label>
          <input
            id={`${fid}-dueno-2`}
            value={draft.dueños[1].nombre}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                dueños: [
                  prev.dueños[0],
                  { ...prev.dueños[1], nombre: e.target.value },
                ],
              }))
            }
            className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
          />
        </div>
        <div>
          <label
            htmlFor={`${fid}-tel-2`}
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Teléfono
          </label>
          <input
            id={`${fid}-tel-2`}
            type="tel"
            value={draft.dueños[1].tel}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                dueños: [
                  prev.dueños[0],
                  { ...prev.dueños[1], tel: e.target.value },
                ],
              }))
            }
            className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${fid}-dir`}
          className="mb-1.5 block text-[13px] font-semibold text-[#555]"
        >
          Dirección
        </label>
        <input
          id={`${fid}-dir`}
          value={draft.dir}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, dir: e.target.value }))
          }
          className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
        />
      </div>

      <div>
        <label
          htmlFor={`${fid}-estado`}
          className="mb-1.5 block text-[13px] font-semibold text-[#555]"
        >
          Estado en la clínica
        </label>
        <select
          id={`${fid}-estado`}
          value={draft.estado}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              estado: e.target.value as EstadoPaciente,
            }))
          }
          className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
        >
          {(Object.keys(ESTADO_PACIENTE_LABELS) as EstadoPaciente[]).map(
            (key) => (
              <option key={key} value={key}>
                {ESTADO_PACIENTE_LABELS[key]}
              </option>
            ),
          )}
        </select>
        <p className="mt-1.5 text-[12px] leading-snug text-[#888]">
          Archivado no aparece en el listado principal; el historial se conserva.
        </p>
      </div>

      <div className="rounded-xl border border-[#e0d9cf] bg-[#faf8f5] p-3.5">
        <p className="mb-3 text-[13px] font-semibold text-[#555]">
          Clasificación
        </p>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={draft.esExterno}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, esExterno: e.target.checked }))
            }
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c4bbb0] text-[#2d6a4f] focus:ring-[#2d6a4f]"
          />
          <span className="text-sm leading-snug text-[#333]">
            Paciente de otra veterinaria
          </span>
        </label>
        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={draft.esUnicaConsulta}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                esUnicaConsulta: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c4bbb0] text-[#2d6a4f] focus:ring-[#2d6a4f]"
          />
          <span className="text-sm leading-snug text-[#333]">
            Única consulta (sin seguimiento habitual acá)
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={saveEdit}
        className="w-full rounded-xl bg-[#2d6a4f] py-3 text-[15px] font-semibold text-white hover:bg-[#1b4332]"
      >
        Guardar cambios
      </button>
    </section>
  );
}
