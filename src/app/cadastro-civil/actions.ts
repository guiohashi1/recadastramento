"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { CIVIL_OM, CIVIL_POSTO_GRAD } from "@/lib/civil";
import { cpfDigits } from "@/lib/cpf";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { civilCadastroSchema } from "@/lib/validation/civil-cadastro";

export type CivilCadastroState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerCivilAction(
  _prev: CivilCadastroState,
  formData: FormData,
): Promise<CivilCadastroState> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const limited = rateLimit({
    key: `civil-cadastro:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  const parsed = civilCadastroSchema.safeParse({
    nome: formData.get("nome"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
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

  const nome = parsed.data.nome.trim();
  const cpf = cpfDigits(parsed.data.cpf);
  const email = parsed.data.email.trim().toLowerCase();

  const existingCivil = await prisma.civilUser.findUnique({ where: { cpf } });
  if (existingCivil) {
    return {
      error:
        "CPF já cadastrado. Faça login com o CPF no campo SARAM e repita o CPF na senha.",
    };
  }

  const existingUser = await prisma.user.findUnique({ where: { saram: cpf } });
  if (existingUser) {
    return {
      error:
        "Já existe uma conta com este CPF/identificador. Tente fazer login ou procure o TI.",
    };
  }

  const passwordHash = await bcrypt.hash(cpf, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          saram: cpf,
          nome,
          postoGrad: CIVIL_POSTO_GRAD,
          sourceSheet: "MANUAL",
          passwordHash,
          role: "USER",
          active: true,
        },
      });

      await tx.civilUser.create({
        data: {
          cpf,
          nome,
          email,
          om: CIVIL_OM,
          postoGrad: CIVIL_POSTO_GRAD,
          userId: user.id,
        },
      });
    });
  } catch {
    return {
      error: "Não foi possível concluir o cadastro. Tente novamente.",
    };
  }

  try {
    await signIn("credentials", {
      saram: cpf,
      password: cpf,
      redirectTo: "/formulario",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error:
          "Cadastro criado, mas o login automático falhou. Entre com CPF + CPF na tela de login.",
      };
    }
    throw err;
  }

  return {};
}
