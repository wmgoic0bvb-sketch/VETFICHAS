"use client";

import { useEffect, useState } from "react";
import { usePatients } from "@/components/providers/patients-provider";
import type { PacienteEditable } from "@/components/providers/patients-provider";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import { Modal } from "@/components/ui/modal";
import { calcularEdad, formatFecha } from "@/lib/date-utils";
import type { Consulta, Paciente } from "@/types/patient";

const tipoClass: Record<string, string> = {
  Control: "bg-emerald-100 text-emerald-900",
  Urgencia: "bg-red-100 text-red-900",
  Cirugía: "bg-amber-100 text-amber-900",
  Vacuna: "bg-sky-100 text-sky-900",
};

type FieldKeys = "especie" | "nombre" | "dueno";
type FieldErrors = Partial<Record<FieldKeys, string>>;

function emoji(especie: Paciente["especie"]) {
  return especie === "Perro" ? "🐶" : "🐱";
}

function draftFromPatient(p: Paciente): PacienteEditable {
  return {
    especie: p.especie,
    nombre: p.nombre,
    raza: p.raza,
    sexo: p.sexo,
    fnac: p.fnac,
    castrado: p.castrado,
    color: p.color,
    dueno: p.dueno,
    tel: p.tel,
    dir: p.dir,
  };
}

function PencilIcon({ className }: { className?: string }) {
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

export function PatientDetailModal({
  patient,
  open,
  onClose,
  onDelete,
  onAddConsulta,
}: {
  patient: Paciente | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAddConsulta: () => void;
}) {
  const { updatePatient } = usePatients();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PacienteEditable | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setDraft(null);
      setFieldErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (patient && !editing) {
      setDraft(null);
    }
  }, [patient?.id, editing]);

  if (!patient) return null;

  const consultas = [...(patient.consultas ?? [])].reverse();
  const clearFieldError = (key: FieldKeys) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const startEdit = () => {
    setDraft(draftFromPatient(patient));
    setFieldErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setFieldErrors({});
  };

  const saveEdit = () => {
    if (!draft) return;
    const n = draft.nombre.trim();
    const d = draft.dueno.trim();
    const nextErrors: FieldErrors = {};
    if (!draft.especie) nextErrors.especie = "Elegí si es perro o gato.";
    if (!n) nextErrors.nombre = "Ingresá el nombre de la mascota.";
    if (!d) nextErrors.dueno = "Ingresá el nombre del dueño o la dueña.";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    updatePatient(patient.id, {
      ...draft,
      nombre: n,
      dueno: d,
      raza: draft.raza.trim(),
      color: draft.color.trim(),
      tel: draft.tel.trim(),
      dir: draft.dir.trim(),
    });
    setFieldErrors({});
    setEditing(false);
    setDraft(null);
  };

  const previewNombre = editing && draft ? draft.nombre : patient.nombre;
  const previewSub = (() => {
    if (editing && draft) {
      const sub = draft.raza || draft.especie;
      return `${sub} · ${calcularEdad(draft.fnac)}`;
    }
    return `${patient.raza || patient.especie} · ${calcularEdad(patient.fnac)}`;
  })();
  const previewEspecie = editing && draft ? draft.especie : patient.especie;

  const renderConsulta = (c: Consulta) => (
    <div
      key={c.id}
      className="mb-2.5 rounded-[14px] bg-[#f5f0eb] px-4 py-3.5 last:mb-0"
    >
      <div className="mb-1 text-xs text-[#888]">{formatFecha(c.fecha)}</div>
      <span
        className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tipoClass[c.tipo] ?? tipoClass.Control}`}
      >
        {c.tipo}
      </span>
      <div className="text-[15px] font-semibold text-[#1a1a1a]">{c.motivo}</div>
      {(c.peso || c.temp) && (
        <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
          {c.peso ? `⚖️ Peso: ${c.peso} kg` : ""}
          {c.peso && c.temp ? " · " : ""}
          {c.temp ? `🌡️ Temp: ${c.temp}°C` : ""}
        </div>
      )}
      {c.diag ? (
        <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
          📋 {c.diag}
        </div>
      ) : null}
      {c.trat ? (
        <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
          💊 {c.trat}
        </div>
      ) : null}
      {c.meds ? (
        <div className="mt-1 text-[13px] leading-relaxed text-[#555]">
          🧴 {c.meds}
        </div>
      ) : null}
    </div>
  );

  const inputBase =
    "w-full rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm outline-none transition-colors";

  return (
    <Modal open={open} onClose={onClose} labelledBy="ficha-nombre">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-[18px] top-4 text-[22px] leading-none text-[#aaa] hover:text-[#333]"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div className="mb-5 text-center">
        <span className="mb-2 block text-[64px] leading-none" aria-hidden>
          {emoji(previewEspecie)}
        </span>
        <h2 id="ficha-nombre" className="text-2xl font-bold text-[#1a1a1a]">
          {previewNombre.trim() || "—"}
        </h2>
        <p className="mt-1 text-sm text-[#888]">{previewSub}</p>
      </div>

      {!editing ? (
        <>
          <section className="mb-5">
            <div className="mb-2.5 flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                Datos del paciente
              </h3>
              <button
                type="button"
                onClick={startEdit}
                className="-m-1 flex shrink-0 items-center justify-center rounded-lg p-1 text-[#2d6a4f] hover:bg-[#f0faf5]"
                aria-label="Editar datos del paciente y contacto"
                title="Editar ficha"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-[#f0ebe4] text-sm">
              <Row label="Especie" value={patient.especie} />
              {patient.raza ? <Row label="Raza" value={patient.raza} /> : null}
              {patient.sexo ? <Row label="Sexo" value={patient.sexo} /> : null}
              {patient.fnac ? (
                <Row label="Nacimiento" value={formatFecha(patient.fnac)} />
              ) : null}
              {patient.castrado ? (
                <Row label="Castrado/a" value={patient.castrado} />
              ) : null}
              {patient.color ? <Row label="Color" value={patient.color} /> : null}
            </div>
          </section>

          <section className="mb-5">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
              Dueño / Contacto
            </h3>
            <div className="divide-y divide-[#f0ebe4] text-sm">
              <Row label="Nombre" value={patient.dueno} />
              {patient.tel ? <Row label="Teléfono" value={patient.tel} /> : null}
              {patient.dir ? <Row label="Dirección" value={patient.dir} /> : null}
            </div>
          </section>
        </>
      ) : (
        draft && (
          <section className="mb-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                Editar datos del paciente
              </h3>
              <button
                type="button"
                onClick={cancelEdit}
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
                      setDraft((prev) =>
                        prev ? { ...prev, especie: esp } : prev,
                      );
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
                htmlFor="edit-nombre"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Nombre de la mascota *
              </label>
              <input
                id="edit-nombre"
                value={draft.nombre}
                onChange={(e) => {
                  setDraft((prev) =>
                    prev ? { ...prev, nombre: e.target.value } : prev,
                  );
                  clearFieldError("nombre");
                }}
                aria-invalid={Boolean(fieldErrors.nombre)}
                aria-describedby={
                  fieldErrors.nombre ? "edit-nombre-err" : undefined
                }
                className={`${inputBase} ${inputErrorRing(Boolean(fieldErrors.nombre))}`}
              />
              {fieldErrors.nombre ? (
                <FieldError id="edit-nombre-err" message={fieldErrors.nombre} />
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-raza"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Raza
                </label>
                <input
                  id="edit-raza"
                  value={draft.raza}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, raza: e.target.value } : prev,
                    )
                  }
                  className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-sexo"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Sexo
                </label>
                <select
                  id="edit-sexo"
                  value={draft.sexo}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, sexo: e.target.value } : prev,
                    )
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
                  htmlFor="edit-fnac"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Fecha de nacimiento
                </label>
                <input
                  id="edit-fnac"
                  type="date"
                  value={draft.fnac}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, fnac: e.target.value } : prev,
                    )
                  }
                  className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-castrado"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  ¿Castrado/a?
                </label>
                <select
                  id="edit-castrado"
                  value={draft.castrado}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, castrado: e.target.value } : prev,
                    )
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
                htmlFor="edit-color"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Color / señas
              </label>
              <input
                id="edit-color"
                value={draft.color}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev ? { ...prev, color: e.target.value } : prev,
                  )
                }
                className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
              />
            </div>

            <h4 className="pt-1 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
              Dueño / Contacto
            </h4>

            <div>
              <label
                htmlFor="edit-dueno"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Nombre del dueño/a *
              </label>
              <input
                id="edit-dueno"
                value={draft.dueno}
                onChange={(e) => {
                  setDraft((prev) =>
                    prev ? { ...prev, dueno: e.target.value } : prev,
                  );
                  clearFieldError("dueno");
                }}
                aria-invalid={Boolean(fieldErrors.dueno)}
                aria-describedby={
                  fieldErrors.dueno ? "edit-dueno-err" : undefined
                }
                className={`${inputBase} ${inputErrorRing(Boolean(fieldErrors.dueno))}`}
              />
              {fieldErrors.dueno ? (
                <FieldError id="edit-dueno-err" message={fieldErrors.dueno} />
              ) : null}
            </div>

            <div>
              <label
                htmlFor="edit-tel"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Teléfono
              </label>
              <input
                id="edit-tel"
                type="tel"
                value={draft.tel}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev ? { ...prev, tel: e.target.value } : prev,
                  )
                }
                className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
              />
            </div>

            <div>
              <label
                htmlFor="edit-dir"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Dirección
              </label>
              <input
                id="edit-dir"
                value={draft.dir}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev ? { ...prev, dir: e.target.value } : prev,
                  )
                }
                className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
              />
            </div>

            <button
              type="button"
              onClick={saveEdit}
              className="w-full rounded-xl bg-[#2d6a4f] py-3 text-[15px] font-semibold text-white hover:bg-[#1b4332]"
            >
              Guardar cambios
            </button>
          </section>
        )
      )}

      {!editing && (
        <section className="mb-5">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
            Historial de consultas ({patient.consultas?.length ?? 0})
          </h3>
          {consultas.length === 0 ? (
            <div className="py-5 text-center text-sm text-[#aaa]">
              Sin consultas registradas aún
            </div>
          ) : (
            consultas.map(renderConsulta)
          )}
          <button
            type="button"
            onClick={onAddConsulta}
            className="mt-1 w-full rounded-xl border-2 border-dashed border-[#b7d5c9] bg-transparent py-3 text-sm font-semibold text-[#2d6a4f] hover:bg-[#f0faf5]"
          >
            + Agregar consulta
          </button>
        </section>
      )}

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "¿Eliminar esta ficha? Esta acción no se puede deshacer.",
              )
            ) {
              onDelete(patient.id);
              onClose();
            }
          }}
          className="flex-1 rounded-xl border-[1.5px] border-red-300 bg-transparent py-2.5 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          🗑 Eliminar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-[2] rounded-xl bg-[#2d6a4f] py-2.5 text-sm font-semibold text-white hover:bg-[#1b4332]"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-[#888]">{label}</span>
      <span className="text-right font-medium text-[#1a1a1a]">{value}</span>
    </div>
  );
}
