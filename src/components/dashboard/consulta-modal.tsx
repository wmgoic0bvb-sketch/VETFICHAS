"use client";

import { useEffect, useState } from "react";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import { todayISODate } from "@/lib/date-utils";
import type { Consulta, ConsultaTipo } from "@/types/patient";

const tipos: ConsultaTipo[] = [
  "Consulta",
  "Control",
  "Vacuna",
  "Urgencia",
  "Cirugía",
];

export function ConsultaModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Consulta, "id">) => void | Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [veterinario, setVeterinario] = useState("");
  const [tipo, setTipo] = useState<ConsultaTipo>("Consulta");
  const [fecha, setFecha] = useState("");
  const [peso, setPeso] = useState("");
  const [temp, setTemp] = useState("");
  const [diag, setDiag] = useState("");
  const [trat, setTrat] = useState("");
  const [meds, setMeds] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);
  const [vetError, setVetError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [vetOpciones, setVetOpciones] = useState<{ id: string; nombre: string }[]>(
    [],
  );
  const [vetListLoading, setVetListLoading] = useState(false);
  const [vetListError, setVetListError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivo("");
      setVeterinario("");
      setTipo("Consulta");
      setFecha(todayISODate());
      setPeso("");
      setTemp("");
      setDiag("");
      setTrat("");
      setMeds("");
      setMotivoError(null);
      setVetError(null);
      setHasChanges(false);
      setConfirmCloseOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setVetListLoading(true);
    setVetListError(null);
    void (async () => {
      try {
        const res = await fetch("/api/veterinarios");
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            typeof j.error === "string" ? j.error : "No se pudo cargar la lista",
          );
        }
        const data = (await res.json()) as {
          veterinarios: { id: string; nombre: string }[];
        };
        if (!cancelled) {
          setVetOpciones(data.veterinarios);
        }
      } catch (e) {
        if (!cancelled) {
          setVetListError(e instanceof Error ? e.message : "Error al cargar");
          setVetOpciones([]);
        }
      } finally {
        if (!cancelled) setVetListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const guardar = async () => {
    const m = motivo.trim();
    if (!vetListLoading && vetOpciones.length === 0) {
      setVetError(
        "No hay veterinarios activos. Un administrador puede cargarlos en Administración.",
      );
      return;
    }
    if (!veterinario) {
      setVetError("Elegí el veterinario.");
      return;
    }
    if (!m) {
      setMotivoError("Completá el motivo de la consulta.");
      return;
    }
    setMotivoError(null);
    setVetError(null);
    setSaving(true);
    try {
      await Promise.resolve(
        onSave({
          motivo: m,
          veterinario,
          tipo,
          fecha,
          peso,
          temp,
          diag: diag.trim(),
          trat: trat.trim(),
          meds: meds.trim(),
        }),
      );
      setHasChanges(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const busy = vetListLoading || saving;

  const requestClose = () => {
    if (busy) return;
    if (!hasChanges) {
      onClose();
      return;
    }
    setConfirmCloseOpen(true);
  };

  return (
    <Modal
      open={open}
      onClose={requestClose}
      labelledBy="consulta-title"
      overlayClassName="z-[210]"
    >
      <div className="relative">
        <DbLoadingOverlay
          show={busy}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/85 backdrop-blur-sm"
        />
      <button
        type="button"
        onClick={requestClose}
        disabled={busy}
        className="absolute right-[18px] top-4 z-[1] text-[22px] leading-none text-[#aaa] hover:text-[#333] disabled:opacity-50"
        aria-label="Cerrar"
      >
        ✕
      </button>
      <h2 id="consulta-title" className="text-xl font-bold text-[#1a1a1a]">
        Nueva consulta 📋
      </h2>
      <div className="mt-4 space-y-4">
        <div
          className="rounded-[14px] border border-[#b7d5c9] bg-[#f0faf5] p-3.5"
        >
          <label
            htmlFor="consulta-vet"
            className="mb-1.5 block text-[13px] font-semibold text-[#1b4332]"
          >
            Veterinario *
          </label>
          <select
            id="consulta-vet"
            value={veterinario}
            disabled={vetListLoading}
            onChange={(e) => {
              setVeterinario(e.target.value);
              setHasChanges(true);
              if (vetError) setVetError(null);
            }}
            aria-invalid={Boolean(vetError || vetListError)}
            aria-describedby={
              [vetListError && "consulta-vet-list-err", vetError && "consulta-vet-err"]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={`w-full min-h-[48px] cursor-pointer rounded-xl border-[1.5px] border-[#2d6a4f] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1b4332] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.2)] disabled:cursor-wait disabled:opacity-70 ${inputErrorRing(
              Boolean(vetError || vetListError),
            )}`}
          >
            <option value="">
              {vetListLoading ? "Cargando veterinarios…" : "Elegir veterinario..."}
            </option>
            {vetOpciones.map((v) => (
              <option key={v.id} value={v.nombre}>
                {v.nombre}
              </option>
            ))}
          </select>
          {vetListError ? (
            <FieldError id="consulta-vet-list-err" message={vetListError} />
          ) : null}
          {vetError ? (
            <FieldError id="consulta-vet-err" message={vetError} />
          ) : null}
        </div>

        <div>
          <label
            htmlFor="consulta-motivo"
            className="mb-1.5 block text-[13px] font-semibold text-[#555]"
          >
            Motivo de la consulta *
          </label>
          <input
            id="consulta-motivo"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              setHasChanges(true);
              if (motivoError) setMotivoError(null);
            }}
            aria-invalid={Boolean(motivoError)}
            aria-describedby={
              motivoError ? "consulta-motivo-err" : undefined
            }
            className={`w-full rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm outline-none transition-colors ${inputErrorRing(
              Boolean(motivoError),
            )}`}
            placeholder="Ej: Control anual, Vómitos..."
          />
          {motivoError ? (
            <FieldError id="consulta-motivo-err" message={motivoError} />
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as ConsultaTipo);
                setHasChanges(true);
              }}
              className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
            >
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHasChanges(true);
              }}
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={peso}
              onChange={(e) => {
                setPeso(e.target.value);
                setHasChanges(true);
              }}
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
              placeholder="Ej: 12.5"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
              Temperatura (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={temp}
              onChange={(e) => {
                setTemp(e.target.value);
                setHasChanges(true);
              }}
              className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
              placeholder="Ej: 38.5"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
            Diagnóstico
          </label>
          <textarea
            value={diag}
            onChange={(e) => {
              setDiag(e.target.value);
              setHasChanges(true);
            }}
            rows={2}
            className="min-h-[88px] w-full resize-y rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#2d6a4f] focus:bg-white"
            placeholder="Descripción del diagnóstico..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
            Tratamiento indicado
          </label>
          <textarea
            value={trat}
            onChange={(e) => {
              setTrat(e.target.value);
              setHasChanges(true);
            }}
            rows={2}
            className="min-h-[88px] w-full resize-y rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#2d6a4f] focus:bg-white"
            placeholder="Tratamiento y observaciones..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
            Medicamentos recetados
          </label>
          <input
            value={meds}
            onChange={(e) => {
              setMeds(e.target.value);
              setHasChanges(true);
            }}
            className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
            placeholder="Ej: Amoxicilina 500mg cada 12hs por 7 días"
          />
        </div>
        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            className="flex-1 rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-3 text-[15px] font-medium text-[#555] hover:bg-[#f5f0eb] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={busy}
            className="flex-[2] rounded-xl bg-[#2d6a4f] py-3 text-[15px] font-semibold text-white hover:bg-[#1b4332] disabled:opacity-60"
          >
            ✓ Guardar consulta
          </button>
        </div>
      </div>
      </div>

      <Modal
        open={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        labelledBy="confirm-close-consulta-title"
        overlayClassName="z-[220]"
      >
        <h3
          id="confirm-close-consulta-title"
          className="text-lg font-bold text-[#1a1a1a]"
        >
          ¿Cerrar sin guardar?
        </h3>
        <p className="mt-2 text-sm text-[#555]">
          Tenés cambios sin guardar en esta consulta.
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => setConfirmCloseOpen(false)}
            className="flex-1 rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-2.5 text-sm font-medium text-[#555] hover:bg-[#f5f0eb]"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmCloseOpen(false);
              onClose();
            }}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Descartar cambios
          </button>
        </div>
      </Modal>
    </Modal>
  );
}
