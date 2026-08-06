import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
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
                Recadastramento 2026
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-600">
            Digite seu <strong className="font-bold text-slate-800">SARAM</strong> nos campos de <strong className="font-bold text-slate-800">login</strong> e <strong className="font-bold text-slate-800">senha</strong> para preencher o Termo de Compromisso e solicitar acessos de rede.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>

      <p className="absolute right-3 bottom-3 text-[11px] text-slate-400 sm:right-4 sm:bottom-4">
        Desenvolvido por{" "}
        <a
          href="https://github.com/guiohashi1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-teal-800"
        >
          @guiohashi1
        </a>
      </p>
    </main>
  );
}
