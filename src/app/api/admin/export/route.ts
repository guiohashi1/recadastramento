import { auth } from "@/lib/auth";
import { getAdminRoster } from "@/lib/admin/roster";
import {
  exportFilename,
  toCanonicalCsv,
  toExportRowFromRoster,
} from "@/lib/export/submissions";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Não autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  const roster = await getAdminRoster({
    view: searchParams.get("view"),
    q: searchParams.get("q"),
    posto: searchParams.get("posto"),
    defaultView: "enviados",
  });

  const rows = roster.rows.map(toExportRowFromRoster);
  const filename = exportFilename(format, {
    view: roster.filters.view,
    posto: roster.filters.posto,
  });

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(toCanonicalCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
