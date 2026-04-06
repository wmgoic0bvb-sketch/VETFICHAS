import { jsPDF } from "jspdf";
import { formatFecha } from "@/lib/date-utils";
import {
  applyZoovetFooterToAllPages,
  drawBrandRule,
  drawDataRow,
  drawSectionTitle,
  drawZoovetPatientCover,
  loadLogo,
  M,
  PAGE_BG,
  safeFilePart,
} from "@/lib/pdf-zoovet-shared";
import type { Consulta } from "@/types/patient";
import type { Especie } from "@/types/patient";

export type ConsultaPdfPatient = {
  nombre: string;
  especie: Especie;
  raza: string;
};

export async function exportConsultaPdf(
  patient: ConsultaPdfPatient,
  c: Consulta,
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  const logo = await loadLogo();
  let y = drawZoovetPatientCover(doc, pageW, logo, patient, {
    label: "Veterinario/a",
    value: c.veterinario ?? "",
  });

  y = drawSectionTitle(
    doc,
    pageW,
    "Detalle de la consulta",
    y,
    c.fecha ? formatFecha(c.fecha) : undefined,
  );

  y = drawBrandRule(doc, pageW, y, true);

  const rows: Array<[string, string | undefined | null]> = [
    ["Tipo", c.tipo],
    ["Motivo", c.motivo],
    ["Veterinario/a", c.veterinario],
    ["Peso", c.peso ? `${c.peso} kg` : undefined],
    ["Temperatura", c.temp ? `${c.temp} °C` : undefined],
    ["Diagnóstico", c.diag],
    ["Tratamiento", c.trat],
    ["Medicación", c.meds],
  ];

  let rowIndex = 0;
  for (const [label, value] of rows) {
    if (value) {
      y = drawDataRow(doc, pageW, label, value, y, rowIndex);
      rowIndex++;
    }
  }

  y += 1;
  y = drawBrandRule(doc, pageW, y, true);

  applyZoovetFooterToAllPages(doc);

  const fname = `consulta-zoovet-${safeFilePart(patient.nombre)}.pdf`;
  doc.save(fname);
}
