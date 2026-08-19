import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminRoster } from "@/lib/admin/roster";
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
    posto: params.posto,
    tipo: params.tipo,
    defaultTipo: "militar",
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
          A busca filtra a tabela na hora. <span className="font-medium">CSV AD</span>{" "}
          é só militar enviado — use esse arquivo no script. “Desta lista”
          respeita a aba e a busca.
        </p>
        <AdminStats roster={roster} />
        <AdminRosterPanel roster={roster} initialQuery={params.q ?? ""} />
      </div>
    </main>
  );
}
