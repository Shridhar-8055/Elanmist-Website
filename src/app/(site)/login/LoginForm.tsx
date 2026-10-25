"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckIcon, LockIcon } from "@/components/icons";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Method = "email" | "phone";
type Step = "identify" | "verify" | "done";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

// ─── Auth (Supabase email OTP; codes are emailed through Resend via Supabase SMTP) ─
// Mobile login needs an SMS provider (and DLT registration in India); off until then.
const PHONE_LOGIN = false;

class AuthMessage extends Error {}

async function sendCode(method: Method, value: string) {
  if (method !== "email") throw new AuthMessage("Mobile login isn't available yet. Please use your email.");
  const { error } = await supabaseBrowser().auth.signInWithOtp({ email: value, options: { shouldCreateUser: true } });
  if (error) {
    if (error.status === 429) throw new AuthMessage("Too many codes requested. Please wait a minute and try again.");
    throw error;
  }
}

async function verifyCode(method: Method, value: string, code: string) {
  if (method !== "email") return false;
  const { error } = await supabaseBrowser().auth.verifyOtp({ email: value.trim().toLowerCase(), token: code, type: "email" });
  return !error;
}
// ──────────────────────────────────────────────────────────────────────────────

const normalisePhone = (v: string) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");

function validate(method: Method, value: string) {
  if (method === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? null : "Enter a valid email address";
  }
  return /^[6-9]\d{9}$/.test(normalisePhone(value)) ? null : "Enter a valid 10-digit mobile number";
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [value, setValue] = useState("");
  const [step, setStep] = useState<Step>("identify");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const destination = method === "email" ? value.trim() : `+91 ${normalisePhone(value)}`;

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    const problem = validate(method, value);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await sendCode(method, method === "email" ? value.trim().toLowerCase() : normalisePhone(value));
      setStep("verify");
      setCode("");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof AuthMessage ? err.message : "We couldn't send the code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(full: string) {
    if (full.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyCode(method, value, full);
      if (!ok) {
        setError("That code didn't match or has expired. Check it, or tap Resend for a new one.");
        setCode("");
        return;
      }
      setStep("done");
      // Session cookies are set; load the account (or wherever they came from).
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex h-full flex-col justify-center" aria-live="polite">
        <span className="grid size-14 place-items-center rounded-full bg-ink text-white">
          <CheckIcon className="size-7" />
        </span>
        <h1 className="mt-6 text-[clamp(30px,3.6vw,44px)] font-extrabold leading-tight tracking-tight">You&apos;re in.</h1>
        <p className="mt-3 text-base text-ink/75">Taking you to your account…</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={redirectTo} className="pill-dark inline-flex h-[52px] items-center gap-2 rounded-full px-7 text-base font-semibold">
            Continue <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/track"
            className="inline-flex h-[52px] items-center rounded-full border-2 border-ink px-6 text-base font-semibold hover:bg-ink hover:text-white"
          >
            Track an order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">
        {step === "identify" ? "Log in or sign up" : "Check your " + (method === "email" ? "inbox" : "messages")}
      </p>

      {step === "identify" ? (
        <>
          <h1 className="mt-3 text-[clamp(30px,3.6vw,44px)] font-extrabold leading-tight tracking-tight">Welcome to Elanmist</h1>
          <p className="mt-3 text-base text-ink/75">
            New here or coming back, it&apos;s the same step. We&apos;ll send you a one-time code.
          </p>

          <div role="tablist" aria-label="Log in with" className={`mt-8 grid grid-cols-2 rounded-full bg-pale p-1 ${PHONE_LOGIN ? "" : "hidden"}`}>
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={method === m}
                onClick={() => {
                  setMethod(m);
                  setValue("");
                  setError(null);
                }}
                className={`h-11 rounded-full text-[15px] font-semibold transition-colors ${
                  method === m ? "bg-ink text-white shadow-sm" : "text-ink/70 hover:text-ink"
                }`}
              >
                {m === "email" ? "Email" : "Mobile number"}
              </button>
            ))}
          </div>

          <form onSubmit={requestCode} noValidate className="mt-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">{method === "email" ? "Email address" : "Mobile number"}</span>
              <span
                className={`flex h-[56px] items-center rounded-2xl border bg-white px-4 transition-colors focus-within:border-ink ${
                  error ? "border-red-400" : "border-ink/20"
                }`}
              >
                {method === "phone" && <span className="mr-3 border-r border-ink/15 pr-3 text-base font-medium text-ink/70">+91</span>}
                <input
                  key={method}
                  autoFocus
                  type={method === "email" ? "email" : "tel"}
                  inputMode={method === "email" ? "email" : "numeric"}
                  autoComplete={method === "email" ? "email" : "tel-national"}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={method === "email" ? "you@example.com" : "10-digit mobile"}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full bg-transparent text-base outline-none placeholder:text-ink/40"
                />
              </span>
            </label>
            {error && (
              <p id="login-error" role="alert" className="mt-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="pill-dark mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-full text-base font-semibold disabled:opacity-70"
            >
              {busy ? "Sending code…" : "Send code"}
              {!busy && <ArrowRight className="size-4" />}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-[clamp(30px,3.6vw,44px)] font-extrabold leading-tight tracking-tight">Enter your code</h1>
          <p className="mt-3 text-base text-ink/75">
            We sent a {CODE_LENGTH}-digit code to <span className="font-semibold text-ink">{destination}</span>.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("identify");
                setError(null);
              }}
              className="font-semibold text-ink underline underline-offset-4"
            >
              Change
            </button>
          </p>

          <CodeInput
            value={code}
            disabled={busy}
            invalid={Boolean(error)}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
              if (v.length === CODE_LENGTH) submitCode(v);
            }}
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={busy || code.length !== CODE_LENGTH}
            onClick={() => submitCode(code)}
            className="pill-dark mt-6 flex h-[56px] w-full items-center justify-center rounded-full text-base font-semibold disabled:opacity-60"
          >
            {busy ? "Checking…" : "Verify and continue"}
          </button>

          <p className="mt-5 text-center text-sm text-ink/70">
            Didn&apos;t get it?{" "}
            {resendIn > 0 ? (
              <span>Resend in {resendIn}s</span>
            ) : (
              <button type="button" onClick={() => requestCode()} className="font-semibold text-ink underline underline-offset-4">
                Resend code
              </button>
            )}
          </p>
        </>
      )}

      <div className="mt-auto pt-10">
        <div className="rounded-2xl bg-pale px-4 py-3.5 text-sm text-ink/75">
          Just want to check a delivery?{" "}
          <Link href="/track" className="font-semibold text-ink underline underline-offset-4">
            Track an order
          </Link>{" "}
          with your order number. You can also check out as a guest.
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink/60">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>
            By continuing you agree to our{" "}
            <Link href="/policies/terms" className="underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/policies/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </p>
      </div>
    </div>
  );
}

// Six single-digit boxes: auto-advance, backspace to go back, and paste of the whole code.
function CodeInput({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  invalid: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!value) refs.current[0]?.focus();
  }, [value]);

  const setAt = (i: number, digit: string) => {
    const chars = value.padEnd(CODE_LENGTH, " ").split("");
    chars[i] = digit || " ";
    onChange(chars.join("").replace(/\s+$/, "").replace(/\s/g, ""));
  };

  return (
    <div className="mt-8 grid grid-cols-6 gap-2 sm:gap-3" role="group" aria-label={`${CODE_LENGTH}-digit code`}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            if (!d) return;
            setAt(i, d);
            refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (value[i]) setAt(i, "");
              else if (i > 0) {
                setAt(i - 1, "");
                refs.current[i - 1]?.focus();
              }
            } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
            if (!digits) return;
            e.preventDefault();
            onChange(digits);
            refs.current[Math.min(digits.length, CODE_LENGTH - 1)]?.focus();
          }}
          className={`h-[60px] w-full rounded-2xl border bg-white text-center text-2xl font-bold outline-none transition-colors focus:border-ink disabled:opacity-60 sm:h-[68px] ${
            invalid ? "border-red-400" : value[i] ? "border-ink/60" : "border-ink/20"
          }`}
        />
      ))}
    </div>
  );
}
