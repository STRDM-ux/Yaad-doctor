import Link from "next/link";
import { notFound } from "next/navigation";
import QuoteForm from "@/components/QuoteForm";
import { brokerById } from "@/lib/brokers";
import { LICENCE_TYPES, productName } from "@/lib/insurance";

export const revalidate = 60;
export default async function BrokerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await brokerById(id);
  if (!b) notFound();
  const wa = b.whatsapp?.replace(/\D/g, "");
  return (
    <div className="wrap detail">
      <div>
        <Link href="/insurance" className="note" style={{ textDecoration: "none" }}>← All brokers</Link>
        <span className="eyebrow" style={{ marginTop: 18 }}>✓ Verified · {LICENCE_TYPES[b.licence_type]}</span>
        <h1 style={{ fontSize: "clamp(34px,5vw,56px)", marginTop: 12 }}>{b.display_name}</h1>
        {b.company && <p className="meta" style={{ fontSize: 17 }}>{b.company}</p>}
        <div className="panel" style={{ marginTop: 20 }}>
          {b.bio && <p style={{ marginTop: 0 }}>{b.bio}</p>}
          <dl className="dl">
            <dt>FSC licence</dt><dd>{b.fsc_licence_no}</dd>
            {b.products.length > 0 && <><dt>Cover</dt><dd>{b.products.map(productName).join(", ")}</dd></>}
            {b.insurers.length > 0 && <><dt>Insurers</dt><dd>{b.insurers.join(", ")}</dd></>}
            {b.parishes.length > 0 && <><dt>Parishes</dt><dd>{b.parishes.join(", ")}</dd></>}
            <dt>Languages</dt><dd>{b.languages.join(", ")}</dd>
            {b.phone && <><dt>Phone</dt><dd><a href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a></dd></>}
            {b.email && <><dt>Email</dt><dd><a href={`mailto:${b.email}`}>{b.email}</a></dd></>}
            {wa && <><dt>WhatsApp</dt><dd><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener">Message on WhatsApp</a></dd></>}
            {b.website && <><dt>Website</dt><dd><a href={b.website} target="_blank" rel="noopener">{b.website.replace(/^https?:\/\//, "")}</a></dd></>}
          </dl>
        </div>
      </div>
      <div id="quote"><QuoteForm brokers={[{ id: b.id, display_name: b.display_name, company: b.company }]} preselect={b.id} enabled /></div>
    </div>
  );
}
