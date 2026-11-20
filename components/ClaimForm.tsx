"use client";
import { useActionState } from "react";
import { submitClaim, type ClaimState } from "@/app/for-practices/actions";
export default function ClaimForm({ listingId, practice }: { listingId?: string; practice?: string }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(submitClaim, {});
  if (state.ok) return <div className="panel" role="status"><h2>Thanks, we've got it</h2><p>We'll be in touch within one working day to confirm your details.</p></div>;
  return (
    <form action={action} className="panel form">
      <h2>Claim or feature your practice</h2>
      <input type="hidden" name="listing_id" value={listingId ?? ""} />
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: "absolute", left: -9999 }} />
      <div className="row2">
        <label>Practice name<input className="field" name="practice_name" required defaultValue={practice ?? ""} /></label>
        <label>Your name<input className="field" name="contact_name" required autoComplete="name" /></label>
        <label>Your role<input className="field" name="role" placeholder="Doctor, practice manager…" /></label>
        <label>Email<input className="field" name="email" type="email" required autoComplete="email" /></label>
        <label>Phone<input className="field" name="phone" inputMode="tel" /></label>
      </div>
      <label>What should we add or correct?<textarea className="field" name="details" rows={3} placeholder="Hours, insurance cards you accept, specialities, a photo of your practice…" /></label>
      <label className="check"><input type="checkbox" name="wants_featured" /> I'm interested in a featured listing (J$4,900 a month)</label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
    </form>
  );
}
