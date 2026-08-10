import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CivilCadastroForm } from "./civil-cadastro-form";

export default async function CadastroCivilPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/formulario");
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f2f5f4]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <div className="flex items-start gap-4">
            <Image
              src="/harf-logo.png"
              alt="Brasão do HARF"
              width={72}
              height={88}
              priority
              className="h-[72px] w-auto shrink-0"
            />
            <div className="min-w-0 pt-1">
              <p className="text-sm font-medium text-teal-800">HARF · SINFO</p>
              <h1 className="mt-1 font-serif text-2xl leading-snug text-slate-900">
                Cadastro de civis
              </h1>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm text-slate-600">
            <p>
              Preencha a identificação para gerar o Termo e solicitar acessos
              de rede. Destinado a funcionários civis que não constam no
              efetivo militar.
            </p>
          </div>

          <div className="mt-6">
            <CivilCadastroForm />
          </div>
        </div>
      </div>
    </main>
  );
}
