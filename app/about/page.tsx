import { generated, listings } from "@/lib/data";
export const metadata = { title: "About the data" };
export default function About() {
  const by = new Map<string, number>();
  for (const l of listings) for (const s of l.sources) by.set(s.name, (by.get(s.name) ?? 0) + 1);
  return (
    <div className="wrap prose">
      <span className="eyebrow">Transparency</span>
      <h1>About the <i>data</i></h1>
      <p>Yaad Doctor lists {listings.length} places to get care in Jamaica, gathered on {generated} from public sources that allow reuse. Every listing links back to its source. We only show contact details a practice or a public body has published, and we only show a photo when the practice itself publishes it; otherwise you see an initials badge.</p>
      <h2>Sources</h2>
      <table>
        <thead><tr><th>Source</th><th>Listings</th></tr></thead>
        <tbody>{[...by.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => <tr key={s}><td>{s}</td><td>{n}</td></tr>)}</tbody>
      </table>
      <h2>What we don't know yet</h2>
      <ul>
        <li><b>Insurance.</b> No insurer publishes an open provider list we can reuse, so we don't claim which plans a practice accepts. Always ask when you call.</li>
        <li><b>Individual doctors.</b> Most listings are practices and facilities. The Medical Council of Jamaica register is the official list of licensed doctors; we plan to add practitioners who confirm their own details.</li>
        <li><b>Locations.</b> Listings marked "approx." are pinned to the town centre.</li>
      </ul>
      <h2>Is this your practice?</h2>
      <p>Practices will soon be able to claim a listing to add hours, insurance accepted, a photo and online booking. Until then, please correct OpenStreetMap entries directly at <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">openstreetmap.org</a>, and they will flow into the next update.</p>
      <h2>Medical disclaimer</h2>
      <p className="disclaimer">Yaad Doctor is a directory, not a medical provider, and does not endorse any listing. Online visits are provided by MDLink under its own terms. In an emergency call 119.</p>
    </div>
  );
}
