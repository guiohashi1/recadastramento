import { auth } from "@/lib/auth";
import { buildPdfForCurrentUser } from "@/app/formulario/actions";

/** PDF com template embutido — precisa de mais tempo no serverless (Vercel Hobby = 60s). */
export const maxDuration = 60;
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Não autenticado", { status: 401 });
  }
  if (session.user.role === "ADMIN") {
    return new Response("Indisponível para admin", { status: 403 });
  }

  try {
    const bytes = await buildPdfForCurrentUser();
    const filename = `termo-compromisso-${session.user.saram}.pdf`;
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar PDF";
    return new Response(message, { status: 400 });
  }
}
