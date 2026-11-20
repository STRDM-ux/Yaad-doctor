import Link from "next/link";
import HqShell from "@/components/HqShell";
import { session } from "@/lib/hq";
export const metadata = { title: "Clients" };
export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { db, broker, isAdmin } = await session();
  const { q = "" } = await searchParams;
  let query = db.from("clients").select("id,full_name,phone,email,parish,status,updated_at").order("updated_at", { ascending: false }).limit(300);
  if (q) query = query.ilike("full_name", `%${q.replace(/[%_,()]/g, "")}%`);
  const { data } = await query;
  return (
    <HqShell active="/hq/clients" title="Clients" status={broker!.status} isAdmin={isAdmin} action={<Link className="btn btn-primary btn-sm" href="/hq/clients/new">Add client</Link>}>
      <form style={{ marginBottom: 14 }}><input className="field" name="q" defaultValue={q} placeholder="Search clients by name" aria-label="Search clients" /></form>
      {!data?.length ? <div className="empty">{q ? "No clients match." : "No clients yet. Add one, or turn a lead into a client from your lead inbox."}</div> : (
        <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Parish</th><th>Status</th></tr></thead>
            <tbody>{data.map((c) => <tr key={c.id}><td><Link href={`/hq/clients/${c.id}`}>{c.full_name}</Link></td><td>{c.phone ?? "—"}</td><td>{c.parish ?? "—"}</td><td><span className="pill q">{c.status}</span></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </HqShell>
  );
}
