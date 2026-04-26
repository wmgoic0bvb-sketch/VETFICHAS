"use client";

import { useState } from "react";
import { formatFecha } from "@/lib/date-utils";
import type { Estudio, EstudioCategoria } from "@/types/patient";

const categoriaBadgeClass: Record<EstudioCategoria, string> = {
  "Sangre / laboratorio": "bg-rose-100 text-rose-900",
  Radiografía: "bg-sky-100 text-sky-900",
  Ecografía: "bg-violet-100 text-violet-900",
  Otro: "bg-stone-100 text-stone-800",
};

function isImageType(ct: string) {
  return /^image\//i.test(ct);
}

function toProtectedBlobUrl(url: string): string {
  return `/api/blob/file?url=${encodeURIComponent(url)}`;
}

function EstudioHeader({ group }: { group: Estudio[] }) {
  const e = group[0];
  const fechaStr = formatFecha(e.fecha.split("T")[0] ?? e.fecha);
  const tituloBase = e.titulo.trim() || e.nombreArchivo;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-xs text-[#888]">{fechaStr}</div>
      <span
        className={`mb-1.5 inline-block max-w-full rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${categoriaBadgeClass[e.categoria] ?? "bg-emerald-100 text-emerald-900"}`}
      >
        {e.categoria}
      </span>
      <div className="flex items-baseline gap-2">
        <div className="text-[15px] font-semibold leading-snug text-[#1a1a1a]">
          {tituloBase}
        </div>
        {group.length > 1 ? (
          <span className="text-[11px] font-normal text-[#8f8f8f]">
            {group.length} archivos
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function EstudiosGroupCard({
  group,
  selected,
  selectable,
  onToggleSelect,
  onRemoveClick,
}: {
  group: Estudio[];
  selected: boolean;
  selectable: boolean;
  onToggleSelect: () => void;
  onRemoveClick: (e: Estudio) => void;
}) {
  const e = group[0];
  const [open, setOpen] = useState(false);
  const panelId = `estudio-detail-${e.id}`;
  const triggerId = `estudio-trigger-${e.id}`;

  return (
    <div
      className={`overflow-hidden rounded-[14px] border-l-[3px] bg-[#f5f0eb] ${selected ? "border-[#5c1838]" : "border-[#5c1838]/35"}`}
    >
      <div className="flex w-full items-start gap-2 px-4 py-3.5">
        {selectable ? (
          <input
            type="checkbox"
            aria-label="Seleccionar estudio"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 accent-[#5c1838]"
          />
        ) : null}
        <button
          type="button"
          id={triggerId}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-start gap-2 text-left transition-colors hover:bg-[#efeae2]"
        >
          <EstudioHeader group={group} />
          <span
            className={`mt-1 inline-block shrink-0 text-[10px] leading-none text-[#888] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▼
          </span>
        </button>
      </div>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="border-t border-[#e0d9cf] bg-[#faf8f5] px-4 py-3"
        >
          <div className="space-y-3">
            {group.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f0ebe4]">
                  {isImageType(item.contentType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toProtectedBlobUrl(item.url)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      📄
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="break-words text-[13px] leading-relaxed text-[#555]">
                    <span className="text-[#888]">Archivo: </span>
                    {item.nombreArchivo}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <a
                      href={toProtectedBlobUrl(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold text-[#5c1838] underline"
                    >
                      Abrir
                    </a>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.preventDefault();
                        onRemoveClick(item);
                      }}
                      className="text-[13px] font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
