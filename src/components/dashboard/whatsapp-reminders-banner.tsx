"use client";

import { useMemo, useState } from "react";
import { usePatients } from "@/components/providers/patients-provider";
import {
  buildMensajeRecordatorio,
  buildWhatsAppUrl,
  getTurnosMañana,
} from "@/lib/whatsapp-utils";
import { fechaHoraGuardadaToMaskedInputs } from "@/lib/proximo-control-utils";

export function WhatsAppRemindersBanner() {
  const { patients, ready, updateProximoControl } = usePatients();
  const [dismissed, setDismissed] = useState(false);

  const turnosMañana = useMemo(
    () => (ready ? getTurnosMañana(patients) : []),
    [patients, ready],
  );

  if (!ready || dismissed || turnosMañana.length === 0) return null;

  const handleEnviar = (
    pacienteId: string,
    controlId: string,
    tel: string,
    mensaje: string,
  ) => {
    const url = buildWhatsAppUrl(tel, mensaje);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    updateProximoControl(pacienteId, controlId, { recordatorioEnviado: true });
  };

  return (
    <div className="mb-5 rounded-2xl border border-[#b7d5c9] bg-[#f0faf5] px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WhatsAppIcon className="text-[#25d366]" size={18} />
          <p className="text-sm font-semibold text-[#1b4332]">
            {turnosMañana.length === 1
              ? "1 turno mañana sin recordatorio enviado"
              : `${turnosMañana.length} turnos mañana sin recordatorio enviado`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[#888] hover:text-[#444]"
          aria-label="Ignorar por ahora"
        >
          ✕
        </button>
      </div>

      <ul className="space-y-2">
        {turnosMañana.map(({ paciente, control }) => {
          const { fecha } = fechaHoraGuardadaToMaskedInputs(control.fechaHora);
          const dueñosConTel = paciente.dueños.filter((d) => d.tel);
          return (
            <li
              key={control.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#c8e6d8] bg-white px-3.5 py-2.5"
            >
              <div className="text-sm">
                <span className="font-semibold text-[#1a1a1a]">
                  {paciente.nombre}
                </span>
                <span className="mx-2 text-[#c4bbb0]">·</span>
                <span className="text-[#555]">{fecha}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dueñosConTel.length === 0 ? (
                  <span className="text-xs text-[#aaa]">
                    Sin teléfono registrado
                  </span>
                ) : (
                  dueñosConTel.map((dueño, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        handleEnviar(
                          paciente.id,
                          control.id,
                          dueño.tel,
                          buildMensajeRecordatorio(
                            paciente,
                            control,
                            dueño.nombre || `Responsable ${i + 1}`,
                          ),
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1ebe5d]"
                    >
                      <WhatsAppIcon size={13} />
                      {dueñosConTel.length > 1
                        ? dueño.nombre || `Resp. ${i + 1}`
                        : "Enviar recordatorio"}
                    </button>
                  ))
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WhatsAppIcon({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
