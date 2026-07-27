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
        {current ? (
          <div className="mb-6 rounded-lg border border-teal-200 bg-white p-5 shadow-sm shadow-teal-900/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">
                  {params.ok
                    ? "Recadastramento salvo com sucesso"
                    : "Seu Termo está pronto"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {params.ok
                    ? "Baixe o PDF, imprima, colete a assinatura do chefe de cada seção/pasta solicitada e entregue ao TI."
                    : `Último PDF gerado em ${current.pdfGeneratedAt?.toLocaleString(
                        "pt-BR",
                        { timeZone: "America/Recife" },
                      )}.`}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Os dados ficam em visualização. Use{" "}
                  <span className="font-medium text-slate-700">Alterar dados</span>{" "}
                  abaixo se precisar corrigir algo.
                </p>
              </div>
              <a
                href="/api/pdf"
                className="inline-flex shrink-0 items-center justify-center rounded-md bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              >
                {params.ok ? "Baixar PDF preenchido" : "Baixar PDF novamente"}
              </a>
            </div>
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
