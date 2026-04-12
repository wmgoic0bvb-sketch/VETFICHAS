import type { CarnetEventoVacuna } from "@/lib/carnet-public";
import { formatProximoRefuerzoDisplay } from "@/lib/date-utils";

function partesDescripcion(text: string): string[] {
  return text.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
}

function MetaCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7A7A7A]">
        {label}
      </p>
      <p
        className={`mt-1 break-words font-bold leading-tight text-[#1A1A1A] ${
          mono ? "font-mono text-[15px] tabular-nums" : "text-[15px]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type Props = {
  evento: CarnetEventoVacuna;
  /** Fecha de aplicación ya formateada (DD/MM/AAAA). */
  fechaAplicacion: string;
};

/**
 * Tarjeta tipo carnet: nombre de vacuna → descripción → metadatos (aplicada, lote, marca…).
 */
export function CarnetEventoCard({ evento: ev, fechaAplicacion }: Props) {
  const showAplicada =
    fechaAplicacion.trim() !== "" && fechaAplicacion !== "—";
  const proximoRaw = ev.proximoRefuerzo?.trim() ?? "";
  const proximo = proximoRaw
    ? formatProximoRefuerzoDisplay(proximoRaw)
    : "";
  const showProximo = proximo.trim() !== "";
  const lote = ev.lote?.trim() ?? "";
  const showLote = lote.length > 0;
  const marca = ev.marca?.trim() ?? "";
  const showMarca = marca.length > 0;

  const hasMetaGrid =
    showAplicada || showProximo || showLote || showMarca;

  return (
    <li className="rounded-2xl border border-[#dcd0d8]/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:p-8">
      <ul className="space-y-8">
        {ev.vacunas.map((v, j) => {
          const partes = v.descripcion
            ? partesDescripcion(v.descripcion)
            : [];
          return (
            <li
              key={`${ev.fecha}-${j}-${v.nombre}`}
              className={
                j > 0 ? "border-t border-[#EDE3D8] pt-8" : undefined
              }
            >
              <h3 className="text-xl font-bold leading-snug text-[#8B1A4A] sm:text-[1.35rem]">
                {v.nombre}
              </h3>
              {partes.length > 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-[#5C5C5C]">
                  {partes.map((p, k) => (
                    <span key={k}>
                      {k > 0 ? (
                        <span className="mx-1 text-[#B0B0B0]" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      {p}
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {hasMetaGrid ? (
        <div className="mt-8 grid grid-cols-1 gap-5 border-t border-[#EDE3D8] pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {showAplicada ? (
            <MetaCell label="Aplicada" value={fechaAplicacion} />
          ) : null}
          {showProximo ? (
            <MetaCell label="Próximo refuerzo" value={proximo} />
          ) : null}
          {showLote ? <MetaCell label="Lote" value={lote} mono /> : null}
          {showMarca ? <MetaCell label="Marca" value={marca} /> : null}
        </div>
      ) : null}

      <time className="sr-only" dateTime={ev.fecha}>
        {fechaAplicacion}
      </time>
    </li>
  );
}
