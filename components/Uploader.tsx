"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
import { recordDocument } from "@/app/hq/actions";

const OK = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
export default function Uploader({ url, anonKey, brokerId, clientId }: { url: string; anonKey: string; brokerId: string; clientId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg("");
    const db = browserClient(url, anonKey);
    try {
      for (const f of Array.from(files)) {
        if (!OK.includes(f.type)) { setMsg(`${f.name}: use PDF, JPG, PNG, HEIC or Word files.`); continue; }
        if (f.size > 20 * 1024 * 1024) { setMsg(`${f.name} is over 20 MB.`); continue; }
        const safe = f.name.replace(/[^\w.\-]+/g, "_").slice(-80);
        const path = `${brokerId}/${clientId}/${crypto.randomUUID()}-${safe}`;
        const { error } = await db.storage.from("client-docs").upload(path, f, { contentType: f.type, upsert: false });
        if (error) { setMsg(`${f.name}: ${error.message}`); continue; }
        await recordDocument({ client_id: clientId, name: f.name, path, mime: f.type, size: f.size });
      }
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(false);
    if (input.current) input.current.value = "";
  }
  return (
    <div className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
      <p style={{ margin: 0 }}><b>Drop files here</b> or</p>
      <label className="btn btn-ghost btn-sm">{busy ? "Uploading…" : "Choose files"}<input ref={input} type="file" multiple accept={OK.join(",")} hidden disabled={busy} onChange={(e) => upload(e.target.files)} /></label>
      <p className="note" style={{ margin: 0 }}>PDF, images or Word, up to 20 MB each. Files are stored privately and only you can open them.</p>
      {msg && <p className="error" role="alert">{msg}</p>}
    </div>
  );
}
