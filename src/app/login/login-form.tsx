"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

const fieldClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-teal-700/30 focus:ring-2";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="saram" className="text-sm font-medium text-slate-700">
          SARAM
        </label>
        <input
          id="saram"
          name="saram"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          required
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-700"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>

      {state.error ? (
        <p
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
