import Link from "next/link";
import { signOut } from "@/app/hq/actions";

const NAV = [["/hq", "Overview"], ["/hq/leads", "Leads"], ["/hq/clients", "Clients"], ["/hq/signatures", "E-signatures"], ["/hq/profile", "Profile"], ["/hq/billing", "Plan"]];
export default function HqShell({ active, title, status, isAdmin, children, action }: { active: string; title: string; status?: string; isAdmin?: boolean; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="wrap hq">
      <aside className="hq-nav" aria-label="Brokers HQ">
        <span className="lbl">Brokers HQ</span>
        <nav>
          {NAV.map(([href, label]) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined}>{label}</Link>)}
          {isAdmin && <Link href="/hq/admin" aria-current={active === "/hq/admin" ? "page" : undefined}>Admin</Link>}
        </nav>
        <form action={signOut}><button className="btn btn-ghost btn-sm" style={{ width: "100%" }}>Sign out</button></form>
      </aside>
      <div style={{ minWidth: 0 }}>
        {status === "pending" && <p className="disclaimer" style={{ marginTop: 0 }}>Your licence is being checked. You can set up clients and documents now; your profile appears in the marketplace once you're verified.</p>}
        {(status === "rejected" || status === "suspended") && <p className="disclaimer" style={{ marginTop: 0 }}>Your marketplace profile is not live ({status}). Contact us if you think this is a mistake.</p>}
        <div className="results-head"><h1>{title}</h1>{action}</div>
        {children}
      </div>
    </div>
  );
}
