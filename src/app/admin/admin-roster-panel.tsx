"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { labelFromAdGroup } from "@/lib/ad-group";
import { formatPostoLabel } from "@/lib/postos";
import {
  buildAdminHref,
  buildAdExportHref,
  buildExportHref,
  formatRosterId,
  matchesRosterQuery,
  type AdminRosterResult,
  type AdminRosterTipo,
  type AdminRosterView,
  sourceSheetLabel,
} from "@/lib/admin/roster-client";

const TIPO_TABS: Array<{ tipo: AdminRosterTipo; label: string }> = [
  { tipo: "militar", label: "Militar" },
  { tipo: "civil", label: "Servidor civil" },
  { tipo: "todos", label: "Todos" },
];

type Props = {
  roster: AdminRosterResult;
  initialQuery?: string;
};

export function AdminRosterPanel({ roster, initialQuery = "" }: Props) {
  const { filters, rows, viewCounts, postos } = roster;
  const [query, setQuery] = useState(initialQuery);
  const isCivil = filters.tipo === "civil";

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, filters.tipo, filters.view, filters.posto]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const trimmed = query.trim();
      if (trimmed) url.searchParams.set("q", trimmed);
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesRosterQuery(row, query)),
    [rows, query],
  );

  const exportFilters = { ...filters, q: query.trim() };

  const viewTabs: Array<{ view: AdminRosterView; label: string }> = isCivil
    ? [
        { view: "enviados", label: "Enviaram o termo" },
        { view: "todos", label: "Cadastrados" },
      ]
    : [
        { view: "pendentes", label: "Pendentes" },
        { view: "enviados", label: "Enviados" },
        { view: "todos", label: "Todos" },
      ];

  const idColumn =
    filters.tipo === "militar"
      ? "SARAM"
      : "SARAM / CPF";

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-3">
        <nav className="flex flex-wrap gap-1" aria-label="Tipo de efetivo">
          {TIPO_TABS.map((tab) => {
            const active = tab.tipo === filters.tipo;
            const nextView =
              tab.tipo === "civil" && filters.view === "pendentes"
                ? "enviados"
                : filters.view;
            return (
              <Link
                key={tab.tipo}
                href={buildAdminHref({
                  ...filters,
                  tipo: tab.tipo,
                  view: nextView,
                  posto: "",
                  q: "",
                })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap gap-1" aria-label="Situação do envio">
            {viewTabs.map((tab) => {
              const active = tab.view === filters.view;
              const count = viewCounts[tab.view];
              return (
                <Link
                  key={tab.view}
                  href={buildAdminHref({ ...filters, view: tab.view, q: "" })}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active
                      ? "bg-teal-800 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}{" "}
                  <span className={active ? "text-teal-100" : "text-slate-400"}>
                    ({count})
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {postos.length > 1 ? (
              <label className="sr-only" htmlFor="admin-posto">
                Posto
              </label>
            ) : null}
            {postos.length > 1 ? (
              <select
                id="admin-posto"
                value={filters.posto}
                onChange={(e) => {
                  window.location.assign(
                    buildAdminHref({
                      ...filters,
                      posto: e.target.value,
                      q: "",
                    }),
                  );
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm sm:w-64"
                aria-label="Filtrar por posto/graduação"
              >
                <option value="">Todos os postos</option>
                {postos.map((posto) => (
                  <option key={posto} value={posto}>
                    {formatPostoLabel(posto)}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nome, SARAM, CPF ou setor…"
              className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm sm:w-64"
              aria-label="Buscar na lista"
            />
            {query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sm text-slate-500 underline-offset-2 hover:underline"
              >
                Limpar busca
              </button>
            ) : null}
            <a
              href={buildAdExportHref("csv")}
              className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              CSV AD
            </a>
            <a
              href={buildAdExportHref("json")}
              className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              JSON AD
            </a>
            <span className="hidden text-slate-300 sm:inline" aria-hidden>
              |
            </span>
            <a
              href={buildExportHref(exportFilters, "csv")}
              className="text-sm text-slate-600 underline-offset-2 hover:underline"
            >
              CSV desta lista
            </a>
            <a
              href={buildExportHref(exportFilters, "json")}
              className="text-sm text-slate-600 underline-offset-2 hover:underline"
            >
              JSON desta lista
            </a>
          </div>
        </div>

        {isCivil ? (
          <p className="text-xs text-slate-500">
            Servidor civil: quem veio da planilha (posto Civil) e quem se
            cadastrou com CPF. Não entra no script AD.
          </p>
        ) : filters.tipo === "todos" ? (
          <p className="text-xs text-slate-500">
            Pendentes é só militar. Servidor civil (planilha ou cadastro) fica
            na aba própria e fora do CSV AD.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            CSV AD exporta militares que já enviaram o termo, sem filtro desta
            tela. Servidor civil não entra.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              {filters.tipo === "todos" ? (
                <th className="px-3 py-2">Tipo</th>
              ) : null}
              <th className="px-3 py-2">{idColumn}</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Posto</th>
              <th className="px-3 py-2">Envio</th>
              <th className="px-3 py-2">Setor</th>
              <th className="px-3 py-2">Detalhe</th>
              <th className="px-3 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.userId} className="border-b border-slate-100">
                {filters.tipo === "todos" ? (
                  <td className="px-3 py-2">
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {row.tipo === "civil" ? "Servidor civil" : "Militar"}
                    </span>
                  </td>
                ) : null}
                <td className="px-3 py-2 font-mono text-xs">
                  {formatRosterId(row)}
                </td>
                <td className="px-3 py-2">{row.nome}</td>
                <td className="px-3 py-2 text-slate-700">
                  {row.postoGrad ? formatPostoLabel(row.postoGrad) : "—"}
                </td>
                <td className="px-3 py-2">
                  {row.submitted ? (
                    <span className="inline-block rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-900">
                      Enviado
                    </span>
                  ) : row.tipo === "civil" && row.idKind === "cpf" ? (
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Cadastro só
                    </span>
                  ) : (
                    <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-700">
                  {row.submission ? (
                    <>
                      <span className="font-medium">
                        {row.submission.setorLabel}
                      </span>
                      <span className="mt-0.5 block font-mono text-slate-500">
                        {row.submission.setorAd}
                      </span>
                    </>
                  ) : (
                    <>
                      {row.setorHint || "—"}
                      <span className="mt-0.5 block text-slate-400">
                        {sourceSheetLabel(row.sourceSheet)}
                      </span>
                    </>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {row.submission ? (
                    <>
                      <span>{row.submission.statusLabel}</span>
                      <span className="mt-0.5 block font-mono text-slate-500">
                        {row.submission.pastasAd.length > 0
                          ? row.submission.pastasAd
                              .map((p) => labelFromAdGroup(p))
                              .join(" · ")
                          : "Sem pastas extras"}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">
                      {row.tipo === "civil"
                        ? "Ainda não preencheu o termo"
                        : "Ainda não enviou"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                  {row.submission
                    ? formatSubmissionDate(row.submission.createdAt)
                    : "—"}
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={filters.tipo === "todos" ? 8 : 7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  {emptyMessage(roster, query)}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        {visibleRows.length} de {rows.length}{" "}
        {rows.length === 1 ? "registro" : "registros"}
        {query.trim() ? " (busca instantânea)" : null}
      </p>
    </section>
  );
}

function formatSubmissionDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("pt-BR", { timeZone: "America/Recife" });
}

function emptyMessage(roster: AdminRosterResult, query: string): string {
  const { filters } = roster;
  if (query.trim()) return "Nenhum resultado para a busca atual.";
  if (filters.posto) return "Nenhum resultado para o posto selecionado.";
  if (filters.tipo === "civil") {
    return filters.view === "enviados"
      ? "Nenhum servidor civil enviou o termo ainda."
      : "Nenhum servidor civil cadastrado.";
  }
  if (filters.view === "pendentes") {
    return "Nenhum militar pendente — o efetivo já enviou.";
  }
  if (filters.view === "enviados") {
    return "Nenhuma submissão ainda.";
  }
  return "Nenhum usuário ativo nesta lista.";
}
