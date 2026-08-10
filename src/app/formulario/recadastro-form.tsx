"use client";

import { useActionState, useMemo, useState } from "react";
import type { CatalogOption } from "@/lib/catalogs";
import { PERSONNEL_STATUS_OPTIONS } from "@/lib/constants";
import { formatCpf } from "@/lib/cpf";
import type { PersonnelStatus } from "@prisma/client";
import {
  submitRecadastramentoAction,
  type SubmitState,
} from "./actions";

type Props = {
  nome: string;
  saram: string;
  postoGrad: string | null;
  setorHint: string | null;
  isCivil?: boolean;
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

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-700";

export function RecadastroForm(props: Props) {
  const [state, action, pending] = useActionState(
    submitRecadastramentoAction,
    initialState,
  );
  const [isEditing, setIsEditing] = useState(false);
  const readOnly = props.alreadySubmitted && !isEditing;

  const [setor, setSetor] = useState(props.initialSetor ?? "");
  const [cpf, setCpf] = useState(() =>
    formatCpf(props.initialIdentidade ?? ""),
  );
  const [pastaQuery, setPastaQuery] = useState("");
  const [selectedPastas, setSelectedPastas] = useState<string[]>(() =>
    (props.initialPastas ?? []).filter((value) =>
      props.pastas.some((p) => p.value === value),
    ),
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
    if (readOnly) return;
    setSelectedPastas((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  function startEditing() {
    setIsEditing(true);
  }

  function cancelEditing() {
    // Recarrega valores salvos — evita estado “sujo” na volta para visualização
    setSetor(props.initialSetor ?? "");
    setCpf(formatCpf(props.initialIdentidade ?? ""));
    setPastaQuery("");
    setSelectedPastas(
      (props.initialPastas ?? []).filter((value) =>
        props.pastas.some((p) => p.value === value),
      ),
    );
    setIsEditing(false);
  }

  const statusLabel =
    PERSONNEL_STATUS_OPTIONS.find(
      (o) => o.value === (props.initialStatus ?? props.defaultStatus),
    )?.label ?? "—";

  return (
    <form
      key={readOnly ? "view" : "edit"}
      action={action}
      className="flex flex-col gap-8"
    >      {props.alreadySubmitted && readOnly ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Recadastramento já enviado — modo visualização. Para corrigir algo,
          use <strong>Alterar dados</strong>.
        </div>
      ) : null}

      {props.alreadySubmitted && isEditing ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Você está editando o envio anterior. Ao salvar, a versão antiga
          permanece no histórico e a nova passa a ser a atual.
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
              {props.isCivil ? "CPF (login)" : "SARAM"}
            </dt>
            <dd className="font-medium text-slate-900">
              {props.isCivil ? formatCpf(props.saram) : props.saram}
            </dd>
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

        {!readOnly ? (
          <label className="mt-5 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="confirmIdentity"
              required
              className="mt-1"
            />
            <span>
              Confirmo que os dados de identificação acima estão corretos.
            </span>
          </label>
        ) : null}
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
            {readOnly || props.isCivil ? (
              <>
                <p className={`${inputClass} m-0`}>
                  {props.isCivil
                    ? PERSONNEL_STATUS_OPTIONS.find((o) => o.value === "CIVIL")
                        ?.label
                    : statusLabel}
                </p>
                {!readOnly && props.isCivil ? (
                  <input type="hidden" name="status" value="CIVIL" />
                ) : null}
              </>
            ) : (
              <select
                id="status"
                name="status"
                defaultValue={props.initialStatus ?? props.defaultStatus}
                required
                className={inputClass}
              >
                {PERSONNEL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail (Zimbra)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={props.initialEmail ?? ""}
              disabled={readOnly}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="telefone" className="text-sm font-medium">
              Ramal
            </label>
            <input
              id="telefone"
              name="telefone"
              type="text"
              defaultValue={props.initialTelefone ?? ""}
              disabled={readOnly}
              className={inputClass}
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
              required={!readOnly}
              value={cpf}
              onChange={(e) => {
                if (props.isCivil) return;
                setCpf(formatCpf(e.target.value));
              }}
              disabled={readOnly}
              readOnly={readOnly || Boolean(props.isCivil)}
              className={`${inputClass} font-mono tracking-wide`}
            />
            {props.isCivil && !readOnly ? (
              <p className="text-xs text-slate-500">
                CPF fixo do cadastro civil (mesmo do login).
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Acessos de rede</h2>
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
            required={!readOnly}
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            disabled={readOnly}
            className={inputClass}
          >
            <option value="">Selecione…</option>
            {props.setores.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} ({s.value})
              </option>
            ))}
          </select>
          {!readOnly ? (
            <p className="text-xs text-slate-500">
              Indique abaixo as demais pastas de rede que necessita acessar em decorrência de escalas de serviço, comissões ou outras atribuições..
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <label htmlFor="pastaQuery" className="text-sm font-medium">
            Pastas de rede
          </label>

          {!readOnly ? (
            <>
              <input
                id="pastaQuery"
                type="search"
                value={pastaQuery}
                onChange={(e) => setPastaQuery(e.target.value)}
                placeholder="Buscar: sinfo, same, uti, harf-…"
                className={`mt-1.5 w-full ${inputClass}`}
              />

              {selectedPastas.map((value) => (
                <input
                  key={`hidden-${value}`}
                  type="hidden"
                  name="pastasAd"
                  value={value}
                />
              ))}
            </>
          ) : null}

          {selectedPastas.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {selectedPastas.map((value) => {
                const opt = props.pastas.find((p) => p.value === value);
                return (
                  <li key={value}>
                    {readOnly ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800">
                        {opt?.label ?? value}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => togglePasta(value)}
                        className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs text-teal-900"
                        title="Remover"
                      >
                        {opt?.label ?? value} ×
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : readOnly ? (
            <p className="mt-3 text-sm text-slate-500">
              Nenhuma pasta adicional selecionada.
            </p>
          ) : null}

          {!readOnly ? (
            <>
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
            </>
          ) : null}
        </div>
      </section>

      {state.error ? (
        <p
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
          {state.fieldErrors
            ? ` (${Object.keys(state.fieldErrors).join(", ")})`
            : null}
        </p>
      ) : null}

      {readOnly ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md border border-teal-800 px-4 py-3 text-sm font-semibold text-teal-900 hover:bg-teal-50"
          >
            Alterar dados
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-teal-800 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Salvar e gerar PDF"}
          </button>
          {props.alreadySubmitted ? (
            <button
              type="button"
              onClick={cancelEditing}
              disabled={pending}
              className="rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      )}
    </form>
  );
}
