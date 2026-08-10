"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPasta, isValidSetor } from "@/lib/catalogs";
import { formatCpf } from "@/lib/cpf";
import { generateTermoPdf } from "@/lib/pdf/generate-termo";
import { submissionFormSchema } from "@/lib/validation/submission";
import { defaultStatusFromSheet } from "@/lib/constants";

export type SubmitState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function logoutAction() {
  // redirect:false + redirect() é mais confiável que redirectTo no server action
  await signOut({ redirect: false });
  redirect("/login");
}

export async function submitRecadastramentoAction(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sessão expirada. Faça login novamente." };
  }
  if (session.user.role === "ADMIN") {
    return { error: "Conta administrativa não envia recadastramento." };
  }

  const pastasRaw = [...new Set(formData.getAll("pastasAd").map(String).filter(Boolean))];
  const confirm = formData.get("confirmIdentity") === "on";

  const parsed = submissionFormSchema.safeParse({
    status: formData.get("status"),
    setorAd: formData.get("setorAd"),
    pastasAd: pastasRaw,
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    identidade: String(formData.get("identidade") ?? ""),
    confirmIdentity: confirm ? true : undefined,
  });

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;

  if (!isValidSetor(data.setorAd)) {
    return { error: "Setor principal inválido." };
  }

  for (const pasta of data.pastasAd) {
    if (!isValidPasta(pasta)) {
      return { error: `Pasta de rede inválida: ${pasta}` };
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user || !user.active) {
    return { error: "Usuário não encontrado ou inativo." };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.submission.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });

    await tx.submission.create({
      data: {
        userId: user.id,
        status: data.status,
        setorAd: data.setorAd,
        pastasAd: data.pastasAd,
        email: data.email || null,
        telefone: data.telefone || null,
        identidade: data.identidade || null,
        termoSnapshot: {
          nome: user.nome,
          postoGrad: user.postoGrad,
          saram: user.saram,
          quadro: user.quadro,
          especialidade: user.especialidade,
          status: data.status,
          setorAd: data.setorAd,
          pastasAd: data.pastasAd,
          email: data.email || null,
          telefone: data.telefone || null,
          identidade: data.identidade || null,
        },
        isCurrent: true,
        pdfGeneratedAt: now,
      },
    });
  });

  revalidatePath("/formulario");
  revalidatePath("/admin");
  redirect("/formulario?ok=1");
}

export async function buildPdfForCurrentUser(): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      civilProfile: true,
      submissions: {
        where: { isCurrent: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) throw new Error("Usuário não encontrado");

  const submission = user.submissions[0];
  if (!submission) {
    throw new Error("Envie o formulário antes de gerar o PDF.");
  }

  return generateTermoPdf({
    nome: user.nome,
    postoGrad: user.postoGrad ?? "",
    saram: user.civilProfile ? formatCpf(user.saram) : user.saram,
    identidade: submission.identidade,
    email: submission.email,
    telefone: submission.telefone,
    status: submission.status,
    setorAd: submission.setorAd,
    pastasAd: submission.pastasAd,
    // Data impressa no Termo = momento em que o usuário gera/baixa o PDF
    generatedAt: new Date(),
    om: user.civilProfile?.om ?? "HARF",
  });
}

export async function suggestedStatusForUser() {
  const session = await auth();
  if (!session?.user?.id) return defaultStatusFromSheet("MANUAL");

  const civil = await prisma.civilUser.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (civil) return defaultStatusFromSheet("MANUAL", { isCivil: true });

  if (!session.user.sourceSheet) return defaultStatusFromSheet("MANUAL");
  return defaultStatusFromSheet(
    session.user.sourceSheet as "ATIVA" | "PTTC" | "MANUAL",
  );
}
