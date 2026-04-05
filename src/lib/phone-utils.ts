/** Máximo de dígitos guardados en ficha (celular AR sin prefijo internacional). */
export const PHONE_INPUT_MAX_DIGITS = 10;

/** Solo dígitos, recortado a {@link PHONE_INPUT_MAX_DIGITS} (para inputs controlados). */
export function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, PHONE_INPUT_MAX_DIGITS);
}

/**
 * Valor inicial del input al editar: datos viejos con +54 o 15 se reducen a 10 dígitos locales.
 */
export function normalizeStoredPhoneForEdit(stored: string): string {
  let d = stored.replace(/\D/g, "");
  if (d.startsWith("15") && d.length >= 11) {
    d = d.slice(2);
  }
  if (d.length > PHONE_INPUT_MAX_DIGITS) {
    d = d.startsWith("54") ? d.slice(-10) : d.slice(0, PHONE_INPUT_MAX_DIGITS);
  }
  return d.slice(0, PHONE_INPUT_MAX_DIGITS);
}

/**
 * Limpia el teléfono para `wa.me`: solo dígitos; si es celular AR en 10 dígitos locales,
 * antepone 549 (54 + 9). Datos viejos con prefijo 15 se normalizan quitando ese prefijo.
 */
export function sanitizePhoneForWhatsApp(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (!d) return null;

  if (d.startsWith("15") && d.length >= 12) {
    d = d.slice(2);
  }

  if (d.startsWith("54")) {
    return d.length >= 11 ? d : null;
  }

  if (d.length === 10) {
    return `549${d}`;
  }

  return d.length >= 8 ? d : null;
}

export function buildWhatsAppUrl(
  phoneRaw: string,
  message: string,
): string | null {
  const n = sanitizePhoneForWhatsApp(phoneRaw);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
