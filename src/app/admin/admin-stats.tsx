import Link from "next/link";
import {
  buildAdminHref,
  type AdminRosterResult,
  type AdminRosterView,
} from "@/lib/admin/roster";

type Props = {
  roster: AdminRosterResult;
};

export function AdminStats({ roster }: Props) {
  const { stats, filters } = roster;
  const cards: Array<{
    key: AdminRosterView | "efetivo";
    label: string;
    value: string;
    tone: string;
    href: string;
  }> = [
    {
      key: "efetivo",
      label: "Efetivo",
      value: String(stats.total),
      tone: "text-slate-900",
      href: buildAdminHref({ ...filters, view: "todos" }),
    },
    {
      key: "enviados",
      label: "Enviaram",
      value: `${stats.enviados} (${stats.pct}%)`,
      tone: "text-teal-800",
      href: buildAdminHref({ ...filters, view: "enviados" }),
    },
    {
      key: "pendentes",
      label: "Pendentes",
      value: String(stats.pendentes),
      tone: "text-amber-700",
      href: buildAdminHref({ ...filters, view: "pendentes" }),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const active =
          (card.key === "efetivo" && filters.view === "todos") ||
          card.key === filters.view;
        return (
          <Link
            key={card.key}
            href={card.href}
            className={`rounded-lg border p-4 text-left transition ${
              active
                ? "border-teal-700 bg-teal-50/60 ring-1 ring-teal-700/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-xs tracking-wide text-slate-500 uppercase">
              {card.label}
            </p>
            <p className={`mt-1 text-3xl font-semibold ${card.tone}`}>
              {card.value}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
