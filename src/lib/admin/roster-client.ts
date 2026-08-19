import type { PersonnelStatus, SourceSheet } from "@prisma/client";
import { formatCpf } from "@/lib/cpf";
import { canonicalPostoGrad, comparePostoGrad } from "@/lib/postos";

export type AdminRosterView = "pendentes" | "enviados" | "todos";
/** `todos` = militar + civil. Pendentes só se aplica a militar. */
export type AdminRosterTipo = "civil" | "militar" | "todos";

export type AdminFilters = {
  view: AdminRosterView;
  q: string;
  posto: string;
  tipo: AdminRosterTipo;
};

export type AdminRosterRow = {
  userId: string;
  saram: string;
  nome: string;
  postoGrad: string | null;
  setorHint: string | null;
  sourceSheet: SourceSheet;
  tipo: "civil" | "militar";
  /** Cadastro CPF vs SARAM da planilha — ambos podem ser servidor civil. */
  idKind: "cpf" | "saram";
  submitted: boolean;
  submission: {
    id: string;
    status: PersonnelStatus;
    statusLabel: string;
    setorAd: string;
    setorLabel: string;
    pastasAd: string[];
    email: string | null;
    telefone: string | null;
    createdAt: Date;
  } | null;
};

export type AdminRosterResult = {
  filters: AdminFilters;
  postos: string[];
  stats: {
    total: number;
    militares: number;
    civis: number;
    enviados: number;
    /** Só militares sem envio — civis não entram neste censo. */
    pendentes: number;
    pct: number;
  };
  rows: AdminRosterRow[];
  viewCounts: {
    pendentes: number;
    enviados: number;
    todos: number;
  };
};

const SOURCE_SHEET_LABELS: Record<SourceSheet, string> = {
  ATIVA: "Ativa",
  PTTC: "PTTC",
  MANUAL: "Manual",
};

export function sourceSheetLabel(sheet: SourceSheet): string {
  return SOURCE_SHEET_LABELS[sheet];
}

export function formatRosterId(row: AdminRosterRow): string {
  if (row.idKind === "cpf") return formatCpf(row.saram);
  return row.saram;
}

export function parseAdminRosterView(
  raw: string | undefined | null,
): AdminRosterView {
  if (raw === "enviados" || raw === "todos" || raw === "pendentes") return raw;
  return "pendentes";
}

export function parseExportRosterView(
  raw: string | undefined | null,
): AdminRosterView {
  if (raw === "enviados" || raw === "todos" || raw === "pendentes") return raw;
  return "enviados";
}

export function parseAdminRosterTipo(
  raw: string | undefined | null,
  fallback: AdminRosterTipo,
): AdminRosterTipo {
  if (raw === "civil" || raw === "militar" || raw === "todos") return raw;
  if (raw === "") return "todos";
  return fallback;
}

export function parseAdminFilters(input: {
  view?: string | null;
  q?: string | null;
  posto?: string | null;
  tipo?: string | null;
  defaultView?: AdminRosterView;
  defaultTipo?: AdminRosterTipo;
}): AdminFilters {
  const tipo = parseAdminRosterTipo(input.tipo, input.defaultTipo ?? "todos");

  let view =
    input.defaultView === "enviados"
      ? parseExportRosterView(input.view)
      : parseAdminRosterView(input.view);

  if (tipo === "civil" && view === "pendentes") {
    view = "enviados";
  }

  return {
    view,
    q: (input.q ?? "").trim(),
    posto: canonicalPostoGrad((input.posto ?? "").trim()),
    tipo,
  };
}

export function buildAdminHref(filters: AdminFilters): string {
  const params = new URLSearchParams();
  params.set("view", filters.view);
  params.set("tipo", filters.tipo);
  if (filters.q) params.set("q", filters.q);
  if (filters.posto) params.set("posto", filters.posto);
  return `/admin?${params.toString()}`;
}

export function buildAdExportHref(format: "csv" | "json"): string {
  const params = new URLSearchParams();
  params.set("format", format);
  params.set("ad", "1");
  params.set("view", "enviados");
  params.set("tipo", "militar");
  return `/api/admin/export?${params.toString()}`;
}

export function buildExportHref(
  filters: AdminFilters,
  format: "csv" | "json",
): string {
  const params = new URLSearchParams();
  params.set("format", format);
  params.set("view", filters.view);
  params.set("tipo", filters.tipo);
  if (filters.q) params.set("q", filters.q);
  if (filters.posto) params.set("posto", filters.posto);
  return `/api/admin/export?${params.toString()}`;
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function matchesRosterQuery(row: AdminRosterRow, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const qDigits = digits(query);

  const haystacks = [
    row.nome,
    row.saram,
    row.postoGrad ?? "",
    row.setorHint ?? "",
    row.submission?.setorAd ?? "",
    row.submission?.setorLabel ?? "",
    row.idKind === "cpf" ? formatCpf(row.saram) : "",
  ];

  if (haystacks.some((h) => h.toLowerCase().includes(q))) return true;
  if (qDigits.length >= 3 && digits(row.saram).includes(qDigits)) return true;
  return false;
}

function matchesPosto(row: AdminRosterRow, posto: string): boolean {
  if (!posto) return true;
  return canonicalPostoGrad(row.postoGrad ?? "") === canonicalPostoGrad(posto);
}

function matchesTipo(row: AdminRosterRow, tipo: AdminRosterTipo): boolean {
  if (tipo === "todos") return true;
  return row.tipo === tipo;
}

export function applyAdminFilters(
  rows: AdminRosterRow[],
  filters: AdminFilters,
): AdminRosterRow[] {
  return rows
    .filter((r) => matchesPosto(r, filters.posto))
    .filter((r) => matchesTipo(r, filters.tipo))
    .filter((r) => {
      if (filters.view === "enviados") return r.submitted;
      if (filters.view === "pendentes") {
        return r.tipo === "militar" && !r.submitted;
      }
      return true;
    })
    .filter((r) => matchesRosterQuery(r, filters.q))
    .sort((a, b) => {
      const byPosto = comparePostoGrad(a.postoGrad ?? "", b.postoGrad ?? "");
      if (byPosto !== 0) return byPosto;
      const byNome = a.nome.localeCompare(b.nome, "pt-BR");
      if (byNome !== 0) return byNome;
      return a.saram.localeCompare(b.saram, "pt-BR");
    });
}
