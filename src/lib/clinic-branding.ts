/** Nombre comercial en PDFs y documentos impresos. */
export const ZOOVET_CLINIC_NAME = "Zoovet";

/**
 * Dirección o texto de ubicación para el encabezado del PDF.
 * Editar aquí según la clínica.
 */
export const ZOOVET_DOCUMENT_ADDRESS =
  "Av. Roca 1844 · Villegas 287 · Mitre 1344, Río Negro, Argentina";

/** Teléfono de contacto (PDF y pie de página). */
export const ZOOVET_CLINIC_PHONE = "2984868120";

/** Sedes para pie de página (PDF y carnet público web). */
export const ZOOVET_FOOTER_BRANCHES = [
  { address: "Av. Roca 1844", phone: "298 4428052" },
  { address: "Villegas 287", phone: "298 4420114" },
  { address: "Mitre 1344", phone: "298 5308554" },
] as const;
