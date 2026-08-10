"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CIVIL_OM, CIVIL_POSTO_GRAD } from "@/lib/civil";
import { formatCpf } from "@/lib/cpf";
import {
  registerCivilAction,
  type CivilCadastroState,
} from "./actions";

const initial: CivilCadastroState = {};

const fieldClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-teal-700/30 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-700";

export function CivilCadastroForm() {
  const [state, action, pending] = useActionState(registerCivilAction, initial);
  const [cpf, setCpf] = useState("");

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="text-sm font-medium text-slate-700">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="postoGrad"
            className="text-sm font-medium text-slate-700"
          >
            Posto / Graduação
          </label>
          <input
            id="postoGrad"
            type="text"
            value={CIVIL_POSTO_GRAD}
            disabled
            readOnly
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="om" className="text-sm font-medium text-slate-700">
            OM
          </label>
          <input
            id="om"
            type="text"
            value={CIVIL_OM}
            disabled
            readOnly
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cpf" className="text-sm font-medium text-slate-700">
          CPF
        </label>
        <input
          id="cpf"
          name="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          maxLength={14}
          required
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          className={`${fieldClass} font-mono tracking-wide`}
        />
        <p className="text-xs text-slate-500">
          Após o cadastro, use o CPF no login e repita o CPF na senha.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          className={fieldClass}
        />
      </div>

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

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
      >
        {pending ? "Cadastrando…" : "Cadastrar e continuar"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Já tem cadastro?{" "}
        <Link href="/login" className="font-medium text-teal-800 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
