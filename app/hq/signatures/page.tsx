import Link from "next/link";
import HqShell from "@/components/HqShell";
import { session } from "@/lib/hq";
import { cancelSignature } from "@/app/hq/actions";
export const metadata = { title: "E-signatures" };
export default async function Signatures() {
  const { db, broker, isAdmin } = await session();
  const { data } = await db.from("signature_requests").select("id,status,signer_name,created_at,signed_at,expires_at,client_id,documents!signature_requests_document_id_fkey(name)").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as unknown as { id: string; status: string; signer_name: string; created_at: string; signed_at: string | null; expires_at: string; client_id: string | null; documents: { name: string } | null }[];
  return (
    <HqShell active="/hq/signatures" title="E-signatures" status={broker!.status} isAdmin={isAdmin}>
      <p className="note" style={{ marginTop: 0 }}>To send a document, open a client, upload a PDF and choose "Send for signature". Signed copies are saved to the client's folder with an audit certificate.</p>
      {!rows.length ? <div className="empty">No signature requests yet.</div> : (
        <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Document</th><th>Signer</th><th>Status</th><th>Sent</th><th></th></tr></thead>
            <tbody>{rows.map((r) => {
              const expired = ["pending", "viewed"].includes(r.status) && new Date(r.expires_at) < new Date();
              return <tr key={r.id}>
                <td>{r.client_id ? <Link href={`/hq/clients/${r.client_id}`}>{r.documents?.name ?? "Document"}</Link> : r.documents?.name}</td>
                <td>{r.signer_name}</td><td><span className={`pill ${r.status === "signed" ? "" : "q"}`}>{expired ? "expired" : r.status}</span></td>
                <td>{new Date(r.created_at).toLocaleDateString("en-JM")}</td>
                <td>{["pending", "viewed"].includes(r.status) && !expired && <form action={cancelSignature}><input type="hidden" name="id" value={r.id} /><button className="btn btn-ghost btn-sm">Cancel</button></form>}</td>
              </tr>; })}</tbody>
          </table>
        </div>
      )}
    </HqShell>
  );
}
