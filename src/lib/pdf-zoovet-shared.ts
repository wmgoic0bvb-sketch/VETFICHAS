import { jsPDF } from "jspdf";
import { ZOOVET_FOOTER_BRANCHES } from "@/lib/clinic-branding";

/** Margen horizontal (mm). */
export const M = 20;
export const BRAND: [number, number, number] = [158, 43, 98];
export const BRAND_TINT: [number, number, number] = [251, 244, 248];
export const DIVIDER: [number, number, number] = [220, 195, 210];
export const INK: [number, number, number] = [20, 20, 20];
export const LABEL_COLOR: [number, number, number] = [90, 60, 78];
export const WHITE: [number, number, number] = [255, 255, 255];
export const PAGE_BG: [number, number, number] = [255, 255, 255];

const LOGO_PATH = "/ZT_logo_blano.png";
export const LOGO_MAX_W = 58;
export const LOGO_MAX_H = 28;
export const LOGO_PAD = 6;
export const SUBHEADER_H = 22;
/** Franja inferior brand; espacio para sedes + fecha + contador. */
export const FOOTER_H = 32;

export function safeFilePart(s: string): string {
  return (
    s
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "-")
      .slice(0, 48)
      .trim() || "paciente"
  );
}

export async function loadLogo(): Promise<{
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

export function ensureY(doc: jsPDF, y: number, need: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - FOOTER_H - 6) {
    doc.addPage();
    doc.setFillColor(...PAGE_BG);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), pageH, "F");
    return M + 6;
  }
  return y;
}

export function measureFooterBranchBlock(
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

export function drawDataRow(
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
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(v, valueW - 4);
  const lineH = 5.8;
  const rowH = Math.max(13, lines.length * lineH + padV * 2);

  const nextY = ensureY(doc, y, rowH);

  if (index % 2 === 0) {
    doc.setFillColor(...BRAND_TINT);
    doc.rect(rowX, nextY, rowW, rowH, "F");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...LABEL_COLOR);
  doc.text(label, rowX + 3, nextY + padV + lineH * 0.72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(lines, valueX, nextY + padV + lineH * 0.72);

  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.25);
  doc.line(rowX, nextY + rowH, rowX + rowW, nextY + rowH);

  return nextY + rowH;
}

const FOOTER_BRANCH_SEP = "  ·  ";
const FOOTER_BRANCH_GAP_MM = 6;
const FOOTER_BRANCH_FONT_SIZES = [9, 8.5, 8, 7.5] as const;

/** Dibuja pie de página Zoovet en todas las páginas del documento. */
export function applyZoovetFooterToAllPages(doc: jsPDF): void {
  const pageW = doc.internal.pageSize.getWidth();
  const cx = pageW / 2;
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const ph = doc.internal.pageSize.getHeight();

    doc.setFillColor(...BRAND);
    doc.rect(0, ph - FOOTER_H, pageW, FOOTER_H, "F");

    const footerBandLeft = M;
    const footerBandRight = pageW - M;
    const footerBandW = footerBandRight - footerBandLeft;

    const footerZoneTop = ph - FOOTER_H + 4;
    const footerZoneBottom = ph - 4.5;
    const fyBranch = (footerZoneTop + footerZoneBottom) / 2;

    let branchFs: (typeof FOOTER_BRANCH_FONT_SIZES)[number] = 7.5;
    let blockWidths: { wLeft: number; wRight: number }[] = [];

    for (const fs of FOOTER_BRANCH_FONT_SIZES) {
      const widths = ZOOVET_FOOTER_BRANCHES.map((b) =>
        measureFooterBranchBlock(doc, b.address, b.phone, FOOTER_BRANCH_SEP, fs),
      );
      const rowW =
        widths.reduce((s, w) => s + w.wLeft + w.wRight, 0) +
        FOOTER_BRANCH_GAP_MM * (ZOOVET_FOOTER_BRANCHES.length - 1);
      if (rowW <= footerBandW) {
        branchFs = fs;
        blockWidths = widths;
        break;
      }
    }

    if (blockWidths.length === 0) {
      branchFs = 7.5;
      blockWidths = ZOOVET_FOOTER_BRANCHES.map((b) =>
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
      FOOTER_BRANCH_GAP_MM * (ZOOVET_FOOTER_BRANCHES.length - 1);
    let xCursor = footerBandLeft + (footerBandW - totalBranchRowW) / 2;

    for (let i = 0; i < ZOOVET_FOOTER_BRANCHES.length; i++) {
      const { wLeft, wRight } = blockWidths[i]!;
      const { address, phone } = ZOOVET_FOOTER_BRANCHES[i]!;
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
      if (i < ZOOVET_FOOTER_BRANCHES.length - 1) {
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
}

export type ZoovetPdfPatientHeader = {
  nombre: string;
  especie: string;
  raza: string;
};

/**
 * Cabecera brand + subheader paciente; columna derecha opcional (ej. veterinario).
 * Devuelve `y` inicial de contenido bajo el subheader.
 */
export function drawZoovetPatientCover(
  doc: jsPDF,
  pageW: number,
  logo: Awaited<ReturnType<typeof loadLogo>>,
  patient: ZoovetPdfPatientHeader,
  rightColumn?: { label: string; value: string },
): number {
  const LOGO_X = 6;
  const logoH = logo?.hMm ?? LOGO_MAX_H;
  const HEADER_H = logoH + LOGO_PAD * 2;

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, HEADER_H, "F");

  if (logo) {
    doc.addImage(logo.dataUrl, "PNG", LOGO_X, LOGO_PAD, logo.wMm, logo.hMm);
  }

  doc.setFillColor(245, 238, 242);
  doc.rect(0, HEADER_H, pageW, SUBHEADER_H, "F");

  doc.setFillColor(...BRAND);
  doc.rect(0, HEADER_H + SUBHEADER_H - 1, pageW, 1, "F");

  const especieLine = patient.raza?.trim()
    ? `${patient.especie}  ·  ${patient.raza}`
    : patient.especie;

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

  if (rightColumn?.value?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...LABEL_COLOR);
    doc.text(rightColumn.label.toUpperCase(), pageW - M, subY - 3.5, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(rightColumn.value.trim(), pageW - M, subY + 2.5, {
      align: "right",
    });
  }

  return HEADER_H + SUBHEADER_H + 10;
}

/** Barra lateral + título de sección; `titleRight` opcional (ej. fecha). */
export function drawSectionTitle(
  doc: jsPDF,
  pageW: number,
  title: string,
  y: number,
  titleRight?: string,
): number {
  let yy = ensureY(doc, y, 18);
  doc.setFillColor(...BRAND);
  doc.rect(M, yy - 1, 3, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...INK);
  doc.text(title, M + 7, yy + 5.5);

  if (titleRight?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...LABEL_COLOR);
    doc.text(titleRight.trim(), pageW - M, yy + 5.5, { align: "right" });
  }

  return yy + 14;
}

/** Línea horizontal brand (inicio o fin de bloque tipo tabla). */
export function drawBrandRule(
  doc: jsPDF,
  pageW: number,
  y: number,
  strong: boolean,
): number {
  const yy = ensureY(doc, y, 4);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(strong ? 0.6 : 0.35);
  doc.line(M, yy, pageW - M, yy);
  return yy + (strong ? 2 : 1);
}
