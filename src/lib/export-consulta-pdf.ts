import { jsPDF } from "jspdf";
import { formatFecha } from "@/lib/date-utils";
import type { Consulta } from "@/types/patient";
import type { Especie } from "@/types/patient";

// ─── Paleta formal de alto contraste ─────────────────────────────────────────
const M = 20;
const BRAND: [number, number, number] = [158, 43, 98];
const BRAND_TINT: [number, number, number] = [251, 244, 248];
const DIVIDER: [number, number, number] = [220, 195, 210];
const INK: [number, number, number] = [20, 20, 20];
const LABEL_COLOR: [number, number, number] = [90, 60, 78];
const WHITE: [number, number, number] = [255, 255, 255];
const PAGE_BG: [number, number, number] = [255, 255, 255];

const LOGO_PATH = "/ZT_logo_blano.png";
const LOGO_MAX_W = 58;
const LOGO_MAX_H = 28;

// El header se ajusta dinámicamente al alto del logo
const LOGO_PAD = 6; // padding arriba/abajo del logo
const SUBHEADER_H = 22; // franja crema con datos del paciente
/** Franja inferior brand; espacio para sedes centradas + fecha + contador. */
const FOOTER_H = 32;

export type ConsultaPdfPatient = {
  nombre: string;
  especie: Especie;
  raza: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeFilePart(s: string): string {
  return (
    s
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "-")
      .slice(0, 48)
      .trim() || "paciente"
  );
}

async function loadLogo(): Promise<{
  dataUrl: string;
  wMm: number;
  hMm: number;
} | null> {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth || 200;
        const nh = img.naturalHeight || 80;
        let wMm = LOGO_MAX_W;
        let hMm = (nh / nw) * LOGO_MAX_W;
        if (hMm > LOGO_MAX_H) {
          hMm = LOGO_MAX_H;
          wMm = (nw / nh) * LOGO_MAX_H;
        }
        resolve({ dataUrl, wMm, hMm });
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

function ensureY(doc: jsPDF, y: number, need: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - FOOTER_H - 6) {
    doc.addPage();
    doc.setFillColor(...PAGE_BG);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), pageH, "F");
    return M + 6;
  }
  return y;
}

/** Ancho del bloque dirección + teléfono (una sede) para el pie PDF. */
function measureFooterBranchBlock(
  doc: jsPDF,
  address: string,
  phone: string,
  sep: string,
  fontSize: number,
): { wLeft: number; wRight: number } {
  const leftStr = `${address}${sep}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  const wLeft = doc.getTextWidth(leftStr);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  const wRight = doc.getTextWidth(`Tel. ${phone}`);
  return { wLeft, wRight };
}

// ─── Fila de dato formal ──────────────────────────────────────────────────────

function drawDataRow(
  doc: jsPDF,
  pageW: number,
  label: string,
  value: string,
  y: number,
  index: number,
): number {
  const v = value.trim();
  if (!v) return y;

  const rowX = M;
  const rowW = pageW - 2 * M;
  const colLabel = 48;
  const valueX = rowX + colLabel;
  const valueW = rowW - colLabel;
  const padV = 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);            // era 9.5
  const lines = doc.splitTextToSize(v, valueW - 4);
  const lineH = 5.8;
  const rowH = Math.max(13, lines.length * lineH + padV * 2);

  y = ensureY(doc, y, rowH);

  // Fondo alterno suave
  if (index % 2 === 0) {
    doc.setFillColor(...BRAND_TINT);
    doc.rect(rowX, y, rowW, rowH, "F");
  }

  // Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);           // era 8
  doc.setTextColor(...LABEL_COLOR);
  doc.text(label, rowX + 3, y + padV + lineH * 0.72);

  // Valor
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);            // era 9.5
  doc.setTextColor(...INK);
  doc.text(lines, valueX, y + padV + lineH * 0.72);

  // Línea divisora inferior
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.25);
  doc.line(rowX, y + rowH, rowX + rowW, y + rowH);

  return y + rowH;
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function exportConsultaPdf(
  patient: ConsultaPdfPatient,
  c: Consulta,
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  // Fondo blanco
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  // ── CABECERA BRAND — altura = logo + padding ──────────────────────────────
  const logo = await loadLogo();
  const LOGO_X = 6;
  const logoH = logo?.hMm ?? LOGO_MAX_H;
  const HEADER_H = logoH + LOGO_PAD * 2;

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, HEADER_H, "F");

  if (logo) {
    doc.addImage(logo.dataUrl, "PNG", LOGO_X, LOGO_PAD, logo.wMm, logo.hMm);
  }

  // ── SUBHEADER: datos del paciente y veterinario ───────────────────────────
  doc.setFillColor(245, 238, 242);
  doc.rect(0, HEADER_H, pageW, SUBHEADER_H, "F");

  // Línea brand base del subheader
  doc.setFillColor(...BRAND);
  doc.rect(0, HEADER_H + SUBHEADER_H - 1, pageW, 1, "F");

  const especieLine =
    patient.raza?.trim()
      ? `${patient.especie}  ·  ${patient.raza}`
      : patient.especie;

  // Paciente — izquierda, alineado con el margen
  const subY = HEADER_H + SUBHEADER_H / 2 - 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...LABEL_COLOR);
  doc.text("PACIENTE", M, subY - 3.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(patient.nombre, M, subY + 2.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...LABEL_COLOR);
  doc.text(especieLine, M, subY + 8);

  // Veterinario — derecha, misma jerarquía
  if (c.veterinario) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...LABEL_COLOR);
    doc.text("VETERINARIO/A", pageW - M, subY - 3.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(c.veterinario, pageW - M, subY + 2.5, { align: "right" });
  }

  let y = HEADER_H + SUBHEADER_H + 10;

  // ── TÍTULO DE SECCIÓN ─────────────────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(M, y - 1, 3, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);          // era 11
  doc.setTextColor(...INK);
  doc.text("Detalle de la consulta", M + 7, y + 5.5);

  if (c.fecha) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);        // era 9
    doc.setTextColor(...LABEL_COLOR);
    doc.text(formatFecha(c.fecha), pageW - M, y + 5.5, { align: "right" });
  }

  y += 14;

  // Borde superior tabla
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.6);
  doc.line(M, y - 2, pageW - M, y - 2);

  // ── FILAS DE DATOS ────────────────────────────────────────────────────────
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

  // Borde inferior tabla
  y += 1;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.6);
  doc.line(M, y, pageW - M, y);

  // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
  const footerBranches = [
    { address: "Av. Roca 1844", phone: "298 4428052" },
    { address: "Villegas 287", phone: "298 4420114" },
    { address: "Mitre 1344", phone: "298 5308554" },
  ] as const;
  const FOOTER_BRANCH_SEP = "  ·  ";
  const FOOTER_BRANCH_GAP_MM = 6;
  const FOOTER_BRANCH_FONT_SIZES = [9, 8.5, 8, 7.5] as const;

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const ph = doc.internal.pageSize.getHeight();

    doc.setFillColor(...BRAND);
    doc.rect(0, ph - FOOTER_H, pageW, FOOTER_H, "F");

    const footerBandLeft = M;
    const footerBandRight = pageW - M;
    const footerBandW = footerBandRight - footerBandLeft;

    // Sede más abajo, centrada en vertical entre la parte superior del pie y la línea de fecha
    const footerZoneTop = ph - FOOTER_H + 4;
    const footerZoneBottom = ph - 4.5;
    const fyBranch = (footerZoneTop + footerZoneBottom) / 2;

    let branchFs: (typeof FOOTER_BRANCH_FONT_SIZES)[number] = 7.5;
    let blockWidths: { wLeft: number; wRight: number }[] = [];

    for (const fs of FOOTER_BRANCH_FONT_SIZES) {
      const widths = footerBranches.map((b) =>
        measureFooterBranchBlock(doc, b.address, b.phone, FOOTER_BRANCH_SEP, fs),
      );
      const rowW =
        widths.reduce((s, w) => s + w.wLeft + w.wRight, 0) +
        FOOTER_BRANCH_GAP_MM * (footerBranches.length - 1);
      if (rowW <= footerBandW) {
        branchFs = fs;
        blockWidths = widths;
        break;
      }
    }

    if (blockWidths.length === 0) {
      branchFs = 7.5;
      blockWidths = footerBranches.map((b) =>
        measureFooterBranchBlock(
          doc,
          b.address,
          b.phone,
          FOOTER_BRANCH_SEP,
          branchFs,
        ),
      );
    }

    const totalBranchRowW =
      blockWidths.reduce((s, w) => s + w.wLeft + w.wRight, 0) +
      FOOTER_BRANCH_GAP_MM * (footerBranches.length - 1);
    let xCursor = footerBandLeft + (footerBandW - totalBranchRowW) / 2;

    for (let i = 0; i < footerBranches.length; i++) {
      const { wLeft, wRight } = blockWidths[i];
      const { address, phone } = footerBranches[i];
      const leftStr = `${address}${FOOTER_BRANCH_SEP}`;
      const phoneStr = `Tel. ${phone}`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(branchFs);
      doc.setTextColor(230, 195, 215);
      doc.text(leftStr, xCursor, fyBranch);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(branchFs);
      doc.setTextColor(...WHITE);
      doc.text(phoneStr, xCursor + wLeft, fyBranch);

      xCursor += wLeft + wRight;
      if (i < footerBranches.length - 1) {
        xCursor += FOOTER_BRANCH_GAP_MM;
      }
    }

    const fyMeta = ph - 2;
    if (p === totalPages) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(195, 155, 180);
      doc.text(
        `Documento generado el ${new Date().toLocaleString("es-AR")}`,
        cx,
        fyMeta,
        { align: "center" },
      );
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(215, 175, 200);
    doc.text(`${p} / ${totalPages}`, pageW - M, fyMeta, {
      align: "right",
    });
  }

  const fname = `consulta-zoovet-${safeFilePart(patient.nombre)}.pdf`;
  doc.save(fname);
}
