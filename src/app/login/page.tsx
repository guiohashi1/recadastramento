import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/formulario");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(165deg,#0f3d3e_0%,#1a5c5e_40%,#e8f1f0_40%,#f4f7f6_100%)] px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-white/95 p-8 shadow-lg shadow-slate-900/10">
        <p className="text-xs font-semibold tracking-[0.2em] text-teal-800 uppercase">
          HARF · SINFO
        </p>
        <h1 className="mt-2 font-serif text-3xl text-slate-900">
          Recadastramento 2026
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Identifique-se com seu SARAM para preencher o Termo de Compromisso e
          solicitar acessos de rede.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
