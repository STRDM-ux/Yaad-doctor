"use client";
import { useActionState } from "react";
import { saveBroker, type FormState } from "@/app/hq/actions";
import { PARISHES } from "@/lib/data";
import { INSURERS, LICENCE_TYPES, PRODUCTS } from "@/lib/insurance";
import type { Broker } from "@/lib/hq";

export default function BrokerForm({ broker, defaults }: { broker?: Broker | null; defaults?: { name?: string; email?: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBroker, {});
  const b = broker;
  const multi = (name: string, opts: [string, string][], selected: string[] = []) => (
    <div className="chips">{opts.map(([v, l]) => <label key={v} className="chip chip-check"><input type="checkbox" name={name} value={v} defaultChecked={selected.includes(v)} /> {l}</label>)}</div>
  );
  return (
    <form action={action} className="panel form">
      <div className="row2">
        <label>Name shown to clients<input className="field" name="display_name" required defaultValue={b?.display_name ?? defaults?.name ?? ""} /></label>
        <label>Company / brokerage<input className="field" name="company" defaultValue={b?.company ?? ""} /></label>
        <label>Licence type<select className="field" name="licence_type" defaultValue={b?.licence_type ?? "broker"}>{Object.entries(LICENCE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>FSC licence / registration number<input className="field" name="fsc_licence_no" required defaultValue={b?.fsc_licence_no ?? ""} /></label>
        <label>Phone<input className="field" name="phone" inputMode="tel" defaultValue={b?.phone ?? ""} /></label>
        <label>Email for leads<input className="field" name="email" type="email" defaultValue={b?.email ?? defaults?.email ?? ""} /></label>
        <label>WhatsApp<input className="field" name="whatsapp" inputMode="tel" defaultValue={b?.whatsapp ?? ""} /></label>
        <label>Website<input className="field" name="website" defaultValue={b?.website ?? ""} /></label>
      </div>
      <label>About you<textarea className="field" name="bio" rows={4} defaultValue={b?.bio ?? ""} placeholder="Who you help, your experience, how you work with self-employed clients." /></label>
      <fieldset><legend className="lbl">Cover you arrange</legend>{multi("products", PRODUCTS.map((p) => [p.id, p.name]), b?.products)}</fieldset>
      <fieldset><legend className="lbl">Insurers you place with</legend>{multi("insurers", INSURERS.map((i) => [i, i]), b?.insurers)}</fieldset>
      <fieldset><legend className="lbl">Parishes you serve</legend>{multi("parishes", PARISHES.map((p) => [p, p]), b?.parishes)}</fieldset>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.ok && <p className="ok" role="status">{state.ok}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : b ? "Save profile" : "Submit for verification"}</button>
    </form>
  );
}
