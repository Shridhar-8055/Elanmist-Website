"use client";

import { useActionState, useState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="mt-6">
      <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
        Password
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          required
          autoFocus
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={Boolean(state?.error)}
          aria-describedby={state?.error ? "login-error" : undefined}
          // Edge draws its own reveal button; hide it so there's only one eye.
          className="h-12 w-full rounded-xl border border-ink/20 bg-white pl-4 pr-12 text-base outline-none focus:border-ink [&::-ms-reveal]:hidden"
        />
        {/* Eye = show the password; eye with a slash = hide it again. */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls="password"
          title={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-r-xl text-ink/55 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
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
