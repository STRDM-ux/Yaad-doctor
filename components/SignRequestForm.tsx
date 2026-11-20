"use client";
import { useActionState, useState } from "react";
import { requestSignature, type FormState } from "@/app/hq/actions";
export default function SignRequestForm({ documentId, name, email, phone }: { documentId: string; name: string; email?: string | null; phone?: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestSignature, {});
  const [copied, setCopied] = useState(false);
  if (state.link) {
    const wa = (phone ?? "").replace(/\D/g, "");
    const text = encodeURIComponent(`Hi ${name}, please review and sign your document here: ${state.link}`);
    return (
      <div className="form" style={{ marginTop: 10 }}>
        <p className="ok" role="status">{state.ok}</p>
        <input className="field" readOnly value={state.link} onFocus={(e) => e.target.select()} aria-label="Signing link" />
        <div className="actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(state.link!); setCopied(true); }}>{copied ? "Copied" : "Copy link"}</button>
          <a className="btn btn-ghost btn-sm" href={`https://wa.me/${wa.length === 10 ? "1" + wa : wa.length === 7 ? "1876" + wa : wa}?text=${text}`} target="_blank" rel="noopener">Send on WhatsApp</a>
          <a className="btn btn-ghost btn-sm" href={`sms:${phone ?? ""}?&body=${text}`}>Send by SMS</a>
        </div>
      </div>
    );
  }
  return (
    <details className="sign-req">
      <summary className="btn btn-ghost btn-sm">Send for signature</summary>
      <form action={action} className="form" style={{ marginTop: 10 }}>
        <input type="hidden" name="document_id" value={documentId} />
        <div className="row2">
          <label>Signer name<input className="field" name="signer_name" required defaultValue={name} /></label>
          <label>Signer email (optional)<input className="field" name="signer_email" type="email" defaultValue={email ?? ""} /></label>
          <label>Signer phone<input className="field" name="signer_phone" defaultValue={phone ?? ""} /></label>
        </div>
        <label>Message (optional)<textarea className="field" name="message" rows={2} /></label>
        {state.error && <p className="error" role="alert">{state.error}</p>}
        <button className="btn btn-orange btn-sm" disabled={pending}>{pending ? "Creating…" : "Create signing link"}</button>
      </form>
    </details>
  );
}
