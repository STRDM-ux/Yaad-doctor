import Link from "next/link";
import QuoteForm from "@/components/QuoteForm";
import { verifiedBrokers } from "@/lib/brokers";
import { dbReady } from "@/lib/supabase/env";
import { LICENCE_TYPES, PRODUCTS, productName } from "@/lib/insurance";

export const revalidate = 60;
export const metadata = { title: "Health insurance marketplace", description: "Compare health, life and income protection cover for self-employed Jamaicans and get free quotes from FSC-licensed brokers." };

export default async function Insurance() {
  const brokers = await verifiedBrokers();
  return (
    <>
      <div className="wrap hero" style={{ alignItems: "start" }}>
        <div>
          <span className="eyebrow"><span className="pulse" aria-hidden /> Licensed brokers · free quotes</span>
          <h1>Cover for people who <i>cover themselves.</i></h1>
          <p className="lede">No employer plan? Tell us what you need once, and up to three FSC-licensed brokers will compare Sagicor, Guardian Life, Canopy, BUPA and more for you. Free, with no obligation.</p>
          <div className="trust">
            <span><b>{brokers.length}</b> verified {brokers.length === 1 ? "broker" : "brokers"}</span>
            <span><b>3</b> quotes max, so no spam</span>
            <span><b>J$0</b> to you</span>
          </div>
        </div>
        <div id="quote"><QuoteForm brokers={brokers.map(({ id, display_name, company }) => ({ id, display_name, company }))} enabled={dbReady()} /></div>
      </div>

      <section className="block wrap" aria-labelledby="cv-h" style={{ paddingTop: 24 }}>
        <div className="section-head"><h2 id="cv-h">Cover for <i>every kind of work</i></h2></div>
          <div className="grid spec-grid" >
            {PRODUCTS.map((p) => (
              <div key={p.id} className="tile" style={{ cursor: "default" }}><span className="t">{p.name}</span><span className="note" style={{ margin: 0 }}>{p.blurb}</span></div>
            ))}
          </div>
      </section>

      <section className="block wrap" aria-labelledby="br-h">
        <div className="section-head">
          <h2 id="br-h">Licensed <i>brokers</i></h2>
          <p>Every broker here gave us their Financial Services Commission licence number, and we checked it before they were listed.</p>
        </div>
        {brokers.length === 0 ? (
          <div className="empty">Our first brokers are being verified now. Send a request above and we'll match you as soon as they're live. <br /><br />Are you a licensed broker? <Link href="/brokers">Join Yaad Doctor for Brokers</Link>.</div>
        ) : (
          <ul className="cards">
            {brokers.map((b) => (
              <li key={b.id} className="card">
                <div className="avatar k-doctor" aria-hidden>{b.display_name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <h3><Link href={`/insurance/brokers/${b.id}`}>{b.display_name}</Link></h3>
                  <p className="meta">{LICENCE_TYPES[b.licence_type]}{b.company ? ` · ${b.company}` : ""} · FSC licence {b.fsc_licence_no}</p>
                  <div className="pills">
                    {b.featured && <span className="pill o">Featured</span>}
                    {b.products.slice(0, 4).map((p) => <span key={p} className="pill">{productName(p)}</span>)}
                    {b.parishes.length > 0 && <span className="pill q">{b.parishes.length > 3 ? `${b.parishes.length} parishes` : b.parishes.join(", ")}</span>}
                  </div>
                  <div className="actions"><Link className="btn btn-primary btn-sm" href={`/insurance/brokers/${b.id}#quote`}>Get a quote</Link></div>
                </div>
                <div className="side"><b>✓</b>verified</div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="block wrap">
        <p className="disclaimer">Yaad Doctor is a marketplace that introduces you to licensed insurance intermediaries. We are not an insurer or a broker and do not give insurance advice. Check any broker's licence with the <a href="https://www.fscjamaica.org" target="_blank" rel="noopener">Financial Services Commission</a>.</p>
      </section>
    </>
  );
}
