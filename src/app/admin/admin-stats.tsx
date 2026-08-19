import Link from "next/link";
import {
  buildAdminHref,
  type AdminRosterResult,
} from "@/lib/admin/roster-client";

type Props = {
  roster: AdminRosterResult;
};

export function AdminStats({ roster }: Props) {
  const { stats, filters } = roster;

  if (filters.tipo === "civil") {
    const cards = [
      {
        key: "todos",
        label: "Cadastrados",
        hint: "Planilha e cadastro CPF — mesmo tipo, fora do AD",
        value: String(stats.civis),
        tone: "text-slate-900",
        href: buildAdminHref({ ...filters, view: "todos" }),
        active: filters.view === "todos",
      },
      {
        key: "enviados",
        label: "Enviaram o termo",
        hint: "Termo preenchido",
        value: String(stats.enviados),
        tone: "text-teal-800",
        href: buildAdminHref({ ...filters, view: "enviados" }),
        active: filters.view === "enviados",
      },
    ];

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            hint={card.hint}
            value={card.value}
            tone={card.tone}
            href={card.href}
            active={card.active}
          />
        ))}
      </div>
    );
  }

  const pctLabel =
    filters.tipo === "militar"
      ? `${stats.enviados} (${stats.pct}%)`
      : String(stats.enviados);

  const cards = [
    {
      key: "todos",
      label: filters.tipo === "militar" ? "Efetivo militar" : "Na lista",
      hint:
        filters.tipo === "militar"
          ? "Planilha, sem servidor civil"
          : `${stats.militares} militares · ${stats.civis} servidores civis`,
      value: String(stats.total),
      tone: "text-slate-900",
      href: buildAdminHref({ ...filters, view: "todos" }),
      active: filters.view === "todos",
    },
    {
      key: "enviados",
      label: "Enviaram",
      hint:
        filters.tipo === "militar"
          ? "Percentual sobre o efetivo militar"
          : "Militar e servidor civil com termo enviado",
      value: pctLabel,
      tone: "text-teal-800",
      href: buildAdminHref({ ...filters, view: "enviados" }),
      active: filters.view === "enviados",
    },
    {
      key: "pendentes",
      label: "Pendentes",
      hint: "Militares do efetivo que ainda não enviaram",
      value: String(stats.pendentes),
      tone: "text-amber-700",
      href: buildAdminHref({
        ...filters,
        tipo: "militar",
        view: "pendentes",
      }),
      active: filters.view === "pendentes",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          hint={card.hint}
          value={card.value}
          tone={card.tone}
          href={card.href}
          active={card.active}
        />
      ))}
    </div>
  );
}

function StatCard(props: {
  label: string;
  hint: string;
  value: string;
  tone: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={props.href}
      className={`rounded-lg border p-4 text-left transition ${
        props.active
          ? "border-teal-700 bg-teal-50/60 ring-1 ring-teal-700/20"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <p className="text-xs tracking-wide text-slate-500 uppercase">
        {props.label}
      </p>
      <p className={`mt-1 text-3xl font-semibold ${props.tone}`}>
        {props.value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{props.hint}</p>
    </Link>
  );
}
