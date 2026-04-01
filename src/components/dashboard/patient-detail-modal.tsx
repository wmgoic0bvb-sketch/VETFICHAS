"use client";

import { Modal } from "@/components/ui/modal";
import { calcularEdad, formatFecha } from "@/lib/date-utils";
import type { Consulta, Paciente } from "@/types/patient";

const tipoClass: Record<string, string> = {
  Control: "bg-emerald-100 text-emerald-900",
  Urgencia: "bg-red-100 text-red-900",
  Cirugía: "bg-amber-100 text-amber-900",
  Vacuna: "bg-sky-100 text-sky-900",
};

function emoji(especie: Paciente["especie"]) {
  return especie === "Perro" ? "🐶" : "🐱";
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
  if (!patient) return null;

  const consultas = [...(patient.consultas ?? [])].reverse();

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
          {emoji(patient.especie)}
        </span>
        <h2 id="ficha-nombre" className="text-2xl font-bold text-[#1a1a1a]">
          {patient.nombre}
        </h2>
        <p className="mt-1 text-sm text-[#888]">
          {patient.raza || patient.especie} · {calcularEdad(patient.fnac)}
        </p>
      </div>

      <section className="mb-5">
        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
          Datos del paciente
        </h3>
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
