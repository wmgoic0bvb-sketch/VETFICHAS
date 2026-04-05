"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LOTTIE_SRC = "https://lottie.host/2cacf7a1-146e-4a9b-85e4-72b2bb5ad0fc/wjGU87hC46.lottie";

export function LottieSpinner({
  className,
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <DotLottieReact src={LOTTIE_SRC} loop autoplay />
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
