"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import { KIND_LABEL, PARISHES, kmBetween, listings, mapsHref, specialtyCounts, telHref, type Kind } from "@/lib/data";

const KINDS: Kind[] = ["doctor", "hospital", "clinic", "dentist", "pharmacy", "lab"];
const PAGE = 30;

export default function Finder() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [parish, setParish] = useState(sp.get("parish") ?? "");
  const [spec, setSpec] = useState(sp.get("spec") ?? "");
  const [kinds, setKinds] = useState<Kind[]>(sp.get("kind") ? (sp.get("kind")!.split(",") as Kind[]) : []);
  const [contactOnly, setContactOnly] = useState(sp.get("contact") === "1");
  const [here, setHere] = useState<[number, number] | null>(null);
  const [locMsg, setLocMsg] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState(false);
  const specs = useMemo(() => specialtyCounts().map(([s]) => s), []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q); if (parish) p.set("parish", parish); if (spec) p.set("spec", spec);
    if (kinds.length) p.set("kind", kinds.join(",")); if (contactOnly) p.set("contact", "1");
    const s = p.toString();
    window.history.replaceState(null, "", s ? `/find?${s}` : "/find");
    setShown(PAGE);
  }, [q, parish, spec, kinds, contactOnly]);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = listings.filter((l) => {
      if (parish && l.parish !== parish) return false;
      if (kinds.length && !kinds.includes(l.kind)) return false;
      if (spec && !l.specialties.includes(spec)) return false;
      if (contactOnly && !l.verified_contact) return false;
      if (words.length) {
        const hay = [l.name, l.practice, l.address, l.parish, KIND_LABEL[l.kind], ...l.specialties, ...l.services].join(" ").toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    }).map((l) => ({ l, km: here ? kmBetween(here, [l.lat, l.lon]) : null }));
    if (here) out.sort((a, b) => a.km! - b.km!);
    return out;
  }, [q, parish, spec, kinds, contactOnly, here]);

  function locate() {
    if (!navigator.geolocation) { setLocMsg("Your browser can't share location. Pick a parish instead."); return; }
    setLocMsg("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (p) => { setHere([p.coords.latitude, p.coords.longitude]); setParish(""); setLocMsg("Sorted by distance from you."); },
      () => setLocMsg("Location was blocked. Pick a parish instead."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }
  const toggleKind = (k: Kind) => setKinds((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));
  const reset = () => { setQ(""); setParish(""); setSpec(""); setKinds([]); setContactOnly(false); };

  return (
    <div className="wrap dir">
      <aside className="filters" aria-label="Filters" data-open={open}>
        <button type="button" className="btn btn-ghost btn-sm filters-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide filters" : `Filters${[parish, spec, q, contactOnly ? "x" : ""].filter(Boolean).length + kinds.length ? ` · ${[parish, spec, q, contactOnly ? "x" : ""].filter(Boolean).length + kinds.length} on` : ""}`}
        </button>
        <div className="fbody">
        <div>
          <label className="lbl" htmlFor="fq">Search</label>
          <input id="fq" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, speciality or town" />
        </div>
        <div>
          <span className="lbl">Location</span>
          <div style={{ display: "grid", gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={locate}>◎ Use my location</button>
            <label htmlFor="fp" style={{ position: "absolute", left: -9999 }}>Parish</label>
            <select id="fp" className="field" value={parish} onChange={(e) => setParish(e.target.value)}>
              <option value="">All parishes</option>
              {PARISHES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {locMsg && <span className="note" role="status">{locMsg}</span>}
          </div>
        </div>
        <div>
          <span className="lbl">Type of care</span>
          <div className="chips">
            {KINDS.map((k) => (
              <button key={k} type="button" className="chip" aria-pressed={kinds.includes(k)} onClick={() => toggleKind(k)}>{KIND_LABEL[k]}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor="fs">Speciality</label>
          <select id="fs" className="field" value={spec} onChange={(e) => setSpec(e.target.value)}>
            <option value="">Any speciality</option>
            {specs.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <label className="check"><input type="checkbox" checked={contactOnly} onChange={(e) => setContactOnly(e.target.checked)} /> Only show places with a phone or email</label>
        <div>
          <span className="lbl">Insurance</span>
          <p className="note" style={{ margin: 0 }}>We don't yet have confirmed insurance lists for these practices. Call ahead and ask whether they take your Sagicor, Guardian Life, Canopy or BUPA card. Pharmacies: ask about NHF and JADEP.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Clear filters</button>
        </div>
      </aside>

      <div>
        <div className="results-head">
          <h1>Find care</h1>
          <p aria-live="polite">{results.length} {results.length === 1 ? "place" : "places"}{parish ? ` in ${parish}` : here ? " near you" : " across Jamaica"}</p>
        </div>
        {results.length === 0 ? (
          <div className="empty">Nothing matches yet. Try fewer filters, or <a href="https://themdlink.com/see-a-doctor" target="_blank" rel="noopener">see a doctor online</a>.</div>
        ) : (
          <ul className="cards">
            {results.slice(0, shown).map(({ l, km }) => (
              <li key={l.id} className="card">
                <Avatar l={l} />
                <div style={{ minWidth: 0 }}>
                  <h3><Link href={`/listing/${l.id}`}>{l.name}</Link></h3>
                  <p className="meta">{KIND_LABEL[l.kind]}{l.practice ? ` · ${l.practice}` : ""}{l.address ? ` · ${l.address}` : ""}{l.parish && !(l.address ?? "").includes(l.parish) ? ` · ${l.parish}` : ""}</p>
                  <div className="pills">
                    {l.emergency && <span className="pill o">Emergency care</span>}
                    {l.specialties.slice(0, 4).map((s) => <span key={s} className="pill">{s}</span>)}
                    {l.sector && <span className="pill q">{l.sector[0].toUpperCase() + l.sector.slice(1)}</span>}
                  </div>
                  <div className="actions">
                    {l.phones[0] && <a className="btn btn-primary btn-sm" href={telHref(l.phones[0])}>Call {l.phones[0].replace("+1 ", "")}</a>}
                    <Link className="btn btn-ghost btn-sm" href={`/listing/${l.id}#book`}>Book</Link>
                    <a className="btn btn-ghost btn-sm" href={mapsHref(l)} target="_blank" rel="noopener">Directions</a>
                  </div>
                </div>
                <div className="side">
                  {km != null ? <><b>{km < 10 ? km.toFixed(1) : Math.round(km)} km</b>{l.approx ? "approx." : "away"}</> : l.verified_contact ? "contact listed" : "no phone listed"}
                </div>
              </li>
            ))}
          </ul>
        )}
        {shown < results.length && (
          <div className="more"><button type="button" className="btn btn-ghost" onClick={() => setShown((s) => s + PAGE)}>Show more ({results.length - shown} left)</button></div>
        )}
      </div>
    </div>
  );
}
