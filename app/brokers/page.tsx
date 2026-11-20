import Link from "next/link";
import { PLANS } from "@/lib/insurance";
export const metadata = { title: "For insurance brokers", description: "Brokers HQ: leads from self-employed Jamaicans, a secure client document vault and e-signatures in one place." };
export default async function Brokers({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const { setup } = await searchParams;
  return (
    <>
      <div className="wrap hero">
        <div>
          <span className="eyebrow"><span className="pulse" aria-hidden /> Brokers HQ</span>
          <h1>Your brokerage, <i>in your pocket.</i></h1>
          <p className="lede">Get quote requests from self-employed Jamaicans who need cover, keep every client's documents in one secure place, and get forms signed on the client's phone in minutes, not days.</p>
          {setup ? <p className="disclaimer">Brokers HQ opens very soon. Check back shortly.</p> : <div className="actions"><Link className="btn btn-orange" href="/hq/login">Start free</Link><Link className="btn btn-ghost" href="/hq/login">Sign in</Link></div>}
        </div>
        <div className="live">
          <span className="eyebrow">What you get</span>
          <ul className="feature-list">
            <li><b>Qualified leads.</b> People choose you, or we match them to you by parish and cover type. Each request goes to at most 3 brokers.</li>
            <li><b>Client vault.</b> IDs, applications, medical forms and policies, stored privately and encrypted.</li>
            <li><b>E-signatures.</b> Send a PDF by WhatsApp or email. Clients sign with a finger, and you get a signed copy with an audit certificate.</li>
            <li><b>Verified badge.</b> We check your FSC licence, so clients can trust you.</li>
          </ul>
        </div>
      </div>
      <section className="block wrap" aria-labelledby="pr-h">
        <div className="section-head"><h2 id="pr-h">Simple <i>pricing</i></h2><p>Start free. Upgrade when the leads are paying off.</p></div>
        <div className="grid steps">
          {PLANS.map((p) => (
            <div key={p.id} className={`step plan${p.id === "pro" ? " current" : ""}`}>
              <span className="num">{p.id === "pro" ? "Most popular" : p.name}</span>
              <h3>{p.id === "pro" ? "Pro " : ""}{p.price}<small>{p.per}</small></h3>
              <ul className="src">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="note">Prices are in Jamaican dollars. Only licensed intermediaries registered with the Financial Services Commission can join.</p>
      </section>
    </>
  );
}
