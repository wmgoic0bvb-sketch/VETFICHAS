"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldError, inputErrorRing } from "@/components/ui/field-error";
import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { Modal } from "@/components/ui/modal";
import { todayISODate } from "@/lib/date-utils";
import { maskInputFechaDDMMYYYY } from "@/lib/proximo-control-utils";
import {
  joinVacunasMotivo,
  parseVacunasMotivoTokens,
} from "@/lib/vacunas";
import type { Consulta, ConsultaTipo } from "@/types/patient";

const tipos: ConsultaTipo[] = [
  "Consulta",
  "Consulta a domicilio",
  "Control",
  "Urgencia",
  "Cirugía",
];

const FECHA_MASKED_DDMMYYYY = /^\d{2}\/\d{2}\/\d{4}$/;

function isoToMaskedDDMMYYYY(iso: string): string {
  const t = iso.trim();
  const parts = t.split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  if (!y || !m || !d) return "";
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function maskedDDMMYYYYToISO(masked: string): string | null {
  const m = FECHA_MASKED_DDMMYYYY.exec(masked.trim());
  if (!m) return null;
  const [dd, mm, yyyy] = masked.trim().split("/");
  const d = Number(dd);
  const mo = Number(mm);
  const y = Number(yyyy);
  if (!Number.isFinite(d) || !Number.isFinite(mo) || !Number.isFinite(y))
    return null;
  const dt = new Date(y, mo - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  )
    return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}`;
}

export function ConsultaModal({
  open,
  onClose,
  onSave,
  initialConsulta,
  initialTipo,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Consulta, "id">) => void | Promise<void>;
  /** Si está definido, el modal carga estos datos (modo edición). */
  initialConsulta?: Consulta | null;
  /** Tipo inicial cuando se crea una nueva entrada (ignorado en modo edición). */
  initialTipo?: ConsultaTipo;
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
  const [vacunasSel, setVacunasSel] = useState<string[]>([]);
  const [vacunaFechaInput, setVacunaFechaInput] = useState("");
  const [refuerzoError, setRefuerzoError] = useState<string | null>(null);
  const [vacunasCatalogo, setVacunasCatalogo] = useState<
    { nombre: string; descripcion: string }[]
  >([]);
  const [vacunasListLoading, setVacunasListLoading] = useState(false);
  const [vacunasListError, setVacunasListError] = useState<string | null>(null);

  const isEdit = Boolean(initialConsulta);

  useEffect(() => {
    if (!open) return;
    if (initialConsulta) {
      setMotivo(initialConsulta.motivo);
      setVacunasSel(
        initialConsulta.tipo === "Vacuna"
          ? parseVacunasMotivoTokens(initialConsulta.motivo, [])
          : [],
      );
      setVeterinario(initialConsulta.veterinario);
      setTipo(initialConsulta.tipo);
      setFecha(
        initialConsulta.fecha?.trim()
          ? initialConsulta.fecha.slice(0, 10)
          : todayISODate(),
      );
      setVacunaFechaInput(
        initialConsulta.tipo === "Vacuna"
          ? isoToMaskedDDMMYYYY(
              initialConsulta.fecha?.trim()
                ? initialConsulta.fecha.slice(0, 10)
                : todayISODate(),
            )
          : "",
      );
      setPeso(initialConsulta.peso);
      setTemp(initialConsulta.temp);
      setDiag(initialConsulta.diag);
      setTrat(initialConsulta.trat);
      setMeds(initialConsulta.meds);
    } else {
      setMotivo("");
      setVacunasSel([]);
      setVeterinario("");
      setTipo(initialTipo ?? "Consulta");
      setFecha(todayISODate());
      setVacunaFechaInput(isoToMaskedDDMMYYYY(todayISODate()));
      setPeso("");
      setTemp("");
      setDiag("");
      setTrat("");
      setMeds("");
    }
    setMotivoError(null);
    setVetError(null);
    setRefuerzoError(null);
    setHasChanges(false);
    setConfirmCloseOpen(false);
  }, [open, initialConsulta, initialTipo]);

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

  const nombresVacunasOrdenados = useMemo(
    () => vacunasCatalogo.map((v) => v.nombre),
    [vacunasCatalogo],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setVacunasListLoading(true);
    setVacunasListError(null);
    void (async () => {
      try {
        const res = await fetch("/api/vacunas");
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            typeof j.error === "string" ? j.error : "No se pudo cargar el catálogo",
          );
        }
        const data = (await res.json()) as {
          vacunas: { nombre: string; descripcion: string }[];
        };
        if (!cancelled) {
          setVacunasCatalogo(data.vacunas);
        }
      } catch (e) {
        if (!cancelled) {
          setVacunasListError(
            e instanceof Error ? e.message : "Error al cargar vacunas",
          );
          setVacunasCatalogo([]);
        }
      } finally {
        if (!cancelled) setVacunasListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !initialConsulta || initialConsulta.tipo !== "Vacuna") return;
    if (nombresVacunasOrdenados.length === 0) return;
    setVacunasSel(
      parseVacunasMotivoTokens(
        initialConsulta.motivo,
        nombresVacunasOrdenados,
      ),
    );
  }, [open, initialConsulta, nombresVacunasOrdenados]);

  const legacyVetNombre = initialConsulta?.veterinario?.trim();
  const vetRows = useMemo(() => {
    if (legacyVetNombre && !vetOpciones.some((v) => v.nombre === legacyVetNombre)) {
      return [{ id: "__legacy__", nombre: legacyVetNombre }, ...vetOpciones];
    }
    return vetOpciones;
  }, [vetOpciones, legacyVetNombre]);

  const isVacuna = tipo === "Vacuna";

  const applyTipoChange = (next: ConsultaTipo) => {
    if (tipo === "Vacuna" && next !== "Vacuna") {
      const j = joinVacunasMotivo(vacunasSel, nombresVacunasOrdenados);
      if (j) setMotivo(j);
    }
    if (tipo !== "Vacuna" && next === "Vacuna") {
      setVacunasSel(parseVacunasMotivoTokens(motivo, nombresVacunasOrdenados));
      setVacunaFechaInput(isoToMaskedDDMMYYYY(fecha || todayISODate()));
    }
    setTipo(next);
    setHasChanges(true);
  };

  const guardar = async () => {
    const m = isVacuna
      ? joinVacunasMotivo(vacunasSel, nombresVacunasOrdenados)
      : motivo.trim();
    if (!vetListLoading && vetRows.length === 0) {
      setVetError(
        "No hay veterinarios activos. Un administrador puede cargarlos en Administración.",
      );
      return;
    }
    if (!veterinario) {
      setVetError("Elegí el veterinario.");
      return;
    }
    if (
      isVacuna &&
      !vacunasListLoading &&
      nombresVacunasOrdenados.length === 0
    ) {
      setMotivoError(
        "No hay vacunas en el catálogo. Un administrador puede cargarlas en Administración.",
      );
      return;
    }
    if (!m) {
      setMotivoError(
        isVacuna
          ? "Elegí al menos una vacuna de la lista."
          : "Completá el motivo de la consulta.",
      );
      return;
    }
    if (isVacuna) {
      const r = meds.trim();
      if (r && !FECHA_MASKED_DDMMYYYY.test(r)) {
        setRefuerzoError("Revisá la fecha (DD/MM/AAAA).");
        return;
      }
    }
    setMotivoError(null);
    setVetError(null);
    setRefuerzoError(null);
    setSaving(true);
    try {
      await Promise.resolve(
        onSave({
          motivo: m,
          veterinario,
          tipo,
          fecha,
          peso: isVacuna ? "" : peso,
          temp: isVacuna ? "" : temp,
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
        {isVacuna
          ? isEdit
            ? "Editar vacunación 💉"
            : "Nueva vacunación 💉"
          : isEdit
            ? "Editar consulta 📋"
            : "Nueva consulta 📋"}
      </h2>
      <div className="mt-4 space-y-4">
        {isVacuna ? (
          <>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
                Fecha de aplicación
              </label>
              <input
                inputMode="numeric"
                value={vacunaFechaInput}
                onChange={(e) => {
                  const next = maskInputFechaDDMMYYYY(e.target.value);
                  setVacunaFechaInput(next);
                  const iso = maskedDDMMYYYYToISO(next);
                  if (iso) setFecha(iso);
                  setHasChanges(true);
                }}
                className="w-full max-w-xs rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 font-mono text-[15px] tabular-nums tracking-wide outline-none transition-colors placeholder:text-[#c4bbb0] focus:border-[#5c1838] focus:bg-white"
                placeholder="DD/MM/AAAA"
              />
            </div>
            <div>
              <span
                id="vacunas-legend"
                className="mb-1.5 block text-[13px] font-semibold text-[#555]"
              >
                Vacunas aplicadas *
              </span>
              <details
                className={`group rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 open:bg-white open:pb-3 ${inputErrorRing(
                  Boolean(motivoError),
                )}`}
              >
                <summary className="cursor-pointer list-none text-sm text-[#1a1a1a] outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    <span>
                      {vacunasSel.length === 0
                        ? "Tocá para elegir una o más…"
                        : vacunasSel.length === 1
                          ? vacunasSel[0]
                          : `${vacunasSel.length} vacunas seleccionadas`}
                    </span>
                    <span
                      className="text-[10px] text-[#888] transition-transform group-open:rotate-180"
                      aria-hidden
                    >
                      ▼
                    </span>
                  </span>
                </summary>
                <fieldset
                  aria-labelledby="vacunas-legend"
                  className="mt-3 space-y-2 border-0 p-0"
                >
                  <legend className="sr-only">Vacunas aplicadas</legend>
                  {vacunasListLoading ? (
                    <p className="text-sm text-[#888]">Cargando catálogo…</p>
                  ) : vacunasListError ? (
                    <FieldError id="vacunas-cat-err" message={vacunasListError} />
                  ) : vacunasCatalogo.length === 0 ? (
                    <p className="text-sm text-[#888]">
                      No hay vacunas cargadas. Pedile a un administrador que las dé
                      de alta en Administración.
                    </p>
                  ) : (
                    vacunasCatalogo.map((v) => {
                      const nombre = v.nombre;
                      const id = `vacuna-opt-${nombre.replace(/\s+/g, "-").toLowerCase()}`;
                      const checked = vacunasSel.includes(nombre);
                      return (
                        <label
                          key={nombre}
                          htmlFor={id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1 pl-0.5 pr-1 text-sm text-[#333] hover:bg-[#f0faf5]"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setVacunasSel((prev) =>
                                checked
                                  ? prev.filter((x) => x !== nombre)
                                  : [...prev, nombre],
                              );
                              setHasChanges(true);
                              if (motivoError) setMotivoError(null);
                            }}
                            className="h-4 w-4 shrink-0 rounded border-[#5c1838]/40 text-[#5c1838] focus:ring-[#5c1838]"
                          />
                          <span className="font-medium">{nombre}</span>
                        </label>
                      );
                    })
                  )}
                </fieldset>
              </details>
              {motivoError ? (
                <FieldError id="consulta-motivo-err" message={motivoError} />
              ) : null}
            </div>
            <div
              className="rounded-[14px] border border-[#b7d5c9] bg-[#f0faf5] p-3.5"
            >
              <label
                htmlFor="consulta-vet"
                className="mb-1.5 block text-[13px] font-semibold text-[#401127]"
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
                className={`w-full min-h-[48px] cursor-pointer rounded-xl border-[1.5px] border-[#5c1838] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#401127] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.2)] disabled:cursor-wait disabled:opacity-70 ${inputErrorRing(
                  Boolean(vetError || vetListError),
                )}`}
              >
                <option value="">
                  {vetListLoading ? "Cargando veterinarios…" : "Elegir veterinario..."}
                </option>
                {vetRows.map((v) => (
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
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="vacuna-marca"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Marca <span className="font-normal text-[#888]">(opc.)</span>
                </label>
                <input
                  id="vacuna-marca"
                  value={diag}
                  onChange={(e) => {
                    setDiag(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                  placeholder="Laboratorio / marca"
                />
              </div>
              <div>
                <label
                  htmlFor="vacuna-lote"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Lote <span className="font-normal text-[#888]">(opc.)</span>
                </label>
                <input
                  id="vacuna-lote"
                  value={trat}
                  onChange={(e) => {
                    setTrat(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                  placeholder="Nº de lote"
                />
              </div>
              <div>
                <label
                  htmlFor="vacuna-refuerzo"
                  className="mb-1.5 block text-[13px] font-semibold text-[#555]"
                >
                  Próximo refuerzo{" "}
                  <span className="font-normal text-[#888]">(opc.)</span>
                </label>
                <input
                  id="vacuna-refuerzo"
                  inputMode="numeric"
                  value={meds}
                  onChange={(e) => {
                    const next = maskInputFechaDDMMYYYY(e.target.value);
                    setMeds(next);
                    setHasChanges(true);
                    if (refuerzoError) setRefuerzoError(null);
                  }}
                  className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                  placeholder="DD/MM/AAAA"
                />
                {refuerzoError ? (
                  <div className="mt-1">
                    <FieldError id="vacuna-refuerzo-err" message={refuerzoError} />
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="rounded-[14px] border border-[#b7d5c9] bg-[#f0faf5] p-3.5"
            >
              <label
                htmlFor="consulta-vet"
                className="mb-1.5 block text-[13px] font-semibold text-[#401127]"
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
                className={`w-full min-h-[48px] cursor-pointer rounded-xl border-[1.5px] border-[#5c1838] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#401127] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.2)] disabled:cursor-wait disabled:opacity-70 ${inputErrorRing(
                  Boolean(vetError || vetListError),
                )}`}
              >
                <option value="">
                  {vetListLoading ? "Cargando veterinarios…" : "Elegir veterinario..."}
                </option>
                {vetRows.map((v) => (
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
                  onChange={(e) =>
                    applyTipoChange(e.target.value as ConsultaTipo)
                  }
                  className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
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
                  className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
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
                  className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
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
                  className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                  placeholder="Ej: 38.5"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#555]">
                Anamnesis y diagnóstico
              </label>
              <textarea
                value={diag}
                onChange={(e) => {
                  setDiag(e.target.value);
                  setHasChanges(true);
                }}
                rows={2}
                className="min-h-[88px] w-full resize-y rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#5c1838] focus:bg-white"
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
                className="min-h-[88px] w-full resize-y rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#5c1838] focus:bg-white"
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
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-[#faf9f7] px-3.5 py-2.5 text-sm outline-none focus:border-[#5c1838] focus:bg-white"
                placeholder="Ej: Amoxicilina 500mg cada 12hs por 7 días"
              />
            </div>
          </>
        )}
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
            className="flex-[2] rounded-xl bg-[#5c1838] py-3 text-[15px] font-semibold text-white hover:bg-[#401127] disabled:opacity-60"
          >
            {isEdit
              ? "✓ Guardar cambios"
              : isVacuna
                ? "✓ Guardar vacunación"
                : "✓ Guardar consulta"}
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
