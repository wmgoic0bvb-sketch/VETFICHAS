"use client";

import styles from "./lottie-loading.module.css";

const SIZE_CLASS: Record<number, string> = {
  28: styles.size28,
  48: styles.size48,
  56: styles.size56,
  80: styles.size80,
  120: styles.size120,
  140: styles.size140,
};

export function LottieSpinner({
  className,
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  const sizeClass = SIZE_CLASS[size] ?? styles.size120;

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      aria-hidden
    >
      <div className={[styles.threeBody, sizeClass].join(" ")}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
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
    >
      <LottieSpinner size={28} />
    </div>
  );
}
