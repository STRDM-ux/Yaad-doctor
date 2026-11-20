import { notFound } from "next/navigation";
import HqShell from "@/components/HqShell";
import ClientForm from "@/components/ClientForm";
import Uploader from "@/components/Uploader";
import SignRequestForm from "@/components/SignRequestForm";
import { session } from "@/lib/hq";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { cancelSignature, deleteDocument, openDocument } from "@/app/hq/actions";

export const metadata = { title: "Client" };
const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, broker, isAdmin } = await session();
  const { data: client } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();
  const [{ data: docs }, { data: reqs }] = await Promise.all([
    db.from("documents").select("id,name,mime,size_bytes,kind,created_at").eq("client_id", id).order("created_at", { ascending: false }),
    db.from("signature_requests").select("id,status,signer_name,created_at,signed_at,expires_at,document_id,signed_document_id").eq("client_id", id).order("created_at", { ascending: false }),
  ]);
  const docName = new Map((docs ?? []).map((d) => [d.id, d.name]));
  return (
    <HqShell active="/hq/clients" title={client.full_name} status={broker!.status} isAdmin={isAdmin}>
      <div className="panel">
        <h2>Documents</h2>
        <Uploader url={SUPABASE_URL} anonKey={SUPABASE_ANON_KEY} brokerId={broker!.id} clientId={id} />
        {docs?.length ? (
          <ul className="doclist">
            {docs.map((d) => (
              <li key={d.id}>
                <div style={{ minWidth: 0 }}>
                  <b style={{ overflowWrap: "anywhere" }}>{d.name}</b> {d.kind === "signed" && <span className="pill o">Signed</span>}
                  <div className="note">{size(d.size_bytes ?? 0)} · {new Date(d.created_at).toLocaleDateString("en-JM")}</div>
                </div>
                <div className="actions">
                  <form action={openDocument}><input type="hidden" name="id" value={d.id} /><button className="btn btn-ghost btn-sm">Download</button></form>
                  {d.kind === "upload" && d.mime === "application/pdf" && <SignRequestForm documentId={d.id} name={client.full_name} email={client.email} phone={client.phone} />}
                  <form action={deleteDocument}><input type="hidden" name="id" value={d.id} /><button className="btn btn-ghost btn-sm" aria-label={`Delete ${d.name}`}>Delete</button></form>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="note">No documents yet.</p>}
      </div>
      {reqs && reqs.length > 0 && (
        <div className="panel">
          <h2>Signature requests</h2>
          <ul className="doclist">
            {reqs.map((r) => (
              <li key={r.id}>
                <div><b>{docName.get(r.document_id) ?? "Document"}</b><div className="note">{r.signer_name} · {r.status === "signed" ? `signed ${new Date(r.signed_at!).toLocaleString("en-JM")}` : r.status}</div></div>
                {["pending", "viewed"].includes(r.status) && <form action={cancelSignature}><input type="hidden" name="id" value={r.id} /><button className="btn btn-ghost btn-sm">Cancel</button></form>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <h2 style={{ fontSize: 26, margin: "26px 0 12px" }}>Details</h2>
      <ClientForm client={client} />
    </HqShell>
  );
}
