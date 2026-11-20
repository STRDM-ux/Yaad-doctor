import LiveCard from "@/components/LiveCard";
import { MDLINK_URL } from "@/lib/data";
export const metadata = { title: "See a doctor online" };
export default function Online() {
  return (
    <div className="wrap hero" style={{ alignItems: "start" }}>
      <div>
        <span className="eyebrow"><span className="pulse" aria-hidden /> Live video visits</span>
        <h1>A doctor in <i>your pocket.</i></h1>
        <p className="lede">When you can't close the shop, leave the site or cancel the gig, a video visit is the fastest way to get seen. Yaad Doctor sends you to MDLink, a Caribbean telemedicine service, where licensed doctors see patients online.</p>
        <div className="grid" style={{ gap: 10, maxWidth: 560 }}>
          <div className="step"><span className="num">Good for</span><p style={{ marginTop: 6 }}>Colds, flu, rashes, minor infections, follow-ups, prescription refills and health advice.</p></div>
          <div className="step"><span className="num">Not for emergencies</span><p style={{ marginTop: 6 }}>Chest pain, trouble breathing, serious injury or heavy bleeding: call <a href="tel:119">119</a> or go to the nearest hospital.</p></div>
          <div className="step"><span className="num">How it works</span><p style={{ marginTop: 6 }}>Tap the button, create your MDLink account, choose a doctor and start your visit. MDLink sets its own prices and handles payment.</p></div>
        </div>
        <p style={{ marginTop: 24 }}><a className="btn btn-orange" href={MDLINK_URL} target="_blank" rel="noopener">Go to MDLink ↗</a></p>
      </div>
      <LiveCard />
    </div>
  );
}
