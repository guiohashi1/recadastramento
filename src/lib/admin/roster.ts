import type { Submission, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PERSONNEL_STATUS_LABELS } from "@/lib/constants";
import { labelFromAdGroup } from "@/lib/ad-group";
import {
  canonicalPostoGrad,
  isCivilEmployeePosto,
  sortPostos,
} from "@/lib/postos";
import {
  applyAdminFilters,
  parseAdminFilters,
  type AdminRosterResult,
  type AdminRosterRow,
  type AdminRosterTipo,
  type AdminRosterView,
} from "@/lib/admin/roster-client";

export type {
  AdminFilters,
  AdminRosterResult,
  AdminRosterRow,
  AdminRosterTipo,
  AdminRosterView,
} from "@/lib/admin/roster-client";

export {
  applyAdminFilters,
  buildAdminHref,
  buildAdExportHref,
  buildExportHref,
  formatRosterId,
  matchesRosterQuery,
  parseAdminFilters,
  parseAdminRosterTipo,
  parseAdminRosterView,
  parseExportRosterView,
  sourceSheetLabel,
} from "@/lib/admin/roster-client";

type UserWithSubs = User & {
  submissions: Submission[];
  civilProfile: { id: string } | null;
};

function toRow(user: UserWithSubs): AdminRosterRow {
  const submission = user.submissions[0] ?? null;
  const postoGrad = user.postoGrad
    ? canonicalPostoGrad(user.postoGrad)
    : null;
  const isCivil =
    Boolean(user.civilProfile) || isCivilEmployeePosto(user.postoGrad ?? "");
  return {
    userId: user.id,
    saram: user.saram,
    nome: user.nome,
    postoGrad,
    setorHint: user.setorHint,
    sourceSheet: user.sourceSheet,
    tipo: isCivil ? "civil" : "militar",
    idKind: user.civilProfile ? "cpf" : "saram",
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

function matchesTipo(row: AdminRosterRow, tipo: AdminRosterTipo): boolean {
  if (tipo === "todos") return true;
  return row.tipo === tipo;
}

function matchesPosto(row: AdminRosterRow, posto: string): boolean {
  if (!posto) return true;
  return canonicalPostoGrad(row.postoGrad ?? "") === canonicalPostoGrad(posto);
}

export async function getAdminRoster(options: {
  view?: string | null;
  q?: string | null;
  posto?: string | null;
  tipo?: string | null;
  defaultView?: AdminRosterView;
  defaultTipo?: AdminRosterTipo;
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
  const scoped = allRows
    .filter((r) => matchesTipo(r, filters.tipo))
    .filter((r) => matchesPosto(r, filters.posto));

  const militares = scoped.filter((r) => r.tipo === "militar");
  const civis = scoped.filter((r) => r.tipo === "civil");
  const enviados = scoped.filter((r) => r.submitted).length;
  const pendentes = militares.filter((r) => !r.submitted).length;
  const enviadosMilitares = militares.filter((r) => r.submitted).length;
  const denom = filters.tipo === "civil" ? civis.length : militares.length;
  const enviadosParaPct =
    filters.tipo === "civil" ? enviados : enviadosMilitares;

  const postos = sortPostos([
    ...new Set(
      scoped
        .map((r) => r.postoGrad?.trim())
        .filter((p): p is string => Boolean(p)),
    ),
  ]);

  const rows = applyAdminFilters(allRows, filters);

  return {
    filters,
    postos,
    stats: {
      total: scoped.length,
      militares: militares.length,
      civis: civis.length,
      enviados,
      pendentes,
      pct: denom === 0 ? 0 : Math.round((enviadosParaPct / denom) * 100),
    },
    viewCounts: {
      pendentes,
      enviados,
      todos: scoped.length,
    },
    rows,
  };
}
