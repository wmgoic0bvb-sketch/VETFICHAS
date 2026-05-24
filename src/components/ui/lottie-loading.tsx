"use client";

export function LottieSpinner({
  className,
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  const ringWidth = Math.max(3, Math.round(size / 14));
  const coreSize = Math.max(8, Math.round(size / 5));

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute rounded-full border-[#8B1A4A]/15 border-t-[#8B1A4A] animate-spin"
        style={{
          inset: ringWidth / 2,
          borderWidth: ringWidth,
        }}
      />
      <div
        className="absolute rounded-full border border-[#8B1A4A]/25"
        style={{
          inset: ringWidth * 2.1,
        }}
      />
      <div
        className="rounded-full bg-[#8B1A4A]/85 animate-pulse"
        style={{ width: coreSize, height: coreSize }}
      />
    </div>
  );
}

/**
 * Spinner para operaciones contra el servidor / base de datos.
 * Por defecto cubre el viewport; pasá `className` para overlay dentro de un modal (`absolute inset-0 …`).
 */
export function DbLoadingOverlay({
  show,
  label,
  className,
}: {
  show: boolean;
  label?: string;
  className?: string;
}) {
  if (!show) return null;
  return (
    <div
      className={
        className ??
        "fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px]"
      }
      role="status"
      aria-busy="true"
      aria-label={label ?? "Cargando"}
    >
      <LottieSpinner size={140} />
      {label ? (
        <p className="mt-2 text-sm font-medium text-white">{label}</p>
      ) : null}
    </div>
  );
}
