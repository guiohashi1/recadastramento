import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAdminAction } from "./actions";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/formulario");

  const [totalUsers, submittedUsers, recent] = await Promise.all([
    prisma.user.count({ where: { role: "USER", active: true } }),
    prisma.user.count({
      where: {
        role: "USER",
        active: true,
        submissions: { some: { isCurrent: true } },
      },
    }),
    prisma.submission.findMany({
      where: { isCurrent: true },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const pending = totalUsers - submittedUsers;
  const pct =
    totalUsers === 0 ? 0 : Math.round((submittedUsers / totalUsers) * 100);

  return (
    <main className="min-h-screen bg-[#f2f5f4]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">
              Admin · Recadastramento
            </p>
            <p className="text-sm text-slate-600">{session.user.nome}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/api/admin/export?format=csv"
              className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              Export CSV
            </Link>
            <Link
              href="/api/admin/export?format=json"
              className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              Export JSON
            </Link>
            <form action={logoutAdminAction}>
              <button type="submit" className="text-sm text-slate-600 hover:underline">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 uppercase">Efetivo (users)</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {totalUsers}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 uppercase">Enviaram</p>
            <p className="mt-1 text-3xl font-semibold text-teal-800">
              {submittedUsers}{" "}
              <span className="text-base font-normal text-slate-500">
                ({pct}%)
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 uppercase">Pendentes</p>
            <p className="mt-1 text-3xl font-semibold text-amber-700">
              {pending}
            </p>
          </div>
        </div>

        <section className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">SARAM</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Setor AD</th>
                <th className="px-3 py-2">Pastas</th>
                <th className="px-3 py-2">Enviado</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{s.user.saram}</td>
                  <td className="px-3 py-2">{s.user.nome}</td>
                  <td className="px-3 py-2">{s.status}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.setorAd}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {s.pastasAd.join(" | ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {s.createdAt.toLocaleString("pt-BR", {
                      timeZone: "America/Recife",
                    })}
                  </td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    Nenhuma submissão ainda.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
