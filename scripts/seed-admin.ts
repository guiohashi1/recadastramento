import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const saram = process.env.ADMIN_SARAM || "admin";
  const password = process.env.ADMIN_PASSWORD;
  const nome = process.env.ADMIN_NOME || "Administrador TI";

  if (!password || password.length < 10) {
    throw new Error(
      "Defina ADMIN_PASSWORD no .env (mín. 10 caracteres, senha forte).",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { saram },
    create: {
      saram,
      nome,
      passwordHash,
      role: "ADMIN",
      sourceSheet: "MANUAL",
      active: true,
    },
    update: {
      nome,
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  console.log(`Admin upserted: saram=${saram}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
