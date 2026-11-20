"use client";
import { useActionState, useState } from "react";
import { submitQuote, type QuoteState } from "@/app/insurance/actions";
import { PARISHES } from "@/lib/data";
import { INSURERS, PRODUCTS } from "@/lib/insurance";

type B = { id: string; display_name: string; company: string | null };
export default function QuoteForm({ brokers, preselect, enabled }: { brokers: B[]; preselect?: string; enabled: boolean }) {
  const [state, action, pending] = useActionState<QuoteState, FormData>(submitQuote, {});
  const [picked, setPicked] = useState<string[]>(preselect ? [preselect] : []);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));

  if (state.ok) {
    return (
      <div className="panel" role="status">
        <h2>Request sent</h2>
        <p>{state.sentTo ? `${state.sentTo} licensed ${state.sentTo === 1 ? "broker" : "brokers"} will contact you, usually within one working day.` : "We've saved your request and will match you with a licensed broker as soon as one is available in your area."}</p>
        <p className="note">Brokers are paid by the insurer, so their advice is free to you. Never pay a broker in cash without a receipt from the insurance company.</p>
      </div>
    );
  }
  return (
    <form action={action} className="panel form" aria-labelledby="qf-h">
      <h2 id="qf-h">Get free quotes</h2>
      {!enabled && <p className="disclaimer">Quote requests are switching on shortly.</p>}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: "absolute", left: -9999 }} />
      <fieldset>
        <legend className="lbl">What do you need?</legend>
        <div className="chips">
          {PRODUCTS.map((p) => (
            <label key={p.id} className="chip chip-check"><input type="checkbox" name="coverage" value={p.id} /> {p.name}</label>
          ))}
        </div>
      </fieldset>
      <div className="row2">
        <label>Full name<input className="field" name="full_name" required autoComplete="name" /></label>
        <label>Phone / WhatsApp<input className="field" name="phone" required inputMode="tel" autoComplete="tel" /></label>
        <label>Email (optional)<input className="field" name="email" type="email" autoComplete="email" /></label>
        <label>Parish<select className="field" name="parish" defaultValue=""><option value="">Choose…</option>{PARISHES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>What work do you do?<input className="field" name="occupation" placeholder="e.g. musician, electrician, babysitter" /></label>
        <label>People to cover<input className="field" name="household_size" type="number" min={1} max={12} defaultValue={1} /></label>
        <label>Monthly budget<select className="field" name="monthly_budget" defaultValue=""><option value="">Not sure</option><option>Under J$5,000</option><option>J$5,000–10,000</option><option>J$10,000–20,000</option><option>J$20,000+</option></select></label>
        <label>Current insurer<select className="field" name="current_insurer" defaultValue=""><option value="">None</option>{INSURERS.map((i) => <option key={i}>{i}</option>)}</select></label>
      </div>
      <label>Anything brokers should know?<textarea className="field" name="notes" rows={3} placeholder="Existing conditions, when you need cover to start, best time to call…" /></label>
      {brokers.length > 0 && (
        <fieldset>
          <legend className="lbl">Choose up to 3 brokers (optional)</legend>
          <p className="note" style={{ marginTop: 0 }}>Leave blank and we'll match you with up to 3 licensed brokers who cover your parish.</p>
          <div className="chips">
            {brokers.map((b) => (
              <label key={b.id} className="chip chip-check" aria-pressed={picked.includes(b.id)}>
                <input type="checkbox" name="broker" value={b.id} checked={picked.includes(b.id)} onChange={() => toggle(b.id)} /> {b.display_name}{b.company ? ` · ${b.company}` : ""}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="check"><input type="checkbox" name="consent" required /> I agree to be contacted by the licensed brokers I'm matched with about insurance quotes, and to the <a href="/privacy">privacy policy</a>.</label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn btn-orange" disabled={pending || !enabled}>{pending ? "Sending…" : "Send my request"}</button>
    </form>
  );
}
