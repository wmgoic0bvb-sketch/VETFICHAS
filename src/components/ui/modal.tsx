"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  overlayClassName = "",
  maxWidthClass = "max-w-[520px]",
  panelPaddingClass = "px-6 py-7",
  variant = "default",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  /** p. ej. z-[210] para apilar sobre otro modal */
  overlayClassName?: string;
  /** Ancho máximo del panel (p. ej. vista previa de imagen) */
  maxWidthClass?: string;
  /** Relleno del panel (p. ej. p-3 en vista solo imagen) */
  panelPaddingClass?: string;
  /** `bare`: solo contenido sobre el overlay, sin tarjeta blanca */
  variant?: "default" | "bare";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 ${overlayClassName}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          variant === "bare"
            ? `relative max-h-[90vh] w-auto overflow-y-auto ${maxWidthClass}`
            : `relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white shadow-xl ${panelPaddingClass} ${maxWidthClass}`
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
