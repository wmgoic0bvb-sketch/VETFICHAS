import { jsPDF } from "jspdf";
import { formatFecha } from "@/lib/date-utils";
import { formatFechaHoraDisplay } from "@/lib/internacion-utils";
import {
  applyZoovetFooterToAllPages,
  drawBrandRule,
  drawDataRow,
  drawSectionTitle,
  drawZoovetPatientCover,
  ensureY,
  loadLogo,
  M,
  PAGE_BG,
  safeFilePart,
} from "@/lib/pdf-zoovet-shared";
import type { DatosInternacion } from "@/types/patient";
import type { Especie } from "@/types/patient";

export type InternacionPdfPatient = {
  nombre: string;
  especie: Especie;
  raza: string;
};

function ordenesCronologicas(
  ordenes: DatosInternacion["ordenes"],
): DatosInternacion["ordenes"] {
  return [...ordenes].sort((a, b) =>
    (a.fechaInicio || "").localeCompare(b.fechaInicio || ""),
  );
}

function evolucionesCronologicas(
  evoluciones: DatosInternacion["evoluciones"],
): DatosInternacion["evoluciones"] {
  return [...evoluciones].sort((a, b) =>
    a.fechaHora.localeCompare(b.fechaHora),
  );
}

function drawTextBlock(
  doc: jsPDF,
  pageW: number,
  y: number,
  body: string,
  title?: string,
): number {
  const pad = 4;
  const lineH = 5.8;
  const innerW = pageW - 2 * M - 6;
  const bodyTrim = body.trim();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const titleLines = title?.trim()
    ? doc.splitTextToSize(title.trim(), innerW)
    : [];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const bodyLines = bodyTrim ? doc.splitTextToSize(bodyTrim, innerW) : [];

  const gapAfterTitle =
    titleLines.length > 0 && bodyLines.length > 0 ? 3 : 0;
  if (titleLines.length === 0 && bodyLines.length === 0) return y;

  const blockH = Math.max(
    12,
    titleLines.length * lineH +
      gapAfterTitle +
      bodyLines.length * lineH +
      pad * 2,
  );
  const yy = ensureY(doc, y, blockH);

  doc.setFillColor(251, 244, 248);
  doc.rect(M, yy, pageW - 2 * M, blockH, "F");

  doc.setDrawColor(220, 195, 210);
  doc.setLineWidth(0.25);
  doc.line(M, yy + blockH, pageW - M, yy + blockH);

  let ly = yy + pad + lineH * 0.72;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(90, 60, 78);
  if (titleLines.length) {
    doc.text(titleLines, M + 3, ly);
    ly += titleLines.length * lineH + gapAfterTitle;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  if (bodyLines.length) {
    doc.text(bodyLines, M + 3, ly);
  }

  return yy + blockH + 2;
}

function ordenToParagraph(o: DatosInternacion["ordenes"][number]): string {
  const parts = [
    o.medicamentoOProcedimiento.trim(),
    o.viaAdministracion.trim() ? `Vía: ${o.viaAdministracion.trim()}` : "",
    o.dosis.trim() ? `Dosis: ${o.dosis.trim()}` : "",
    o.frecuencia.trim() ? `Frecuencia: ${o.frecuencia.trim()}` : "",
    o.fechaInicio ? `Inicio: ${formatFecha(o.fechaInicio)}` : "",
    o.fechaFin ? `Fin: ${formatFecha(o.fechaFin)}` : "",
    o.activa ? "Estado: activa" : "Estado: finalizada",
  ].filter(Boolean);
  return parts.join(" · ");
}

function evolucionToNarrativa(
  e: DatosInternacion["evoluciones"][number],
): string {
  const parts: string[] = [];
  parts.push(formatFechaHoraDisplay(e.fechaHora));
  if (e.veterinario.trim()) {
    parts.push(e.veterinario.trim());
  }
  parts.push(`Estado ${e.estadoGeneral}`);
  const constantes = [
    e.temperatura.trim() ? `T ${e.temperatura}°C` : "",
    e.frecuenciaCardiaca.trim() ? `FC ${e.frecuenciaCardiaca}` : "",
    e.frecuenciaRespiratoria.trim() ? `FR ${e.frecuenciaRespiratoria}` : "",
    e.peso?.trim() ? `peso ${e.peso} kg` : "",
  ].filter(Boolean);
  if (constantes.length) {
    parts.push(constantes.join(" · "));
  }
  if (e.observaciones.trim()) {
    parts.push(e.observaciones.trim());
  }
  return parts.join(" · ");
}

export async function exportInternacionPdf(
  patient: InternacionPdfPatient,
  datos: DatosInternacion,
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  const logo = await loadLogo();
  let y = drawZoovetPatientCover(doc, pageW, logo, patient, {
    label: "Veterinario responsable",
    value: datos.veterinarioResponsable ?? "",
  });

  y = drawSectionTitle(doc, pageW, "Internación — resumen clínico", y);
  y = drawBrandRule(doc, pageW, y - 2, true);

  const ingresoRows: Array<[string, string]> = [];
  if (datos.fechaIngreso) {
    const horaStr = datos.horaIngreso ? ` · ${datos.horaIngreso} hs` : "";
    ingresoRows.push(["Fecha de ingreso", `${formatFecha(datos.fechaIngreso)}${horaStr}`]);
  }
  if (datos.motivoIngreso?.trim())
    ingresoRows.push(["Motivo de ingreso", datos.motivoIngreso.trim()]);
  if (datos.veterinarioResponsable?.trim())
    ingresoRows.push([
      "Veterinario responsable",
      datos.veterinarioResponsable.trim(),
    ]);
  if (datos.fechaAlta?.trim()) {
    ingresoRows.push([
      "Fecha de alta",
      formatFechaHoraDisplay(datos.fechaAlta),
    ]);
  }

  let rowIdx = 0;
  for (const [label, val] of ingresoRows) {
    y = drawDataRow(doc, pageW, label, val, y, rowIdx);
    rowIdx++;
  }
  if (ingresoRows.length === 0) {
    y = drawDataRow(
      doc,
      pageW,
      "Nota",
      "Sin datos de ingreso registrados.",
      y,
      0,
    );
  }

  y += 1;
  y = drawBrandRule(doc, pageW, y, true);

  y += 4;
  y = drawSectionTitle(
    doc,
    pageW,
    "Diagnóstico presuntivo",
    y,
    datos.diagnosticoEditadoEn
      ? `Última edición: ${formatFechaHoraDisplay(datos.diagnosticoEditadoEn)}`
      : undefined,
  );
  y = drawBrandRule(doc, pageW, y - 2, true);
  if (datos.diagnosticoPrincipal.trim()) {
    y = drawTextBlock(doc, pageW, y, datos.diagnosticoPrincipal);
  } else {
    y = drawTextBlock(doc, pageW, y, "No hay diagnóstico registrado.");
  }

  y += 4;
  y = drawSectionTitle(doc, pageW, "Plan de tratamiento", y);
  y = drawBrandRule(doc, pageW, y - 2, true);

  const ordenes = ordenesCronologicas(datos.ordenes);
  if (ordenes.length === 0) {
    y = drawTextBlock(doc, pageW, y, "No hay órdenes registradas.");
  } else {
    ordenes.forEach((o, i) => {
      y = drawTextBlock(
        doc,
        pageW,
        y,
        ordenToParagraph(o),
        `Orden ${i + 1}`,
      );
    });
  }

  y += 4;
  y = drawSectionTitle(doc, pageW, "Evolución y evaluación", y);
  y = drawBrandRule(doc, pageW, y - 2, true);

  const evos = evolucionesCronologicas(datos.evoluciones);
  if (evos.length === 0) {
    y = drawDataRow(
      doc,
      pageW,
      "Nota",
      "No hay rondas de evolución registradas.",
      y,
      0,
    );
  } else {
    let evoRow = 0;
    for (let i = 0; i < evos.length; i++) {
      const e = evos[i]!;
      const label = `Ronda ${i + 1}`;
      const value = evolucionToNarrativa(e) || "—";
      y = drawDataRow(doc, pageW, label, value, y, evoRow);
      evoRow++;
    }
  }

  y += 1;
  y = drawBrandRule(doc, pageW, y, true);

  applyZoovetFooterToAllPages(doc);

  const fname = `internacion-zoovet-${safeFilePart(patient.nombre)}.pdf`;
  doc.save(fname);
}
