import HqShell from "@/components/HqShell";
import { session } from "@/lib/hq";
import { leadToClient, setLeadStatus } from "@/app/hq/actions";
import { productName } from "@/lib/insurance";
export const metadata = { title: "Leads" };
type Q = { full_name: string; email: string | null; phone: string; parish: string | null; occupation: string | null; coverage: string[]; household_size: number | null; monthly_budget: string | null; current_insurer: string | null; notes: string | null; created_at: string };
export default async function Leads() {
  const { db, broker, isAdmin } = await session();
  const { data } = await db.from("leads").select("id,status,created_at,quote_requests(full_name,email,phone,parish,occupation,coverage,household_size,monthly_budget,current_insurer,notes,created_at)").order("created_at", { ascending: false }).limit(200);
  const leads = (data ?? []) as unknown as { id: string; status: string; created_at: string; quote_requests: Q }[];
  return (
    <HqShell active="/hq/leads" title="Leads" status={broker!.status} isAdmin={isAdmin}>
      {leads.length === 0 ? <div className="empty">No leads yet. They appear here as soon as someone requests a quote from you{broker!.status !== "verified" ? " (once you're verified)" : ""}.</div> : (
        <ul className="cards">
          {leads.map((l) => { const q = l.quote_requests; const wa = q.phone.replace(/\D/g, ""); return (
            <li key={l.id} className="card" style={{ gridTemplateColumns: "1fr auto" }}>
              <div style={{ minWidth: 0 }}>
                <h3>{q.full_name}</h3>
                <p className="meta">{new Date(l.created_at).toLocaleDateString("en-JM", { day: "numeric", month: "short" })}{q.parish ? ` · ${q.parish}` : ""}{q.occupation ? ` · ${q.occupation}` : ""}{q.household_size ? ` · ${q.household_size} ${q.household_size === 1 ? "person" : "people"}` : ""}{q.monthly_budget ? ` · ${q.monthly_budget}` : ""}</p>
                <div className="pills">{q.coverage.map((c) => <span key={c} className="pill">{productName(c)}</span>)}{q.current_insurer && <span className="pill q">Now: {q.current_insurer}</span>}</div>
                {q.notes && <p style={{ margin: "0 0 10px", fontSize: 14 }}>{q.notes}</p>}
                <div className="actions">
                  <a className="btn btn-primary btn-sm" href={`tel:${q.phone.replace(/\s/g, "")}`}>Call {q.phone}</a>
                  {wa.length >= 7 && <a className="btn btn-ghost btn-sm" href={`https://wa.me/${wa.length === 7 ? "1876" + wa : wa.length === 10 ? "1" + wa : wa}`} target="_blank" rel="noopener">WhatsApp</a>}
                  {q.email && <a className="btn btn-ghost btn-sm" href={`mailto:${q.email}`}>Email</a>}
                  <form action={leadToClient}><input type="hidden" name="id" value={l.id} /><button className="btn btn-ghost btn-sm">Make client</button></form>
                </div>
              </div>
              <form action={setLeadStatus} className="side" style={{ display: "grid", gap: 6 }}>
                <input type="hidden" name="id" value={l.id} />
                <select className="field" name="status" defaultValue={l.status} aria-label="Lead status">{["new", "contacted", "quoted", "won", "lost"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
                <button className="btn btn-ghost btn-sm">Update</button>
              </form>
            </li>); })}
        </ul>
      )}
    </HqShell>
  );
}
