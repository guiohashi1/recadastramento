"use client";

import { useActionState, useMemo, useState } from "react";
import type { CatalogOption } from "@/lib/catalogs";
import { PERSONNEL_STATUS_OPTIONS } from "@/lib/constants";
import type { PersonnelStatus } from "@prisma/client";
import {
  submitRecadastramentoAction,
  type SubmitState,
} from "./actions";

/** Máscara 000.000.000-00 */
function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

type Props = {
  nome: string;
  saram: string;
  postoGrad: string | null;
  setorHint: string | null;
  defaultStatus: PersonnelStatus;
  setores: CatalogOption[];
  pastas: CatalogOption[];
  alreadySubmitted: boolean;
  initialSetor?: string | null;
  initialPastas?: string[];
  initialEmail?: string | null;
  initialTelefone?: string | null;
  initialIdentidade?: string | null;
  initialStatus?: PersonnelStatus | null;
};

const initialState: SubmitState = {};

export function RecadastroForm(props: Props) {
  const [state, action, pending] = useActionState(
    submitRecadastramentoAction,
    initialState,
  );
  const [setor, setSetor] = useState(
    props.initialSetor ?? "",
  );
  const [cpf, setCpf] = useState(() =>
    formatCpf(props.initialIdentidade ?? ""),
  );
  const [pastaQuery, setPastaQuery] = useState("");
  const [selectedPastas, setSelectedPastas] = useState<string[]>(
    props.initialPastas ?? [],
  );

  const filteredPastas = useMemo(() => {
    const q = pastaQuery.trim().toLowerCase().replace(/^harf-/, "");
    return props.pastas.filter((p) => {
      if (!q) return true;
      const label = p.label.toLowerCase();
      const value = p.value.toLowerCase();
      const valueShort = value.replace(/^harf-/, "");
      return (
        label.includes(q) ||
        value.includes(q) ||
        valueShort.includes(q)
      );
    });
  }, [props.pastas, pastaQuery]);

  function togglePasta(value: string) {
    setSelectedPastas((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      {props.alreadySubmitted ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Você já enviou o recadastramento. Pode atualizar os dados e enviar
          novamente — a versão anterior permanece no histórico.
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Identificação</h2>
        <p className="mt-1 text-sm text-slate-600">
          Confira se estes dados correspondem a você.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">
              Nome
            </dt>
            <dd className="font-medium text-slate-900">{props.nome}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">
              SARAM
            </dt>
            <dd className="font-medium text-slate-900">{props.saram}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">
              Posto / Graduação
            </dt>
            <dd className="font-medium text-slate-900">
              {props.postoGrad || "—"}
            </dd>
          </div>
          {props.setorHint ? (
            <div>
              <dt className="text-xs tracking-wide text-slate-500 uppercase">
                Setor (planilha — referência)
              </dt>
              <dd className="font-medium text-slate-900">{props.setorHint}</dd>
            </div>
          ) : null}
        </dl>

        <label className="mt-5 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="confirmIdentity"
            required
            className="mt-1"
          />
          <span>Confirmo que os dados de identificação acima estão corretos.</span>
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Dados do Termo
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="status" className="text-sm font-medium">
              Situação
            </label>
            <select
              id="status"
              name="status"
              defaultValue={props.initialStatus ?? props.defaultStatus}
              required
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              {PERSONNEL_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={props.initialEmail ?? ""}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="telefone" className="text-sm font-medium">
              Telefone / Ramal
            </label>
            <input
              id="telefone"
              name="telefone"
              type="text"
              defaultValue={props.initialTelefone ?? ""}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="identidade" className="text-sm font-medium">
              CPF
            </label>
            <input
              id="identidade"
              name="identidade"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              maxLength={14}
              required
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              className="rounded-md border border-slate-300 px-3 py-2 font-mono tracking-wide"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Acessos AD</h2>
        <p className="mt-1 text-sm text-slate-600">
          Escolha o setor principal e as pastas de rede necessárias. Grupos de
          chefia (-ch) não estão disponíveis para autoatendimento.
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="setorAd" className="text-sm font-medium">
            Setor principal
          </label>
          <select
            id="setorAd"
            name="setorAd"
            required
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Selecione…</option>
            {props.setores.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} ({s.value})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            O setor já corresponde a um grupo AD (ex.: SINFO → harf-sinfo). Nas
            pastas abaixo, marque outros acessos adicionais — inclusive o mesmo
            grupo, se quiser reforçar na lista.
          </p>
        </div>

        <div className="mt-5">
          <label htmlFor="pastaQuery" className="text-sm font-medium">
            Pastas de rede
          </label>
          <input
            id="pastaQuery"
            type="search"
            value={pastaQuery}
            onChange={(e) => setPastaQuery(e.target.value)}
            placeholder="Buscar: sinfo, same, uti, harf-…"
            className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2"
          />

          {/* Fonte de verdade no submit — independente do filtro visual */}
          {selectedPastas.map((value) => (
            <input
              key={`hidden-${value}`}
              type="hidden"
              name="pastasAd"
              value={value}
            />
          ))}

          {selectedPastas.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {selectedPastas.map((value) => {
                const opt = props.pastas.find((p) => p.value === value);
                return (
                  <li key={value}>
                    <button
                      type="button"
                      onClick={() => togglePasta(value)}
                      className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs text-teal-900"
                      title="Remover"
                    >
                      {opt?.label ?? value} ×
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-slate-200">
            {filteredPastas.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">
                Nenhuma pasta encontrada para “{pastaQuery}”.
              </p>
            ) : (
              filteredPastas.map((p) => (
                <label
                  key={p.value}
                  className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPastas.includes(p.value)}
                    onChange={() => togglePasta(p.value)}
                  />
                  <span>
                    {p.label}{" "}
                    <span className="text-slate-500">({p.value})</span>
                    {p.value === setor ? (
                      <span className="ml-2 text-xs text-teal-800">
                        (mesmo do setor)
                      </span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Selecionadas: {selectedPastas.length} · listando{" "}
            {filteredPastas.length} de {props.pastas.length}
          </p>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
          {state.fieldErrors
            ? ` (${Object.keys(state.fieldErrors).join(", ")})`
            : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-800 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar e gerar PDF"}
      </button>
    </form>
  );
}
