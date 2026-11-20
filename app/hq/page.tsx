import Link from "next/link";
import HqShell from "@/components/HqShell";
import { session, LIMITS, monthStart } from "@/lib/hq";
export const metadata = { title: "Brokers HQ" };
export default async function HQ() {
  const { db, broker, isAdmin } = await session();
  const since = monthStart();
  const [leads, newLeads, clients, pendingSig, signed] = await Promise.all([
    db.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("clients").select("id", { count: "exact", head: true }),
    db.from("signature_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "viewed"]),
    db.from("signature_requests").select("id", { count: "exact", head: true }).eq("status", "signed").gte("signed_at", since),
  ]);
  const lim = LIMITS[broker!.plan];
  const stats: [string, number | null, string][] = [
    ["New leads waiting", newLeads.count, "/hq/leads"], ["Leads this month", leads.count, "/hq/leads"],
    ["Clients", clients.count, "/hq/clients"], ["Awaiting signature", pendingSig.count, "/hq/signatures"], ["Signed this month", signed.count, "/hq/signatures"],
  ];
  return (
    <HqShell active="/hq" title={`Welcome, ${broker!.display_name.split(" ")[0]}`} status={broker!.status} isAdmin={isAdmin}>
      <div className="grid stat-grid">
        {stats.map(([l, v, href]) => <Link key={l} href={href} className="tile"><span className="n">{l}</span><span className="stat">{v ?? 0}</span></Link>)}
      </div>
      <div className="panel" style={{ marginTop: 18 }}>
        <h2>Your plan: {broker!.plan[0].toUpperCase() + broker!.plan.slice(1)}</h2>
        {broker!.plan === "starter"
          ? <p>Includes {lim.leads} new leads, {lim.clients} clients and {lim.signatures} e-signatures a month. <Link href="/hq/billing">Upgrade to Pro</Link> for unlimited leads, clients and signatures, and better placement.</p>
          : <p>Unlimited leads, clients and e-signatures.</p>}
      </div>
      <div className="panel">
        <h2>Quick start</h2>
        <ol className="src" style={{ fontSize: 15 }}>
          <li><Link href="/hq/profile">Complete your profile</Link> so clients can see what you offer.</li>
          <li><Link href="/hq/clients/new">Add a client</Link>, then upload their ID, forms and policy documents to their secure folder.</li>
          <li>Send any PDF for e-signature. Your client signs on their phone and you get back a signed copy with an audit certificate.</li>
        </ol>
      </div>
    </HqShell>
  );
}
