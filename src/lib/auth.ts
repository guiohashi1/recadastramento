import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  saram: z.string().min(1).max(32),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "SARAM",
      credentials: {
        saram: { label: "SARAM", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const saram = parsed.data.saram.trim();
        const password = parsed.data.password;

        const user = await prisma.user.findUnique({ where: { saram } });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          saram: user.saram,
          nome: user.nome,
          role: user.role,
          postoGrad: user.postoGrad,
          sourceSheet: user.sourceSheet,
          name: user.nome,
        };
      },
    }),
  ],
});
