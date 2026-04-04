"use client";

import { useEffect, useState } from "react";
import { usePatients } from "@/components/providers/patients-provider";
import type { PacienteEditable } from "@/components/providers/patients-provider";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import { Modal } from "@/components/ui/modal";
import { calcularEdad, formatFecha } from "@/lib/date-utils";
import type { DueñoContacto, Paciente } from "@/types/patient";

type FieldKeys = "especie" | "nombre" | "dueño1";
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
    dueños: [
      { ...p.dueños[0] },
      { ...p.dueños[1] },
    ] as [DueñoContacto, DueñoContacto],
    dir: p.dir,
    esExterno: p.esExterno,
    esUnicaConsulta: p.esUnicaConsulta,
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
  onOpenDetails,
}: {
  patient: Paciente | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAddConsulta: () => void;
  onOpenDetails: (id: string) => void;
}) {
  const { updatePatient } = usePatients();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PacienteEditable | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setDraft(null);
      setFieldErrors({});
      setDeleteConfirmOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (patient && !editing) {
      setDraft(null);
    }
  }, [patient?.id, editing]);

  if (!patient) return null;

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
    updatePatient(patient.id, {
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
      esExterno: draft.esExterno,
      esUnicaConsulta: draft.esUnicaConsulta,
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

  const inputBase =
    "w-full rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm outline-none transition-colors";

  return (
    <>
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

          {(patient.esExterno || patient.esUnicaConsulta) && (
            <section className="mb-5">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#8b7355]">
                Clasificación
              </h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {patient.esExterno ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    Otra veterinaria
                  </span>
                ) : null}
                {patient.esUnicaConsulta ? (
                  <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-800">
                    Única consulta
                  </span>
                ) : null}
              </div>
            </section>
          )}

          <section className="mb-5">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
              Dueños / Contacto
            </h3>
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-[#e8e0d8] bg-[#faf9f7] p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#2d6a4f]">
                  Responsable 1
                </p>
                <Row label="Nombre" value={patient.dueños[0].nombre || "—"} />
                {patient.dueños[0].tel ? (
                  <Row label="Teléfono" value={patient.dueños[0].tel} />
                ) : null}
              </div>
              {(patient.dueños[1].nombre || patient.dueños[1].tel) && (
                <div className="rounded-xl border border-dashed border-[#d4ccc0] bg-white p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#888]">
                    Responsable 2
                  </p>
                  <Row
                    label="Nombre"
                    value={patient.dueños[1].nombre || "—"}
                  />
                  {patient.dueños[1].tel ? (
                    <Row label="Teléfono" value={patient.dueños[1].tel} />
                  ) : null}
                </div>
              )}
              {patient.dir ? (
                <div className="py-1">
                  <Row label="Dirección" value={patient.dir} />
                </div>
              ) : null}
            </div>
          </section>

          <section className="mb-5 space-y-2">
            <button
              type="button"
              onClick={onAddConsulta}
              className="w-full rounded-xl border-2 border-dashed border-[#b7d5c9] bg-transparent py-3 text-sm font-semibold text-[#2d6a4f] hover:bg-[#f0faf5]"
            >
              + Agregar consulta
            </button>
            <button
              type="button"
              onClick={() => onOpenDetails(patient.id)}
              className="w-full rounded-xl bg-[#2d6a4f] py-3 text-sm font-semibold text-white hover:bg-[#1b4332]"
            >
              Ver información detallada
            </button>
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
              Dueños / Contacto
            </h4>

            <div className="rounded-xl border border-[#e8e0d8] bg-[#faf9f7] p-3">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#2d6a4f]">
                Responsable 1 *
              </p>
              <div className="mb-3">
                <label
                  htmlFor="edit-dueno-1"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Nombre *
                </label>
                <input
                  id="edit-dueno-1"
                  value={draft.dueños[0].nombre}
                  onChange={(e) => {
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            dueños: [
                              { ...prev.dueños[0], nombre: e.target.value },
                              prev.dueños[1],
                            ],
                          }
                        : prev,
                    );
                    clearFieldError("dueño1");
                  }}
                  aria-invalid={Boolean(fieldErrors.dueño1)}
                  aria-describedby={
                    fieldErrors.dueño1 ? "edit-dueno-1-err" : undefined
                  }
                  className={`${inputBase} ${inputErrorRing(Boolean(fieldErrors.dueño1))}`}
                />
                {fieldErrors.dueño1 ? (
                  <FieldError id="edit-dueno-1-err" message={fieldErrors.dueño1} />
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="edit-tel-1"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Teléfono
                </label>
                <input
                  id="edit-tel-1"
                  type="tel"
                  value={draft.dueños[0].tel}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            dueños: [
                              { ...prev.dueños[0], tel: e.target.value },
                              prev.dueños[1],
                            ],
                          }
                        : prev,
                    )
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
                  htmlFor="edit-dueno-2"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Nombre
                </label>
                <input
                  id="edit-dueno-2"
                  value={draft.dueños[1].nombre}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            dueños: [
                              prev.dueños[0],
                              { ...prev.dueños[1], nombre: e.target.value },
                            ],
                          }
                        : prev,
                    )
                  }
                  className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-tel-2"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Teléfono
                </label>
                <input
                  id="edit-tel-2"
                  type="tel"
                  value={draft.dueños[1].tel}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            dueños: [
                              prev.dueños[0],
                              { ...prev.dueños[1], tel: e.target.value },
                            ],
                          }
                        : prev,
                    )
                  }
                  className={`${inputBase} border-[#e8e0d8] bg-[#faf9f7] focus:border-[#2d6a4f] focus:bg-white`}
                />
              </div>
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

            <div className="rounded-xl border border-[#e0d9cf] bg-[#faf8f5] p-3.5">
              <p className="mb-3 text-[13px] font-semibold text-[#555]">
                Clasificación
              </p>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draft.esExterno}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? { ...prev, esExterno: e.target.checked }
                        : prev,
                    )
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
                    setDraft((prev) =>
                      prev
                        ? { ...prev, esUnicaConsulta: e.target.checked }
                        : prev,
                    )
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
        )
      )}

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
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
    <ConfirmAlertDialog
      open={deleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      title="¿Eliminar esta ficha?"
      description="Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      destructive
      onConfirm={() => {
        onDelete(patient.id);
        onClose();
        setDeleteConfirmOpen(false);
      }}
    />
    </>
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
