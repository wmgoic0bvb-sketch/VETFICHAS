import type { CSSProperties } from "react";

/** Opacidad del motivo (solo la capa SVG; el gradiente va debajo). Ajustá acá para ver el efecto al instante. */
export const CARNET_PAW_FILL_OPACITY = 0.018;

function carnetPawPatternDataUrl(): string {
  const o = CARNET_PAW_FILL_OPACITY;
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%235c1838' fill-opacity='${o}'%3E%3Cellipse cx='20' cy='18' rx='5' ry='6'/%3E%3Cellipse cx='32' cy='13' rx='4' ry='5'/%3E%3Cellipse cx='44' cy='13' rx='4' ry='5'/%3E%3Cellipse cx='56' cy='18' rx='5' ry='6'/%3E%3Cpath d='M38 22 C28 22 22 30 24 40 C26 50 34 56 38 56 C42 56 50 50 52 40 C54 30 48 22 38 22 Z'/%3E%3C/g%3E%3C/svg%3E`;
}

/**
 * Fondo del carnet público: huellas + gradiente (misma idea que `/login`, más suave).
 * Importante: `width`/`height` del SVG deben coincidir con el viewBox (80×80) o el mosaico se rompe.
 */
export const CARNET_PAW_PATTERN_BACKGROUND: CSSProperties = {
  backgroundImage: `url("${carnetPawPatternDataUrl()}"), linear-gradient(160deg, #faf8f5 0%, #efe8df 20%)`,
  backgroundRepeat: "repeat, no-repeat",
  backgroundPosition: "0 0, center",
  /** Mayor que 80px para que cada repetición del motivo quede más separada. */
  backgroundSize: "118px 118px, cover",
};
