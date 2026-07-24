import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCanonicalCsv, toExportRow } from "@/lib/export/submissions";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Não autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  const submissions = await prisma.submission.findMany({
    where: { isCurrent: true },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = submissions.map(toExportRow);

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="recadastramento-export.json"',
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = toCanonicalCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="recadastramento-export.csv"',
      "Cache-Control": "no-store",
    },
  });
}
