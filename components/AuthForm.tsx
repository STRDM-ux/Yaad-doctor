"use client";
import { useActionState, useState } from "react";
import { signIn, type FormState } from "@/app/hq/actions";
export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="panel form" style={{ maxWidth: 440, margin: "0 auto" }}>
      <h2>{mode === "signin" ? "Sign in to Brokers HQ" : "Create your broker account"}</h2>
      <input type="hidden" name="mode" value={mode} />
      {mode === "signup" && <label>Full name<input className="field" name="full_name" required autoComplete="name" /></label>}
      <label>Email<input className="field" name="email" type="email" required autoComplete="email" /></label>
      <label>Password<input className="field" name="password" type="password" required minLength={mode === "signup" ? 10 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.ok && <p className="ok" role="status">{state.ok}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "New here? Create a broker account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
