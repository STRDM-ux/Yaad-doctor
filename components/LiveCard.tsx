import { MDLINK_URL } from "@/lib/data";
export default function LiveCard() {
  return (
    <aside className="live" aria-labelledby="live-h">
      <div className="live-screen">
        <div className="ring" aria-hidden>✚</div>
        <span className="tag"><span className="pulse" aria-hidden /> Video visit</span>
      </div>
      <span className="eyebrow"><span className="pulse" aria-hidden /> Online doctors · via MDLink</span>
      <h3 id="live-h">See a doctor from wherever you're working.</h3>
      <p>Between gigs, jobs or clients? Start a video visit with a licensed doctor on MDLink, get advice and prescriptions, and get back to work.</p>
      <a className="btn btn-orange" href={MDLINK_URL} target="_blank" rel="noopener">Start an online visit ↗</a>
      <p className="fine">Opens MDLink's website. MDLink sets its own fees and handles your visit and payment.</p>
    </aside>
  );
}
