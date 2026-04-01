"use client";

export function PatientSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (q: string) => void;
}) {
  return (
    <div className="relative mb-5">
      <span
        className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-lg"
        aria-hidden
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nombre del paciente o dueño..."
        className="w-full rounded-2xl border-[1.5px] border-[#e8e0d8] bg-white py-3.5 pl-11 pr-[18px] text-[15px] outline-none transition-colors focus:border-[#2d6a4f]"
        autoComplete="off"
      />
    </div>
  );
}
