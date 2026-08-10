import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildExportHref, getAdminRoster } from "@/lib/admin/roster";
import { logoutAdminAction } from "./actions";
import { AdminStats } from "./admin-stats";
import { AdminRosterPanel } from "./admin-roster-panel";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    q?: string;
    posto?: string;
    tipo?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/formulario");

  const params = await searchParams;
  const roster = await getAdminRoster({
    view: params.view,
    q: params.q,
    posto: params.posto,
    tipo: params.tipo,
  });

  return (
    <main className="min-h-screen bg-[#f2f5f4]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">
              Admin · Recadastramento
            </p>
            <p className="text-sm text-slate-600">{session.user.nome}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={buildExportHref(roster.filters, "csv")}
              className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              Export CSV
            </Link>
            <Link
              href={buildExportHref(roster.filters, "json")}
              className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              Export JSON
            </Link>
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="text-sm text-slate-600 hover:underline"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-4 text-sm text-slate-600">
          Os exports usam os filtros ativos (aba, tipo, posto e busca) — o que
          você vê na tabela é o que sai no arquivo. Para o script AD, exporte
          só <span className="font-medium">militar</span>.
        </p>
        <AdminStats roster={roster} />
        <AdminRosterPanel roster={roster} />
      </div>
    </main>
  );
}
