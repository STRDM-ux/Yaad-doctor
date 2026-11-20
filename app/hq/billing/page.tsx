import HqShell from "@/components/HqShell";
import { session } from "@/lib/hq";
import { PLANS } from "@/lib/insurance";
export const metadata = { title: "Plan" };
export default async function Billing() {
  const { broker, isAdmin } = await session();
  const contact = process.env.SALES_EMAIL || process.env.ADMIN_EMAILS?.split(",")[0] || "";
  return (
    <HqShell active="/hq/billing" title="Your plan" status={broker!.status} isAdmin={isAdmin}>
      <div className="grid steps">
        {PLANS.map((p) => (
          <div key={p.id} className={`step plan${p.id === broker!.plan ? " current" : ""}`}>
            <span className="num">{p.id === broker!.plan ? "Current plan" : p.name}</span>
            <h3>{p.price}<small>{p.per}</small></h3>
            <ul className="src">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {p.id !== broker!.plan && p.id !== "starter" && contact && (
              <a className="btn btn-orange btn-sm" href={`mailto:${contact}?subject=${encodeURIComponent(`Upgrade to ${p.name}`)}&body=${encodeURIComponent(`Broker: ${broker!.display_name}\nFSC licence: ${broker!.fsc_licence_no}\nPlan: ${p.name}`)}`}>Upgrade to {p.name}</a>
            )}
          </div>
        ))}
      </div>
      <p className="note">Online card payments are coming soon. Until then, upgrades are invoiced: request one and we'll send an invoice you can pay by bank transfer.</p>
    </HqShell>
  );
}
