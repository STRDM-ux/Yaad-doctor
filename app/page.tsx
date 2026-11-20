import Link from "next/link";
import LiveCard from "@/components/LiveCard";
import { listings, PARISHES, specialtyCounts } from "@/lib/data";

export default function Home() {
  const withContact = listings.filter((l) => l.verified_contact).length;
  const specs = specialtyCounts().filter(([s]) => s !== "Hospital care").slice(0, 16);
  return (
    <>
      <div className="wrap hero">
        <div>
          <span className="eyebrow"><span className="pulse" aria-hidden /> All 14 parishes · {listings.length} places</span>
          <h1>Good care, <i>on your schedule.</i></h1>
          <p className="lede">For musicians, tradespeople, sitters, drivers and everyone who works for themselves. Find a doctor, hospital, clinic, dentist or pharmacy near you, or see a doctor online in minutes.</p>
          <form className="search" action="/find" role="search">
            <label className="visually-hidden" htmlFor="q" style={{ position: "absolute", left: -9999 }}>What do you need?</label>
            <input id="q" name="q" placeholder="Try “paediatric”, “dentist”, “Andrews”" autoComplete="off" />
            <label htmlFor="parish" style={{ position: "absolute", left: -9999 }}>Parish</label>
            <select id="parish" name="parish" defaultValue="">
              <option value="">All parishes</option>
              {PARISHES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button className="btn btn-primary" type="submit">Search</button>
          </form>
          <div className="trust">
            <span><b>{listings.length}</b> listings</span>
            <span><b>{withContact}</b> with a published phone or email</span>
            <span><b>14</b> parishes</span>
            <span><b>Free</b> to use</span>
          </div>
        </div>
        <LiveCard />
      </div>

      <section className="block wrap" aria-labelledby="spec-h">
        <div className="section-head">
          <h2 id="spec-h">Browse by <i>speciality</i></h2>
          <p>From family doctors and public health centres to heart, children's and women's health specialists.</p>
        </div>
        <div className="grid spec-grid">
          {specs.map(([s, n]) => (
            <Link key={s} className="tile" href={`/find?spec=${encodeURIComponent(s)}`}>
              <span className="arrow" aria-hidden>↗</span>
              <span className="t">{s}</span>
              <span className="n">{n} {n === 1 ? "place" : "places"}</span>
            </Link>
          ))}
          <Link className="tile" href="/find?kind=pharmacy">
            <span className="arrow" aria-hidden>↗</span><span className="t">Pharmacies</span>
            <span className="n">{listings.filter((l) => l.kind === "pharmacy").length} places · ask about NHF & JADEP</span>
          </Link>
        </div>
      </section>

      <section className="block wrap" aria-labelledby="how-h">
        <div className="section-head"><h2 id="how-h">Three ways to <i>get seen</i></h2></div>
        <div className="grid steps">
          <div className="step"><span className="num">01 — Online</span><h3>Video visit now</h3><p>Feeling unwell but can't stop working? See a licensed doctor online through MDLink, usually without leaving the job site.</p></div>
          <div className="step"><span className="num">02 — Nearby</span><h3>Find care close by</h3><p>Use your location or pick a parish. Every listing shows where it is, how to reach it, and where the information came from.</p></div>
          <div className="step"><span className="num">03 — Book</span><h3>Call or request a visit</h3><p>Tap to call, or send the practice a ready-written appointment request by email. Ask which insurance cards they take before you go.</p></div>
        </div>
      </section>

      <section className="block wrap">
        <div className="band">
          <div>
            <h2 style={{ color: "#fff8e8" }}>Built for people who <i>work for themselves.</i></h2>
            <p>No HR department and no company plan means you sort out your own health. Yaad Doctor keeps it simple: one place to find care, compare options and get seen fast.</p>
            <div className="actions"><Link className="btn btn-orange" href="/insurance">Get free insurance quotes</Link><Link className="btn btn-ghost" href="/find" style={{ color: "#fff8e8", borderColor: "rgba(255,255,255,.25)", background: "transparent" }}>Find care near me</Link></div>
          </div>
          <ul>
            <li><b>Get covered.</b> Tell us what you need once and up to three FSC-licensed brokers compare Sagicor, Guardian Life, Canopy, BUPA and more for you, free.</li>
            <li><b>Pharmacies included.</b> Ask about NHF and JADEP drug cards at the counter.</li>
            <li><b>Sources on every listing.</b> We show where each detail came from, so you can judge how current it is.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
