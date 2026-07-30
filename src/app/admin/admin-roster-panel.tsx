import Link from "next/link";
import {
  buildAdminHref,
  type AdminRosterResult,
  type AdminRosterView,
  sourceSheetLabel,
} from "@/lib/admin/roster";
import { labelFromAdGroup } from "@/lib/catalogs";

const TABS: Array<{ view: AdminRosterView; label: string }> = [
  { view: "pendentes", label: "Pendentes" },
  { view: "enviados", label: "Enviados" },
  { view: "todos", label: "Todos" },
];

type Props = {
  roster: AdminRosterResult;
};

export function AdminRosterPanel({ roster }: Props) {
  const { filters, rows, viewCounts, postos } = roster;

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-1" aria-label="Filtro do efetivo">
            {TABS.map((tab) => {
              const active = tab.view === filters.view;
              const count = viewCounts[tab.view];
              return (
                <Link
                  key={tab.view}
                  href={buildAdminHref({ ...filters, view: tab.view })}
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
        </div>

        <form
          method="get"
          action="/admin"
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <input type="hidden" name="view" value={filters.view} />
          <select
            name="posto"
            defaultValue={filters.posto}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm sm:w-48"
            aria-label="Filtrar por posto/graduação"
          >
            <option value="">Todos os postos</option>
            {postos.map((posto) => (
              <option key={posto} value={posto}>
                {posto}
              </option>
            ))}
          </select>
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Buscar nome, SARAM, setor…"
            className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm sm:max-w-xs sm:flex-1"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Aplicar filtros
          </button>
          {filters.q || filters.posto ? (
            <Link
              href={buildAdminHref({
                view: filters.view,
                q: "",
                posto: "",
              })}
              className="text-sm text-slate-500 underline-offset-2 hover:underline"
            >
              Limpar
            </Link>
          ) : null}
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2">SARAM</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Posto</th>
              <th className="px-3 py-2">Situação</th>
              <th className="px-3 py-2">Setor</th>
              <th className="px-3 py-2">Detalhe</th>
              <th className="px-3 py-2">Enviado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{row.saram}</td>
                <td className="px-3 py-2">{row.nome}</td>
                <td className="px-3 py-2 text-slate-700">
                  {row.postoGrad || "—"}
                </td>
                <td className="px-3 py-2">
                  {row.submitted ? (
                    <span className="inline-block rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-900">
                      Enviado
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
                    <span className="text-slate-400">Ainda não enviou</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap text-slate-600">
                  {row.submission
                    ? row.submission.createdAt.toLocaleString("pt-BR", {
                        timeZone: "America/Recife",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  {filters.q || filters.posto
                    ? "Nenhum resultado para os filtros atuais."
                    : filters.view === "pendentes"
                      ? "Ninguém pendente — todos já enviaram."
                      : filters.view === "enviados"
                        ? "Nenhuma submissão ainda."
                        : "Nenhum militar ativo no efetivo."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        Exibindo {rows.length} de {viewCounts[filters.view]}
        {filters.posto ? ` · posto ${filters.posto}` : null}
        {filters.q ? ` · busca “${filters.q}”` : null}
      </p>
    </section>
  );
}
