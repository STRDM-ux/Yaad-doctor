import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { adminClient } from "@/lib/supabase/server";
import { findRequest } from "@/lib/signing";
import { esc, sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/supabase/env";

export const runtime = "nodejs";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await findRequest(token);
  if (!r) return bad("This signing link is not valid.", 404);
  if (!["pending", "viewed"].includes(r.status) || new Date(r.expires_at) < new Date()) return bad("This signing link is no longer active.", 410);
  const body = await req.json().catch(() => null) as { decline?: boolean; typedName?: string; signature?: string; consent?: boolean } | null;
  if (!body) return bad("Invalid request.");
  const db = adminClient();
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 300);
  const audit = (action: string, detail: object) => db.from("audit_log").insert({ broker_id: r.broker_id, action, entity: "signature_request", entity_id: r.id, detail: { ip, ua, ...detail } });

  if (body.decline) {
    await db.from("signature_requests").update({ status: "declined", signer_ip: ip, signer_user_agent: ua }).eq("id", r.id);
    await audit("declined", {});
    return NextResponse.json({ ok: true });
  }
  const typedName = (body.typedName ?? "").trim().slice(0, 120);
  if (typedName.length < 2) return bad("Please type your full name.");
  if (!body.consent) return bad("Please confirm you agree to sign electronically.");
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(body.signature ?? "");
  if (!m || m[1].length > 1_500_000) return bad("Please draw your signature.");
  const sigPng = Buffer.from(m[1], "base64");

  const { data: file, error: dlErr } = await db.storage.from("client-docs").download(r.documents.storage_path);
  if (dlErr || !file) return bad("We couldn't open the document. Please ask the sender to resend it.", 500);
  const original = Buffer.from(await file.arrayBuffer());
  const originalSha = crypto.createHash("sha256").update(original).digest("hex");
  if (r.original_sha256 && r.original_sha256 !== originalSha) return bad("This document changed after it was sent. Please ask the sender for a new link.", 409);

  let pdf: PDFDocument;
  try { pdf = await PDFDocument.load(original, { ignoreEncryption: true }); } catch { return bad("This PDF can't be signed electronically. Please ask the sender for a different copy.", 422); }
  const font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sig = await pdf.embedPng(sigPng);
  const now = new Date();
  const when = now.toLocaleString("en-JM", { timeZone: "America/Jamaica", dateStyle: "long", timeStyle: "medium" }) + " (Jamaica time)";
  const ref = r.id.slice(0, 8).toUpperCase();
  const green = rgb(0.06, 0.29, 0.19), grey = rgb(0.36, 0.42, 0.36);
  const clean = (t: string) => t.replace(/[^\x20-\x7E]/g, "?");

  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    page.drawText(clean(`Electronically signed by ${typedName} on ${now.toISOString().slice(0, 10)} via Yaad Doctor. Ref ${ref}`), { x: 24, y: 12, size: 7, font, color: grey, maxWidth: width - 48 });
  }
  const cert = pdf.addPage([612, 792]);
  let y = 740;
  const line = (t: string, opts: { size?: number; f?: typeof font; c?: ReturnType<typeof rgb> } = {}) => { cert.drawText(clean(t), { x: 56, y, size: opts.size ?? 11, font: opts.f ?? font, color: opts.c ?? rgb(0.07, 0.15, 0.1), maxWidth: 500 }); y -= (opts.size ?? 11) + 9; };
  line("Electronic signature certificate", { size: 20, f: bold, c: green }); y -= 6;
  line(`Document: ${r.documents.name}`);
  line(`Sent by: ${r.brokers.display_name}${r.brokers.company ? `, ${r.brokers.company}` : ""} (FSC licence ${r.brokers.fsc_licence_no})`);
  line(`Signer: ${typedName}`);
  line(`Signed: ${when}  |  ${now.toISOString()}`);
  line(`Signer IP address: ${ip}`);
  line(`Device: ${ua.slice(0, 110)}`, { size: 9 });
  line(`Reference: ${r.id}`, { size: 9 });
  line(`SHA-256 of original document: ${originalSha}`, { size: 9 });
  y -= 10; line("Signature", { f: bold });
  const dims = sig.scaleToFit(260, 90);
  cert.drawRectangle({ x: 56, y: y - dims.height - 6, width: 280, height: dims.height + 16, borderColor: rgb(0.85, 0.8, 0.7), borderWidth: 1 });
  cert.drawImage(sig, { x: 66, y: y - dims.height, width: dims.width, height: dims.height });
  y -= dims.height + 34;
  line("The signer reviewed the document, confirmed they agreed to sign electronically, typed their name and drew", { size: 9, c: grey });
  line("the signature above. Electronic signatures are recognised under Jamaica's Electronic Transactions Act, 2006.", { size: 9, c: grey });
  const signedBytes = Buffer.from(await pdf.save());
  const signedSha = crypto.createHash("sha256").update(signedBytes).digest("hex");
  const base = r.documents.name.replace(/\.pdf$/i, "");
  const path = `${r.broker_id}/${r.client_id ?? "unfiled"}/signed-${crypto.randomUUID()}.pdf`;
  const up = await db.storage.from("client-docs").upload(path, signedBytes, { contentType: "application/pdf", upsert: false });
  if (up.error) return bad("We couldn't save the signed copy. Please try again.", 500);
  const { data: doc } = await db.from("documents").insert({ broker_id: r.broker_id, client_id: r.client_id, name: `${base} (signed).pdf`, storage_path: path, mime: "application/pdf", size_bytes: signedBytes.length, sha256: signedSha, kind: "signed" }).select("id").single();
  const { data: updated } = await db.from("signature_requests").update({ status: "signed", signed_at: now.toISOString(), signed_name: typedName, signer_ip: ip, signer_user_agent: ua, signed_document_id: doc?.id }).eq("id", r.id).in("status", ["pending", "viewed"]).select("id");
  if (!updated?.length) return bad("This document was already signed or cancelled.", 409);
  await audit("signed", { typedName, originalSha, signedSha });
  const { data: b } = await db.from("brokers").select("email").eq("id", r.broker_id).single();
  if (b?.email) await sendEmail(b.email, `${typedName} signed ${r.documents.name}`, `<p>${esc(typedName)} signed <b>${esc(r.documents.name)}</b>. The signed copy is in the client's folder in <a href="${SITE_URL}/hq/signatures">Brokers HQ</a>.</p>`);
  const { data: dl } = await db.storage.from("client-docs").createSignedUrl(path, 600, { download: `${base} (signed).pdf` });
  return NextResponse.json({ ok: true, download: dl?.signedUrl });
}
