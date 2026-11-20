import { redirect } from "next/navigation";
import HqShell from "@/components/HqShell";
import { session } from "@/lib/hq";
import { adminClient } from "@/lib/supabase/server";
import { adminAssignLead, adminSetBroker } from "@/app/hq/actions";
import { LICENCE_TYPES, productName } from "@/lib/insurance";
export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";
export default async function Admin() {
  const { isAdmin, broker } = await session({ needBroker: false });
  if (!isAdmin) redirect("/hq");
  const db = adminClient();
  const [{ data: brokers }, { data: requests }, { data: claims }] = await Promise.all([
    db.from("brokers").select("id,display_name,company,licence_type,fsc_licence_no,email,phone,status,plan,featured,created_at").order("created_at", { ascending: false }),
    db.from("quote_requests").select("id,full_name,phone,parish,coverage,created_at,leads(id)").order("created_at", { ascending: false }).limit(100),
    db.from("listing_claims").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const verified = (brokers ?? []).filter((b) => b.status === "verified");
  const unmatched = (requests ?? []).filter((q) => !(q.leads as unknown[])?.length);
  return (
    <HqShell active="/hq/admin" title="Admin" status={broker?.status} isAdmin>
      <div className="panel">
        <h2>Brokers ({brokers?.length ?? 0})</h2>
        <p className="note">Before verifying, check the licence number on the <a href="https://www.fscjamaica.org" target="_blank" rel="noopener">FSC register</a>.</p>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Broker</th><th>Licence</th><th>Status</th><th>Plan</th><th></th></tr></thead>
            <tbody>{(brokers ?? []).map((b) => (
              <tr key={b.id}>
                <td><b>{b.display_name}</b>{b.company ? <div className="note">{b.company}</div> : null}<div className="note">{b.email ?? ""} {b.phone ?? ""}</div></td>
                <td>{b.fsc_licence_no}<div className="note">{LICENCE_TYPES[b.licence_type]}</div></td>
                <td><span className={`pill ${b.status === "verified" ? "" : "o"}`}>{b.status}</span></td>
                <td>{b.plan}{b.featured ? " ★" : ""}</td>
                <td>
                  <form action={adminSetBroker} className="actions">
                    <input type="hidden" name="id" value={b.id} />
                    <select className="field" name="status" defaultValue={b.status} aria-label="Status">{["pending", "verified", "rejected", "suspended"].map((s) => <option key={s}>{s}</option>)}</select>
                    <select className="field" name="plan" defaultValue={b.plan} aria-label="Plan">{["starter", "pro", "agency"].map((s) => <option key={s}>{s}</option>)}</select>
                    <select className="field" name="featured" defaultValue={String(b.featured)} aria-label="Featured"><option value="false">Not featured</option><option value="true">Featured</option></select>
                    <button className="btn btn-primary btn-sm">Save</button>
                  </form>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <h2>Unmatched quote requests ({unmatched.length})</h2>
        {!unmatched.length ? <p className="note">Every request has been sent to at least one broker.</p> : (
          <ul className="doclist">{unmatched.map((q) => (
            <li key={q.id}>
              <div><b>{q.full_name}</b> · {q.phone}<div className="note">{q.parish ?? "No parish"} · {(q.coverage as string[]).map(productName).join(", ")} · {new Date(q.created_at).toLocaleDateString("en-JM")}</div></div>
              {verified.length > 0 && <form action={adminAssignLead} className="actions"><input type="hidden" name="quote_request_id" value={q.id} /><select className="field" name="broker_id" aria-label="Broker">{verified.map((b) => <option key={b.id} value={b.id}>{b.display_name}</option>)}</select><button className="btn btn-ghost btn-sm">Send</button></form>}
            </li>))}</ul>
        )}
      </div>
      <div className="panel">
        <h2>Practice listing requests ({claims?.length ?? 0})</h2>
        {!claims?.length ? <p className="note">None yet.</p> : (
          <ul className="doclist">{claims.map((c) => (
            <li key={c.id}><div><b>{c.practice_name}</b> {c.wants_featured && <span className="pill o">Wants featured</span>}<div className="note">{c.contact_name}{c.role ? `, ${c.role}` : ""} · {c.email} {c.phone ?? ""} · {new Date(c.created_at).toLocaleDateString("en-JM")}</div>{c.details && <div className="note">{c.details}</div>}</div></li>))}</ul>
        )}
      </div>
    </HqShell>
  );
}
