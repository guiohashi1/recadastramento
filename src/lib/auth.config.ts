import type { DefaultSession, NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      saram: string;
      nome: string;
      role: "USER" | "ADMIN";
      postoGrad?: string | null;
      sourceSheet?: string;
    } & DefaultSession["user"];
  }

  interface User {
    saram: string;
    nome: string;
    role: "USER" | "ADMIN";
    postoGrad?: string | null;
    sourceSheet?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    saram: string;
    nome: string;
    role: "USER" | "ADMIN";
    postoGrad?: string | null;
    sourceSheet?: string;
  }
}

/** Edge-safe config (no Prisma). Providers live in auth.ts */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.saram = user.saram;
        token.nome = user.nome;
        token.role = user.role;
        token.postoGrad = user.postoGrad;
        token.sourceSheet = user.sourceSheet;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.saram = token.saram;
      session.user.nome = token.nome;
      session.user.role = token.role;
      session.user.postoGrad = token.postoGrad;
      session.user.sourceSheet = token.sourceSheet;
      session.user.name = token.nome;
      return session;
    },
  },
} satisfies NextAuthConfig;
