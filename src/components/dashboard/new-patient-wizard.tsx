"use client";

import { useCallback, useState } from "react";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import { Modal } from "@/components/ui/modal";
import { parDueñosVacío } from "@/lib/dueños-utils";
import type { Especie, PacienteDraft } from "@/types/patient";

const steps = [1, 2, 3] as const;

type FieldKeys = "especie" | "nombre" | "dueño1";
type FieldErrors = Partial<Record<FieldKeys, string>>;

export function NewPatientWizard({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: PacienteDraft) => void | Promise<void>;
}) {
  const [paso, setPaso] = useState(1);
  const [especie, setEspecie] = useState<Especie | "">("");
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
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const go = (n: number) => setPaso(n);

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
    try {
      await onSave({
        especie: especie as Especie,
        nombre: n,
        raza: raza.trim(),
        sexo,
        fnac,
        castrado,
        color: color.trim(),
        dueños: [
          { nombre: d1, tel: dueños[0].tel.trim() },
          {
            nombre: dueños[1].nombre.trim(),
            tel: dueños[1].tel.trim(),
          },
        ],
        dir: dir.trim(),
        estado: "activo",
        esExterno,
        esUnicaConsulta: false,
        consultas: [],
      });
      handleClose();
    } catch {
      /* onSave puede rechazar si falla el alta en el servidor */
    }
  };

  const stepClass = (i: number) => {
    if (i < paso) return "bg-[#2d6a4f]";
    if (i === paso) return "bg-[#52b788]";
    return "bg-[#e8e0d8]";
  };

  return (
    <Modal open={open} onClose={handleClose} labelledBy="wizard-title">
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-[18px] top-4 text-[22px] leading-none text-[#aaa] hover:text-[#333]"
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
                className={`flex-1 rounded-2xl border-2 px-2.5 py-4 text-center transition-all hover:border-[#52b788] ${
                  especie === esp
                    ? "border-[#2d6a4f] bg-[#f0faf5]"
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
          <div className="mt-6 flex gap-2.5">
            <button
              type="button"
              disabled={!especie}
              onClick={() => go(2)}
              className="flex-[2] rounded-xl bg-[#2d6a4f] py-3 text-[15px] font-semibold text-white hover:bg-[#1b4332] disabled:cursor-not-allowed disabled:bg-[#b7d5c9]"
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
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
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
                className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
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
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
                ¿Castrado/a?
              </label>
              <select
                value={castrado}
                onChange={(e) => setCastrado(e.target.value)}
                className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
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
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
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
              className="flex-[2] rounded-xl bg-[#2d6a4f] py-3 text-[15px] font-semibold text-white hover:bg-[#1b4332]"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Dueños y contacto 👤</h2>
          <p className="mb-5 text-sm text-[#888]">Paso 3 de 3 — Hasta dos responsables</p>

          <div className="mb-4 rounded-xl border border-[#e8e0d8] bg-white p-3.5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-[#2d6a4f]">
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
                value={dueños[0].tel}
                onChange={(e) =>
                  setDueños((prev) => [
                    { ...prev[0], tel: e.target.value },
                    prev[1],
                  ])
                }
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
                placeholder="Ej: 2980 123456"
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
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
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
                value={dueños[1].tel}
                onChange={(e) =>
                  setDueños((prev) => [
                    prev[0],
                    { ...prev[1], tel: e.target.value },
                  ])
                }
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
                placeholder="Ej: 2980 654321"
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
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
              placeholder="Ej: Belgrano 450"
            />
          </div>

          <div className="mb-4 rounded-xl border border-[#e0d9cf] bg-[#faf8f5] p-3.5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={esExterno}
                onChange={(e) => setEsExterno(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c4bbb0] text-[#2d6a4f] focus:ring-[#2d6a4f]"
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
              onClick={guardar}
              className="flex-[2] rounded-xl bg-[#2d6a4f] py-3 text-[15px] font-semibold text-white hover:bg-[#1b4332]"
            >
              ✓ Guardar ficha
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
