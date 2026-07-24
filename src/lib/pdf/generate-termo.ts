import fs from "fs";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { PersonnelStatus } from "@prisma/client";
import { PERSONNEL_STATUS_LABELS } from "@/lib/constants";
import { labelFromAdGroup } from "@/lib/catalogs";

export type TermoPdfInput = {
  nome: string;
  postoGrad: string;
  saram: string;
  identidade?: string | null;
  email?: string | null;
  telefone?: string | null;
  status: PersonnelStatus;
  setorAd: string;
  pastasAd: string[];
  /** Data/hora em que o PDF está sendo gerado */
  generatedAt?: Date;
  /** OM impressa no formulário (padrão HARF) */
  om?: string;
};

/** Dimensões do render de calibração (scale 1.5 com rotation 90). */
const IMG_W = 893;
const IMG_H = 1263;
const PAGE_W = 595.28;
const PAGE_H = 841.89;

const TEMPLATE_FILE = "TERMO DE COMPROMISSO 2026_rotated.pdf";

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "data", ...parts);
}

/** Converte coordenadas da imagem calibrada (origem topo-esquerda) → PDF (origem baixo-esquerda). */
function fromImg(ix: number, iy: number): { x: number; y: number } {
  return {
    x: (ix / IMG_W) * PAGE_W,
    y: PAGE_H - (iy / IMG_H) * PAGE_H,
  };
}

function clampText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
): string {
  let value = text.trim();
  if (!value) return "";
  while (value.length > 1 && font.widthOfTextAtSize(value, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return value;
}

function drawField(
  page: PDFPage,
  font: PDFFont,
  text: string,
  ix: number,
  iy: number,
  size: number,
  maxWidth: number,
) {
  const value = clampText(font, text, size, maxWidth);
  if (!value) return;
  const { x, y } = fromImg(ix, iy);
  page.drawText(value, {
    x,
    y,
    size,
    font,
    color: rgb(0.05, 0.05, 0.05),
  });
}

function formatLocalDate(date: Date): string {
  // America/Recife via parts
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Recife",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);

  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const monthNum = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const monthName = MONTHS_PT[monthNum - 1] ?? "";

  return `Recife-PE, ${day} de ${monthName} de ${year}.`;
}

function addAnnexPage(
  pdf: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  input: TermoPdfInput,
  generatedAt: Date,
) {
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const margin = 50;
  let y = 790;

  page.drawText("ANEXO — DADOS PARA ATUALIZAÇÃO DE ACESSO (AD)", {
    x: margin,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.07, 0.37, 0.37),
  });
  y -= 22;
  page.drawText(
    "Complemento ao Anexo IV (não altera o modelo oficial do Termo).",
    { x: margin, y, size: 9, font, color: rgb(0.35, 0.4, 0.42) },
  );
  y -= 28;

  const lines: Array<[string, string]> = [
    ["Nome", input.nome],
    ["SARAM", input.saram],
    ["Posto/Graduação", input.postoGrad || "—"],
    ["Status", PERSONNEL_STATUS_LABELS[input.status]],
    [
      "Setor principal",
      `${labelFromAdGroup(input.setorAd)} (${input.setorAd})`,
    ],
    ["E-mail", input.email?.trim() || "—"],
    ["Telefone/Ramal", input.telefone?.trim() || "—"],
    ["CPF", input.identidade?.trim() || "—"],
    ["Gerado em", generatedAt.toLocaleString("pt-BR", { timeZone: "America/Recife" })],
  ];

  for (const [label, value] of lines) {
    page.drawText(`${label}:`, {
      x: margin,
      y,
      size: 10,
      font: fontBold,
    });
    const text = clampText(font, value, 10, 340);
    page.drawText(text, { x: margin + 150, y, size: 10, font });
    y -= 20;
  }

  y -= 8;
  page.drawText("Pastas de rede solicitadas:", {
    x: margin,
    y,
    size: 10,
    font: fontBold,
  });
  y -= 18;

  if (input.pastasAd.length === 0) {
    page.drawText("— Nenhuma pasta adicional —", {
      x: margin,
      y,
      size: 10,
      font,
    });
  } else {
    let pageRef = page;
    for (const pasta of input.pastasAd) {
      if (y < 60) {
        pageRef = pdf.addPage([PAGE_W, PAGE_H]);
        y = 790;
        pageRef.drawText("ANEXO — Pastas de rede (continuação)", {
          x: margin,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.07, 0.37, 0.37),
        });
        y -= 24;
      }
      const line = clampText(
        font,
        `• ${labelFromAdGroup(pasta)} (${pasta})`,
        10,
        480,
      );
      pageRef.drawText(line, { x: margin, y, size: 10, font });
      y -= 15;
    }
  }
}

/**
 * Gera o Termo usando as 3 páginas do modelo oficial (logo, tabelas, cláusulas)
 * como fundo, com os dados do usuário sobrepostos nas células em branco.
 */
export async function generateTermoPdf(
  input: TermoPdfInput,
): Promise<Uint8Array> {
  const generatedAt = input.generatedAt ?? new Date();
  const templateBytes = fs.readFileSync(dataPath(TEMPLATE_FILE));
  const src = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);

  const embeddedPages = await out.embedPages(src.getPages());

  for (let i = 0; i < embeddedPages.length; i++) {
    const ep = embeddedPages[i]!;
    const page = out.addPage([PAGE_W, PAGE_H]);

    // Modelo vem em landscape + /Rotate 90 → redesenha em A4 retrato
    page.drawPage(ep, {
      x: 0,
      y: PAGE_H,
      xScale: PAGE_W / ep.height,
      yScale: PAGE_H / ep.width,
      rotate: degrees(-90),
    });

    if (i === 0) {
      // Tabela de identificação (calibração via render 893×1263)
      // iy maior = mais abaixo na página
      drawField(page, font, input.nome, 310, 382, 10, 480);
      drawField(page, font, input.postoGrad || "", 310, 409, 10, 170);
      drawField(page, font, input.om ?? "HARF", 560, 409, 10, 220);
      // Campo "CPF:" do modelo oficial
      drawField(page, font, input.identidade?.trim() || "", 230, 438, 10, 200);
      drawField(page, font, input.email?.trim() || "", 560, 438, 10, 220);
    }

    if (i === 2) {
      // Cobre o placeholder "(Local), (dia) de (mês) de (ano)." e escreve a data real
      const coverTL = fromImg(500, 548);
      const coverBR = fromImg(830, 505);
      page.drawRectangle({
        x: coverTL.x,
        y: coverBR.y,
        width: coverBR.x - coverTL.x,
        height: coverTL.y - coverBR.y,
        color: rgb(1, 1, 1),
      });
      drawField(page, font, formatLocalDate(generatedAt), 505, 528, 10, 300);
    }
  }

  addAnnexPage(out, font, fontBold, input, generatedAt);
  return out.save();
}
