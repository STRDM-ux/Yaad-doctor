import { notFound } from "next/navigation";
import SignPad from "@/components/SignPad";
import { adminClient } from "@/lib/supabase/server";
import { findRequest } from "@/lib/signing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review and sign", robots: { index: false } };
export default async function Sign({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await findRequest(token);
  if (!r) notFound();
  const db = adminClient();
  const expired = new Date(r.expires_at) < new Date();
  const from = r.brokers.company ? `${r.brokers.display_name}, ${r.brokers.company}` : r.brokers.display_name;
  if (r.status === "signed" || r.status === "cancelled" || r.status === "declined" || expired) {
    let signedUrl: string | null = null;
    if (r.status === "signed" && r.signed_document_id) {
      const { data: d } = await db.from("documents").select("storage_path,name").eq("id", r.signed_document_id).single();
      if (d) signedUrl = (await db.storage.from("client-docs").createSignedUrl(d.storage_path, 600, { download: d.name })).data?.signedUrl ?? null;
    }
    return (
      <div className="wrap prose">
        <h1>{r.status === "signed" ? <>Signed. <i>Thank you.</i></> : "This link is no longer active"}</h1>
        <p>{r.status === "signed" ? `${from} has your signed copy of ${r.documents.name}.` : r.status === "cancelled" ? "The sender cancelled this request." : r.status === "declined" ? "You declined to sign this document." : "This signing link has expired. Ask the sender for a new one."}</p>
        {signedUrl && <a className="btn btn-primary" href={signedUrl}>Download your signed copy</a>}
      </div>
    );
  }
  if (r.status === "pending") await db.from("signature_requests").update({ status: "viewed", viewed_at: new Date().toISOString() }).eq("id", r.id).eq("status", "pending");
  const { data: view } = await db.storage.from("client-docs").createSignedUrl(r.documents.storage_path, 1800);
  return (
    <div className="wrap" style={{ padding: "36px 0 80px", maxWidth: 900 }}>
      <span className="eyebrow">Secure e-signature</span>
      <h1 style={{ fontSize: "clamp(30px,4.4vw,48px)", margin: "14px 0 8px" }}>{r.documents.name}</h1>
      <p className="lede" style={{ margin: "0 0 18px" }}>Sent to <b>{r.signer_name}</b> by {from} (FSC licence {r.brokers.fsc_licence_no}).</p>
      {r.message && <p className="panel" style={{ marginTop: 0 }}>{r.message}</p>}
      {view?.signedUrl && (
        <div className="panel" style={{ padding: 10 }}>
          <object data={view.signedUrl} type="application/pdf" className="pdf-view" aria-label="Document to sign">
            <p style={{ padding: 16 }}>Your browser can't show the PDF here. <a href={view.signedUrl} target="_blank" rel="noopener">Open the document</a> to read it before you sign.</p>
          </object>
          <p style={{ margin: "10px 6px 4px" }}><a href={view.signedUrl} target="_blank" rel="noopener">Open the full document in a new tab ↗</a></p>
        </div>
      )}
      <SignPad token={token} name={r.signer_name} />
    </div>
  );
}
