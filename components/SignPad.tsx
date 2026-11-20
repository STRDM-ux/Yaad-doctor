"use client";
import { useEffect, useRef, useState } from "react";
export default function SignPad({ token, name }: { token: string; name: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false); const [hasInk, setHasInk] = useState(false);
  const [typed, setTyped] = useState(name); const [agree, setAgree] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "declined">("idle"); const [err, setErr] = useState(""); const [url, setUrl] = useState("");
  useEffect(() => {
    const c = canvas.current!; const r = c.getBoundingClientRect(); const d = window.devicePixelRatio || 1;
    c.width = r.width * d; c.height = r.height * d; const ctx = c.getContext("2d")!; ctx.scale(d, d);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#12261b";
  }, []);
  const pos = (e: React.PointerEvent) => { const r = canvas.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e: React.PointerEvent) => { drawing.current = true; canvas.current!.setPointerCapture(e.pointerId); const [x, y] = pos(e); const ctx = canvas.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const [x, y] = pos(e); const ctx = canvas.current!.getContext("2d")!; ctx.lineTo(x, y); ctx.stroke(); setHasInk(true); };
  const clear = () => { const c = canvas.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setHasInk(false); };
  async function submit(decline = false) {
    setErr(""); setState("sending");
    const res = await fetch(`/api/sign/${token}`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decline ? { decline: true } : { typedName: typed, signature: canvas.current!.toDataURL("image/png"), consent: agree }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(j.error || "Something went wrong. Please try again."); setState("idle"); return; }
    setUrl(j.download || ""); setState(decline ? "declined" : "done");
  }
  if (state === "done") return <div className="panel" role="status"><h2>Signed. Thank you.</h2><p>The sender has been given your signed copy.</p>{url && <a className="btn btn-primary" href={url}>Download your signed copy</a>}</div>;
  if (state === "declined") return <div className="panel" role="status"><h2>You declined to sign</h2><p>We've let the sender know.</p></div>;
  return (
    <div className="panel form">
      <h2>Sign</h2>
      <label>Type your full legal name<input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="name" /></label>
      <div>
        <span className="lbl">Draw your signature</span>
        <canvas ref={canvas} className="sigpad" onPointerDown={down} onPointerMove={move} onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)} aria-label="Signature pad: draw your signature with your finger or mouse" role="img" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={clear} style={{ marginTop: 8 }}>Clear</button>
      </div>
      <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I have read this document and agree to sign it electronically. I understand my electronic signature is legally binding, as a handwritten one would be.</label>
      {err && <p className="error" role="alert">{err}</p>}
      <div className="actions">
        <button className="btn btn-orange" disabled={!agree || !hasInk || typed.trim().length < 2 || state === "sending"} onClick={() => submit()}>{state === "sending" ? "Signing…" : "Sign document"}</button>
        <button className="btn btn-ghost btn-sm" disabled={state === "sending"} onClick={() => submit(true)}>Decline</button>
      </div>
    </div>
  );
}
