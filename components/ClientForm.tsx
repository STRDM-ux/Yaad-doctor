"use client";
import { useActionState } from "react";
import { saveClient, type FormState } from "@/app/hq/actions";
import { PARISHES } from "@/lib/data";
type C = Record<string, string | null> | null;
export default function ClientForm({ client }: { client?: C }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveClient, {});
  const v = (k: string) => (client?.[k] as string) ?? "";
  return (
    <form action={action} className="panel form">
      {client?.id && <input type="hidden" name="id" value={client.id} />}
      <div className="row2">
        <label>Full name<input className="field" name="full_name" required defaultValue={v("full_name")} /></label>
        <label>Status<select className="field" name="status" defaultValue={v("status") || "active"}><option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label>Phone<input className="field" name="phone" inputMode="tel" defaultValue={v("phone")} /></label>
        <label>Email<input className="field" name="email" type="email" defaultValue={v("email")} /></label>
        <label>Date of birth<input className="field" name="date_of_birth" type="date" defaultValue={v("date_of_birth")} /></label>
        <label>TRN<input className="field" name="trn" inputMode="numeric" defaultValue={v("trn")} autoComplete="off" /></label>
        <label>Occupation<input className="field" name="occupation" defaultValue={v("occupation")} /></label>
        <label>Parish<select className="field" name="parish" defaultValue={v("parish")}><option value="">—</option>{PARISHES.map((p) => <option key={p}>{p}</option>)}</select></label>
      </div>
      <label>Address<input className="field" name="address" defaultValue={v("address")} /></label>
      <label>Policies (insurer, policy number, renewal date)<textarea className="field" name="policies" rows={3} defaultValue={v("policies")} /></label>
      <label>Notes<textarea className="field" name="notes" rows={4} defaultValue={v("notes")} /></label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.ok && <p className="ok" role="status">{state.ok}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : client ? "Save client" : "Add client"}</button>
    </form>
  );
}
