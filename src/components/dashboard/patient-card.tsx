"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDueñosCorto } from "@/lib/dueños-utils";
import { esPacienteActivo, type Paciente } from "@/types/patient";

function emoji(especie: Paciente["especie"]) {
  return especie === "Perro" ? "🐶" : "🐱";
}

export function PatientCard({
  patient,
  onOpen,
  userSucursal,
}: {
  patient: Paciente;
  onOpen: (id: string) => void;
  userSucursal?: Paciente["sucursal"] | null;
}) {
  const badgeClass =
    patient.especie === "Perro"
      ? "bg-sky-100 text-blue-900"
      : "bg-violet-100 text-violet-900";
  const esOtraSucursal =
    !!userSucursal && !!patient.sucursal && patient.sucursal !== userSucursal;

  return (
    <Link
      href={`/patient/${patient.id}`}
      onClick={() => onOpen(patient.id)}
      className={`group cursor-pointer rounded-[18px] border-2 border-transparent px-4 py-5 text-center transition-all hover:-translate-y-0.5 hover:border-[#5c1838] ${
        esOtraSucursal ? "bg-[#faf7f3]" : "bg-white"
      }`}
    >
      {patient.fotoUrl ? (
        <Image
          src={patient.fotoUrl}
          alt={`Foto de ${patient.nombre}`}
          width={52}
          height={52}
          className="mx-auto mb-2 block h-[52px] w-[52px] rounded-full object-cover ring-2 ring-[#e8e0d8] transition-transform duration-200 ease-out group-hover:scale-[1.3]"
          sizes="52px"
          unoptimized
        />
      ) : (
        <span className="mb-2 block text-[52px] leading-none" aria-hidden>
          {emoji(patient.especie)}
        </span>
      )}
      <div className="text-base font-bold capitalize text-[#1a1a1a]">
        {patient.nombre}
      </div>
      <div className="mt-1 text-xs text-[#888]">
        {patient.raza || patient.especie}
      </div>
      <div className="mt-1.5 text-xs font-medium capitalize text-[#5c1838]">
        👤 {formatDueñosCorto(patient.dueños)}
      </div>
      {!esPacienteActivo(patient) ? (
        <div className="mt-2 flex justify-center">
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-800">
            Archivado
          </span>
        </div>
      ) : null}
      {esOtraSucursal ? (
        <div className="mt-2 flex justify-center">
          <span className="rounded-full bg-[#efe3d4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8b5e3c]">
            📍 {patient.sucursal}
          </span>
        </div>
      ) : null}
      {(patient.internado ||
        patient.esExterno ||
        patient.esUnicaConsulta) && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {patient.internado ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
              Internado
            </span>
          ) : null}
          {patient.esExterno ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Externo
            </span>
          ) : null}
          {patient.esUnicaConsulta ? (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-800">
              Única consulta
            </span>
          ) : null}
        </div>
      )}
      <span
        className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass}`}
      >
        {patient.especie}
      </span>
    </Link>
  );
}
