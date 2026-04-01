"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { todayISODate } from "@/lib/date-utils";
import type { Consulta, ConsultaTipo } from "@/types/patient";

const tipos: ConsultaTipo[] = ["Control", "Vacuna", "Urgencia", "Cirugía"];

export function ConsultaModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Consulta, "id">) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [tipo, setTipo] = useState<ConsultaTipo>("Control");
  const [fecha, setFecha] = useState("");
  const [peso, setPeso] = useState("");
  const [temp, setTemp] = useState("");
  const [diag, setDiag] = useState("");
  const [trat, setTrat] = useState("");
  const [meds, setMeds] = useState("");

  useEffect(() => {
    if (open) {
      setMotivo("");
      setTipo("Control");
      setFecha(todayISODate());
      setPeso("");
      setTemp("");
      setDiag("");
      setTrat("");
      setMeds("");
    }
  }, [open]);

  const guardar = () => {
    const m = motivo.trim();
    if (!m) {
      window.alert("Completá el motivo de la consulta.");
      return;
    }
    onSave({
      motivo: m,
      tipo,
      fecha,
      peso,
      temp,
      diag: diag.trim(),
      trat: trat.trim(),
      meds: meds.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="consulta-title"
      overlayClassName="z-[210]"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-[18px] top-4 text-[22px] leading-none text-[#aaa] hover:text-[#333]"
        aria-label="Cerrar"
      >
        ✕
      </button>
      <h2 id="consulta-title" className="text-xl font-bold text-[#1a1a1a]">
        Nueva consulta 📋
      </h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
            Motivo de la consulta *
          </label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
            placeholder="Ej: Control anual, Vómitos..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ConsultaTipo)}
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
              onChange={(e) => setFecha(e.target.value)}
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
              onChange={(e) => setPeso(e.target.value)}
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
              onChange={(e) => setTemp(e.target.value)}
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
            onChange={(e) => setDiag(e.target.value)}
            rows={2}
            className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
            placeholder="Descripción del diagnóstico..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
            Tratamiento indicado
          </label>
          <textarea
            value={trat}
            onChange={(e) => setTrat(e.target.value)}
            rows={2}
            className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
            placeholder="Tratamiento y observaciones..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
            Medicamentos recetados
          </label>
          <input
            value={meds}
            onChange={(e) => setMeds(e.target.value)}
            className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:bg-white"
            placeholder="Ej: Amoxicilina 500mg cada 12hs por 7 días"
          />
        </div>
        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-3 text-[15px] font-medium text-[#555] hover:bg-[#f5f0eb]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            className="flex-[2] rounded-xl bg-[#2d6a4f] py-3 text-[15px] font-semibold text-white hover:bg-[#1b4332]"
          >
            ✓ Guardar consulta
          </button>
        </div>
      </div>
    </Modal>
  );
}
