import type { PersonnelStatus, Submission, User } from "@prisma/client";
import { PERSONNEL_STATUS_LABELS } from "@/lib/constants";

export type ExportRow = {
  saram: string;
  nome: string;
  posto_grad: string;
  status: PersonnelStatus;
  status_label: string;
  setor_ad: string;
  pastas_ad: string;
  email: string;
  telefone: string;
  submitted_at: string;
};

export function toExportRow(
  submission: Submission & { user: User },
): ExportRow {
  return {
    saram: submission.user.saram,
    nome: submission.user.nome,
    posto_grad: submission.user.postoGrad ?? "",
    status: submission.status,
    status_label: PERSONNEL_STATUS_LABELS[submission.status],
    setor_ad: submission.setorAd,
    pastas_ad: submission.pastasAd.join("|"),
    email: submission.email ?? "",
    telefone: submission.telefone ?? "",
    submitted_at: submission.createdAt.toISOString(),
  };
}

/** Canonical CSV for AD script (semicolon-separated, UTF-8 with BOM). */
export function toCanonicalCsv(rows: ExportRow[]): string {
  const header = [
    "saram",
    "nome",
    "posto_grad",
    "status",
    "status_label",
    "setor_ad",
    "pastas_ad",
    "email",
    "telefone",
    "submitted_at",
  ];

  const escape = (v: string) => {
    if (/[;"\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };

  const lines = [
    header.join(";"),
    ...rows.map((r) =>
      [
        r.saram,
        r.nome,
        r.posto_grad,
        r.status,
        r.status_label,
        r.setor_ad,
        r.pastas_ad,
        r.email,
        r.telefone,
        r.submitted_at,
      ]
        .map((c) => escape(String(c)))
        .join(";"),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
