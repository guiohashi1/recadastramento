import type { PersonnelStatus, Submission, User } from "@prisma/client";
import { PERSONNEL_STATUS_LABELS } from "@/lib/constants";
import type { AdminRosterRow } from "@/lib/admin/roster";
import { sourceSheetLabel } from "@/lib/admin/roster";

export type ExportRow = {
  situacao: "pendente" | "enviado";
  tipo: "civil" | "militar";
  saram: string;
  nome: string;
  posto_grad: string;
  source_sheet: string;
  status: PersonnelStatus | "";
  status_label: string;
  setor_ad: string;
  pastas_ad: string;
  email: string;
  telefone: string;
  submitted_at: string;
};

/** @deprecated Prefer toExportRowFromRoster — mantido para compatibilidade. */
export function toExportRow(
  submission: Submission & { user: User },
): ExportRow {
  return {
    situacao: "enviado",
    tipo: "militar",
    saram: submission.user.saram,
    nome: submission.user.nome,
    posto_grad: submission.user.postoGrad ?? "",
    source_sheet: sourceSheetLabel(submission.user.sourceSheet),
    status: submission.status,
    status_label: PERSONNEL_STATUS_LABELS[submission.status],
    setor_ad: submission.setorAd,
    pastas_ad: submission.pastasAd.join("|"),
    email: submission.email ?? "",
    telefone: submission.telefone ?? "",
    submitted_at: submission.createdAt.toISOString(),
  };
}

export function toExportRowFromRoster(row: AdminRosterRow): ExportRow {
  if (!row.submission) {
    return {
      situacao: "pendente",
      tipo: row.tipo,
      saram: row.saram,
      nome: row.nome,
      posto_grad: row.postoGrad ?? "",
      source_sheet: sourceSheetLabel(row.sourceSheet),
      status: "",
      status_label: "",
      setor_ad: "",
      pastas_ad: "",
      email: "",
      telefone: "",
      submitted_at: "",
    };
  }

  return {
    situacao: "enviado",
    tipo: row.tipo,
    saram: row.saram,
    nome: row.nome,
    posto_grad: row.postoGrad ?? "",
    source_sheet: sourceSheetLabel(row.sourceSheet),
    status: row.submission.status,
    status_label: row.submission.statusLabel,
    setor_ad: row.submission.setorAd,
    pastas_ad: row.submission.pastasAd.join("|"),
    email: row.submission.email ?? "",
    telefone: row.submission.telefone ?? "",
    submitted_at: row.submission.createdAt.toISOString(),
  };
}

const CSV_HEADERS = [
  "situacao",
  "tipo",
  "saram",
  "nome",
  "posto_grad",
  "source_sheet",
  "status",
  "status_label",
  "setor_ad",
  "pastas_ad",
  "email",
  "telefone",
  "submitted_at",
] as const;

/** Canonical CSV for AD script (semicolon-separated, UTF-8 with BOM). */
export function toCanonicalCsv(rows: ExportRow[]): string {
  const escape = (v: string) => {
    if (/[;"\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };

  const lines = [
    CSV_HEADERS.join(";"),
    ...rows.map((r) =>
      CSV_HEADERS.map((key) => escape(String(r[key] ?? ""))).join(";"),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function exportFilename(
  format: "csv" | "json",
  filters: { view: string; posto: string; tipo: string; ad?: boolean },
): string {
  if (filters.ad) {
    return `recadastramento-ad-militares-enviados.${format}`;
  }
  const parts = ["recadastramento", filters.view];
  if (filters.tipo) parts.push(filters.tipo);
  if (filters.posto) {
    parts.push(
      filters.posto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40),
    );
  }
  return `${parts.filter(Boolean).join("-")}.${format}`;
}
