import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadPastasRede, loadSetores } from "@/lib/catalogs";
import { defaultStatusFromSheet } from "@/lib/constants";
import { logoutAction } from "./actions";
import { RecadastroForm } from "./recadastro-form";

export default async function FormularioPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      submissions: {
        where: { isCurrent: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const current = user.submissions[0] ?? null;
  const setores = loadSetores();
  const pastas = loadPastasRede();
  const defaultStatus = defaultStatusFromSheet(user.sourceSheet);

  return (
    <main className="min-h-screen bg-[#f2f5f4]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">
              Recadastramento HARF
            </p>
            <p className="text-sm text-slate-600">{user.nome}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-slate-600 underline-offset-2 hover:underline"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {params.ok ? (
          <div className="mb-6 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Dados salvos.{" "}
            <Link href="/api/pdf" className="font-semibold underline">
              Baixar PDF preenchido
            </Link>{" "}
            — imprima, solicite assinatura do chefe e entregue ao TI.
          </div>
        ) : null}

        {current?.pdfGeneratedAt ? (
          <div className="mb-6 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Último PDF gerado em{" "}
            {current.pdfGeneratedAt.toLocaleString("pt-BR", {
              timeZone: "America/Recife",
            })}
            .{" "}
            <Link href="/api/pdf" className="font-medium text-teal-800 underline">
              Baixar novamente
            </Link>
          </div>
        ) : null}

        <RecadastroForm
          nome={user.nome}
          saram={user.saram}
          postoGrad={user.postoGrad}
          setorHint={user.setorHint}
          defaultStatus={defaultStatus}
          setores={setores}
          pastas={pastas}
          alreadySubmitted={!!current}
          initialSetor={current?.setorAd}
          initialPastas={current?.pastasAd}
          initialEmail={current?.email}
          initialTelefone={current?.telefone}
          initialIdentidade={current?.identidade}
          initialStatus={current?.status}
        />
      </div>
    </main>
  );
}
