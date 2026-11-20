import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { KIND_LABEL, MDLINK_URL, listings, mapsHref, telHref } from "@/lib/data";

export function generateStaticParams() { return listings.map((l) => ({ id: l.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = listings.find((x) => x.id === id);
  return l ? { title: l.name, description: `${KIND_LABEL[l.kind]} in ${l.parish ?? "Jamaica"}: contact details, directions and booking.` } : {};
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = listings.find((x) => x.id === id);
  if (!l) notFound();
  const subject = `Appointment request`;
  const body = `Hello,\n\nI found ${l.name} on Yaad Doctor and would like to book an appointment.\n\nName:\nPhone:\nPreferred days and times:\nReason for visit (optional):\nInsurance card (if any):\n\nThank you.`;
  const mailto = l.email ? `mailto:${l.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : null;
  const nearby = listings.filter((x) => x.id !== l.id && x.parish === l.parish && x.kind !== "pharmacy" && x.verified_contact).slice(0, 4);

  return (
    <div className="wrap detail">
      <div>
        <Link href="/find" className="note" style={{ textDecoration: "none" }}>← All listings</Link>
        <div style={{ display: "flex", gap: 22, alignItems: "center", margin: "18px 0 26px", flexWrap: "wrap" }}>
          <Avatar l={l} large />
          <div style={{ minWidth: 0 }}>
            <span className="eyebrow">{KIND_LABEL[l.kind]}{l.parish ? ` · ${l.parish}` : ""}</span>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", marginTop: 12 }}>{l.name}</h1>
            {l.practice && <p className="meta" style={{ fontSize: 17 }}>{l.practice}</p>}
          </div>
        </div>
        <div className="panel">
          <h2>Details</h2>
          <dl className="dl">
            {l.specialties.length > 0 && <><dt>Speciality</dt><dd><div className="pills" style={{ margin: 0 }}>{l.specialties.map((s) => <span key={s} className="pill">{s}</span>)}</div></dd></>}
            {l.services.length > 0 && <><dt>Services</dt><dd>{l.services.join(", ")}</dd></>}
            <dt>Address</dt><dd>{l.address ?? "Not published"}{l.parish ? `, ${l.parish}` : ""}</dd>
            <dt>Phone</dt><dd>{l.phones.length ? l.phones.map((p) => <div key={p}><a href={telHref(p)}>{p}</a></div>) : "Not published"}</dd>
            {l.email && <><dt>Email</dt><dd><a href={`mailto:${l.email}`}>{l.email}</a></dd></>}
            {l.website && <><dt>Website</dt><dd><a href={l.website} target="_blank" rel="noopener">{l.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></>}
            {l.hours && <><dt>Hours</dt><dd>{l.hours}</dd></>}
            {l.sector && <><dt>Sector</dt><dd style={{ textTransform: "capitalize" }}>{l.sector}</dd></>}
            {l.emergency && <><dt>Emergency</dt><dd>Listed as offering emergency care</dd></>}
            <dt>Insurance</dt><dd>{l.kind === "pharmacy" ? "Ask whether they accept NHF and JADEP cards, and your insurance card." : "Not yet confirmed. Call and ask whether they accept your Sagicor, Guardian Life, Canopy, BUPA or other card."}</dd>
          </dl>
        </div>
        <div className="panel">
          <h2>Where this comes from</h2>
          <ul className="src">
            {l.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.name}</a> (as of {s.date})</li>)}
          </ul>
          <p className="note">{l.approx ? "The map pin is approximate (town centre), so check the address before you travel. " : ""}Details can change. Please call ahead. Is this your practice? Corrections are welcome; see <Link href="/about">About the data</Link>.</p>
        </div>
        {nearby.length > 0 && (
          <div className="panel">
            <h2>Also in {l.parish}</h2>
            <ul className="src" style={{ listStyle: "none", padding: 0 }}>
              {nearby.map((n) => <li key={n.id}><Link href={`/listing/${n.id}`}>{n.name}</Link> · {KIND_LABEL[n.kind]}</li>)}
            </ul>
          </div>
        )}
      </div>
      <aside className="book" id="book" aria-label="Book or contact">
        <div className="panel" style={{ display: "grid", gap: 10 }}>
          <h2 style={{ marginBottom: 4 }}>Book a visit</h2>
          {l.phones[0] && <a className="btn btn-primary" href={telHref(l.phones[0])}>Call to book · {l.phones[0].replace("+1 ", "")}</a>}
          {mailto && <a className="btn btn-ghost" href={mailto}>Email an appointment request</a>}
          {!l.phones[0] && !mailto && <p className="note" style={{ margin: 0 }}>This place hasn't published a phone number or email that we could find. Use directions, or see a doctor online.</p>}
          <a className="btn btn-ghost" href={mapsHref(l)} target="_blank" rel="noopener">Get directions</a>
        </div>
        <div className="live" style={{ padding: 22 }}>
          <span className="eyebrow"><span className="pulse" aria-hidden /> Can't wait?</span>
          <h3 style={{ fontSize: 24 }}>See a doctor online now</h3>
          <p>Video visit with a licensed doctor through MDLink.</p>
          <a className="btn btn-orange" href={MDLINK_URL} target="_blank" rel="noopener">Start on MDLink ↗</a>
        </div>
      </aside>
    </div>
  );
}
