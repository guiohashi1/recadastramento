import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { parseEfetivoOds } from "../src/lib/ods/parse-efetivo";

async function main() {
  const odsPath =
    process.argv[2] ||
    path.join(process.cwd(), "data", "Efetivo Geral 21.07.2026.ods");

  console.log("Lendo:", odsPath);
  const parsed = parseEfetivoOds(odsPath);

  for (const w of parsed.warnings) console.warn("WARN:", w);
  for (const e of parsed.errors) console.error("ERR:", e);

  if (parsed.rows.length === 0) {
    console.error("Nenhuma linha válida para importar.");
    process.exit(1);
  }

  let created = 0;
  let updated = 0;

  for (const row of parsed.rows) {
    const passwordHash = await bcrypt.hash(row.saram, 10);
    const existing = await prisma.user.findUnique({
      where: { saram: row.saram },
    });

    if (existing) {
      if (existing.role === "ADMIN") {
        console.warn(`Skip ADMIN saram=${row.saram}`);
        continue;
      }
      const civil = await prisma.civilUser.findUnique({
        where: { userId: existing.id },
        select: { id: true },
      });
      if (civil) {
        console.warn(`Skip CIVIL saram=${row.saram}`);
        continue;
      }
      await prisma.user.update({
        where: { saram: row.saram },
        data: {
          nome: row.nome,
          postoGrad: row.postoGrad,
          quadro: row.quadro,
          especialidade: row.especialidade,
          sourceSheet: row.sourceSheet,
          setorHint: row.setorHint,
          // Keep existing passwordHash — re-import não reseta senha
          active: true,
        },
      });
      updated += 1;
    } else {
      await prisma.user.create({
        data: {
          saram: row.saram,
          nome: row.nome,
          postoGrad: row.postoGrad,
          quadro: row.quadro,
          especialidade: row.especialidade,
          sourceSheet: row.sourceSheet,
          setorHint: row.setorHint,
          passwordHash,
          role: "USER",
        },
      });
      created += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        created,
        updated,
        validRows: parsed.rows.length,
        errorCount: parsed.errors.length,
        warningCount: parsed.warnings.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
