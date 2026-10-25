"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-6">
      <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        aria-invalid={Boolean(state?.error)}
        aria-describedby={state?.error ? "login-error" : undefined}
        className="h-12 w-full rounded-xl border border-ink/20 bg-white px-4 text-base outline-none focus:border-ink"
      />
      {state?.error && (
        <p id="login-error" role="alert" className="mt-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-12 w-full rounded-full bg-ink text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
