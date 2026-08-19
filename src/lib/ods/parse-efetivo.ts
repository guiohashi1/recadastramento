import * as XLSX from "xlsx";
import type { SourceSheet } from "@prisma/client";
import { canonicalPostoGrad } from "../postos";

export type EfetivoRow = {
  saram: string;
  nome: string;
  postoGrad: string | null;
  quadro: string | null;
  especialidade: string | null;
  sourceSheet: Exclude<SourceSheet, "MANUAL">;
  setorHint: string | null;
  rowNumber: number;
  sheetName: string;
};

export type ParseEfetivoResult = {
  rows: EfetivoRow[];
  errors: string[];
  warnings: string[];
};

function normHeader(h: unknown): string {
  return String(h ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function looksLikeSaram(v: string): boolean {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 5 && digits.length <= 8;
}

function findHeaderRow(matrix: unknown[][]): {
  index: number;
  map: Record<string, number>;
} | null {
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const row = matrix[i] ?? [];
    const map: Record<string, number> = {};
    row.forEach((cell, col) => {
      const h = normHeader(cell);
      if (h) map[h] = col;
    });
    if (map["SARAM"] != null && map["NOME"] != null) {
      return { index: i, map };
    }
  }
  return null;
}

function getByHeader(
  row: unknown[],
  map: Record<string, number>,
  ...names: string[]
): string {
  for (const name of names) {
    const col = map[name];
    if (col == null) continue;
    const val = cellStr(row[col]);
    if (val) return val;
  }
  return "";
}

/** Skip junk cells (e.g. leaked credentials pasted in spreadsheet). */
function isJunkValue(v: string): boolean {
  return /senha\s*:/i.test(v) || /login\s*:/i.test(v);
}

function parseSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  sourceSheet: Exclude<SourceSheet, "MANUAL">,
): { rows: EfetivoRow[]; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: EfetivoRow[] = [];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    errors.push(`Aba não encontrada: ${sheetName}`);
    return { rows, errors, warnings };
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  const header = findHeaderRow(matrix);
  if (!header) {
    errors.push(
      `Aba ${sheetName}: cabeçalho com SARAM e NOME não encontrado`,
    );
    return { rows, errors, warnings };
  }

  for (let r = header.index + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const saramRaw = getByHeader(row, header.map, "SARAM");
    if (!saramRaw || !looksLikeSaram(saramRaw)) continue;

    if (isJunkValue(saramRaw)) {
      warnings.push(`${sheetName} L${r + 1}: SARAM ignorado (conteúdo suspeito)`);
      continue;
    }

    const saram = saramRaw.replace(/\D/g, "") || saramRaw;
    let nome = getByHeader(row, header.map, "NOME");
    if (isJunkValue(nome)) {
      warnings.push(`${sheetName} L${r + 1}: nome suspeito ignorado`);
      nome = "";
    }
    if (!nome || nome.length < 3) {
      errors.push(`${sheetName} L${r + 1}: SARAM ${saram} sem NOME válido`);
      continue;
    }

    const postoRaw =
      getByHeader(row, header.map, "POSTO/GRAD", "POSTO/GRADUACAO", "POSTO") ||
      "";
    const postoGrad = postoRaw ? canonicalPostoGrad(postoRaw) : null;
    const quadro = getByHeader(row, header.map, "QUADRO") || null;
    const especialidade =
      getByHeader(row, header.map, "ESP", "ESPECIALIDADE") || null;
    let setorHint = getByHeader(row, header.map, "SETOR") || null;
    if (setorHint && isJunkValue(setorHint)) setorHint = null;

    rows.push({
      saram,
      nome,
      postoGrad,
      quadro,
      especialidade,
      sourceSheet,
      setorHint,
      rowNumber: r + 1,
      sheetName,
    });
  }

  return { rows, errors, warnings };
}

export function parseEfetivoOds(filePath: string): ParseEfetivoResult {
  const workbook = XLSX.readFile(filePath, { type: "file", cellDates: true });
  const errors: string[] = [];
  const warnings: string[] = [];
  const all: EfetivoRow[] = [];

  const ativa = parseSheet(workbook, "EFETIVO ATIVA", "ATIVA");
  const pttc = parseSheet(workbook, "EFETIVO PTTC", "PTTC");

  errors.push(...ativa.errors, ...pttc.errors);
  warnings.push(...ativa.warnings, ...pttc.warnings);
  all.push(...ativa.rows, ...pttc.rows);

  const seen = new Map<string, EfetivoRow>();
  const duplicates = new Set<string>();

  for (const row of all) {
    if (seen.has(row.saram)) {
      duplicates.add(row.saram);
      const prev = seen.get(row.saram)!;
      errors.push(
        `SARAM duplicado ${row.saram}: ${prev.sheetName} L${prev.rowNumber} e ${row.sheetName} L${row.rowNumber}`,
      );
    } else {
      seen.set(row.saram, row);
    }
  }

  const rows = all.filter((r) => !duplicates.has(r.saram));

  return { rows, errors, warnings };
}
