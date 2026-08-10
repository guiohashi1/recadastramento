import type {
  PersonnelStatus,
  SourceSheet,
  Submission,
  User,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PERSONNEL_STATUS_LABELS } from "@/lib/constants";
import { labelFromAdGroup } from "@/lib/catalogs";

export type AdminRosterView = "pendentes" | "enviados" | "todos";
export type AdminRosterTipo = "civil" | "militar" | "";

export type AdminFilters = {
  view: AdminRosterView;
  q: string;
  /** Match exato de posto/graduação; vazio = todos */
  posto: string;
  /** militar | civil | '' (todos) */
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
    enviados: number;
    pendentes: number;
    pct: number;
  };
  rows: AdminRosterRow[];
  /** Totais por aba (após filtros de posto/tipo, antes da busca) */
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

export function parseAdminRosterView(raw: string | undefined | null): AdminRosterView {
  if (raw === "enviados" || raw === "todos" || raw === "pendentes") return raw;
  return "pendentes";
}

/** Default `enviados` preserva o contrato do export AD quando não há `view`. */
export function parseExportRosterView(
  raw: string | undefined | null,
): AdminRosterView {
  if (raw === "enviados" || raw === "todos" || raw === "pendentes") return raw;
  return "enviados";
}

export function parseAdminRosterTipo(
  raw: string | undefined | null,
): AdminRosterTipo {
  if (raw === "civil" || raw === "militar") return raw;
  return "";
}

export function parseAdminFilters(input: {
  view?: string | null;
  q?: string | null;
  posto?: string | null;
  tipo?: string | null;
  /** Se true, ausência de view → enviados (API export). */
  defaultView?: AdminRosterView;
}): AdminFilters {
  const view =
    input.defaultView === "enviados"
      ? parseExportRosterView(input.view)
      : parseAdminRosterView(input.view);

  return {
    view,
    q: (input.q ?? "").trim(),
    posto: (input.posto ?? "").trim(),
    tipo: parseAdminRosterTipo(input.tipo),
  };
}

export function buildAdminHref(filters: AdminFilters): string {
  const params = new URLSearchParams();
  params.set("view", filters.view);
  if (filters.q) params.set("q", filters.q);
  if (filters.posto) params.set("posto", filters.posto);
  if (filters.tipo) params.set("tipo", filters.tipo);
  return `/admin?${params.toString()}`;
}

export function buildExportHref(
  filters: AdminFilters,
  format: "csv" | "json",
): string {
  const params = new URLSearchParams();
  params.set("format", format);
  params.set("view", filters.view);
  if (filters.q) params.set("q", filters.q);
  if (filters.posto) params.set("posto", filters.posto);
  if (filters.tipo) params.set("tipo", filters.tipo);
  return `/api/admin/export?${params.toString()}`;
}

type UserWithSubs = User & {
  submissions: Submission[];
  civilProfile: { id: string } | null;
};

function toRow(user: UserWithSubs): AdminRosterRow {
  const submission = user.submissions[0] ?? null;
  return {
    userId: user.id,
    saram: user.saram,
    nome: user.nome,
    postoGrad: user.postoGrad,
    setorHint: user.setorHint,
    sourceSheet: user.sourceSheet,
    tipo: user.civilProfile ? "civil" : "militar",
    submitted: Boolean(submission),
    submission: submission
      ? {
          id: submission.id,
          status: submission.status,
          statusLabel: PERSONNEL_STATUS_LABELS[submission.status],
          setorAd: submission.setorAd,
          setorLabel: labelFromAdGroup(submission.setorAd),
          pastasAd: submission.pastasAd,
          email: submission.email,
          telefone: submission.telefone,
          createdAt: submission.createdAt,
        }
      : null,
  };
}

function matchesQuery(row: AdminRosterRow, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.nome.toLowerCase().includes(q) ||
    row.saram.toLowerCase().includes(q) ||
    row.tipo.includes(q) ||
    (row.postoGrad?.toLowerCase().includes(q) ?? false) ||
    (row.setorHint?.toLowerCase().includes(q) ?? false) ||
    (row.submission?.setorAd.toLowerCase().includes(q) ?? false) ||
    (row.submission?.setorLabel.toLowerCase().includes(q) ?? false)
  );
}

function matchesPosto(row: AdminRosterRow, posto: string): boolean {
  if (!posto) return true;
  return (row.postoGrad ?? "") === posto;
}

function matchesTipo(row: AdminRosterRow, tipo: AdminRosterTipo): boolean {
  if (!tipo) return true;
  return row.tipo === tipo;
}

export function applyAdminFilters(
  rows: AdminRosterRow[],
  filters: AdminFilters,
): AdminRosterRow[] {
  return rows
    .filter((r) => matchesPosto(r, filters.posto))
    .filter((r) => matchesTipo(r, filters.tipo))
    .filter((r) =>
      filters.view === "pendentes"
        ? !r.submitted
        : filters.view === "enviados"
          ? r.submitted
          : true,
    )
    .filter((r) => matchesQuery(r, filters.q));
}

/**
 * Roster completo do efetivo ativo (USER) com submissão corrente, se houver.
 * ~centenas de registros — adequado para uma única query server-side.
 */
export async function getAdminRoster(options: {
  view?: string | null;
  q?: string | null;
  posto?: string | null;
  tipo?: string | null;
  defaultView?: AdminRosterView;
}): Promise<AdminRosterResult> {
  const filters = parseAdminFilters(options);

  const users = await prisma.user.findMany({
    where: { role: "USER", active: true },
    include: {
      civilProfile: { select: { id: true } },
      submissions: {
        where: { isCurrent: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ nome: "asc" }, { saram: "asc" }],
  });

  const allRows = users.map(toRow);

  const postos = [
    ...new Set(
      allRows
        .map((r) => r.postoGrad?.trim())
        .filter((p): p is string => Boolean(p)),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const afterScope = allRows
    .filter((r) => matchesPosto(r, filters.posto))
    .filter((r) => matchesTipo(r, filters.tipo));
  const enviados = afterScope.filter((r) => r.submitted).length;
  const total = afterScope.length;
  const pendentes = total - enviados;

  const rows = applyAdminFilters(allRows, filters);

  return {
    filters,
    postos,
    stats: {
      total,
      enviados,
      pendentes,
      pct: total === 0 ? 0 : Math.round((enviados / total) * 100),
    },
    viewCounts: {
      pendentes,
      enviados,
      todos: total,
    },
    rows,
  };
}
