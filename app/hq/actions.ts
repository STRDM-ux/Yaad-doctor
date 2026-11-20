"use server";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { session, LIMITS, monthStart } from "@/lib/hq";
import { userClient, adminClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/supabase/env";
import { PARISHES } from "@/lib/data";
import { INSURERS, PRODUCTS } from "@/lib/insurance";
import { esc, sendEmail } from "@/lib/email";

export type FormState = { error?: string; ok?: string; link?: string };
const s = (fd: FormData, k: string, max = 300) => { const v = fd.get(k); return typeof v === "string" ? v.trim().slice(0, max) : ""; };
const n = (v: string) => v || null;

async function audit(broker_id: string, actor_id: string, action: string, entity: string, entity_id: string, detail: object = {}) {
  await adminClient().from("audit_log").insert({ broker_id, actor_id, action, entity, entity_id, detail });
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const db = await userClient();
  const email = s(fd, "email", 160), password = s(fd, "password", 200);
  if (s(fd, "mode") === "signup") {
    if (password.length < 10) return { error: "Use a password of at least 10 characters." };
    const { data, error } = await db.auth.signUp({ email, password, options: { data: { full_name: s(fd, "full_name", 120) }, emailRedirectTo: `${SITE_URL}/hq` } });
    if (error) return { error: error.message };
    if (!data.session) return { ok: "Check your email to confirm your account, then sign in." };
    redirect("/hq/onboarding");
  }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match an account." };
  redirect("/hq");
}

export async function signOut() {
  const db = await userClient();
  await db.auth.signOut();
  redirect("/hq/login");
}

function brokerFields(fd: FormData) {
  const pick = (k: string, allowed: readonly string[]) => fd.getAll(k).map(String).filter((x) => allowed.includes(x));
  return {
    display_name: s(fd, "display_name", 120), company: n(s(fd, "company", 120)), licence_type: s(fd, "licence_type", 20) || "broker",
    fsc_licence_no: s(fd, "fsc_licence_no", 60), bio: n(s(fd, "bio", 1200)), phone: n(s(fd, "phone", 40)), email: n(s(fd, "email", 160)),
    whatsapp: n(s(fd, "whatsapp", 40)), website: n(s(fd, "website", 200)),
    parishes: pick("parishes", PARISHES), products: pick("products", PRODUCTS.map((p) => p.id)), insurers: pick("insurers", INSURERS),
  };
}

export async function saveBroker(_: FormState, fd: FormData): Promise<FormState> {
  const { db, user, broker } = await session({ needBroker: false });
  const f = brokerFields(fd);
  if (!f.display_name || !f.fsc_licence_no) return { error: "Your name and FSC licence number are required." };
  if (f.website && !/^https?:\/\//.test(f.website)) f.website = "https://" + f.website;
  if (broker) {
    const { error } = await db.from("brokers").update(f).eq("id", broker.id);
    if (error) return { error: error.message };
    await audit(broker.id, user.id, "update", "broker", broker.id);
    revalidatePath("/hq", "layout");
    return { ok: f.fsc_licence_no !== broker.fsc_licence_no ? "Saved. Because your licence details changed, we'll re-check them before your profile shows again." : "Profile saved." };
  }
  const { data, error } = await db.from("brokers").insert({ ...f, owner_id: user.id }).select("id").single();
  if (error) return { error: error.message };
  await audit(data.id, user.id, "create", "broker", data.id);
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
  if (admins.length) await sendEmail(admins, "New broker to verify", `<p>${esc(f.display_name)} (FSC licence ${esc(f.fsc_licence_no)}) signed up. <a href="${SITE_URL}/hq/admin">Review</a></p>`);
  redirect("/hq");
}

export async function setLeadStatus(fd: FormData) {
  const { db, broker } = await session();
  const status = s(fd, "status", 20);
  if (!["new", "contacted", "quoted", "won", "lost"].includes(status)) return;
  await db.from("leads").update({ status }).eq("id", s(fd, "id", 40)).eq("broker_id", broker!.id);
  revalidatePath("/hq/leads");
}

export async function leadToClient(fd: FormData) {
  const { db, broker, user } = await session();
  const leadId = s(fd, "id", 40);
  const { data: lead } = await db.from("leads").select("id, quote_requests(full_name,email,phone,parish,occupation,notes,coverage)").eq("id", leadId).maybeSingle();
  if (!lead) return;
  const q = lead.quote_requests as unknown as { full_name: string; email: string | null; phone: string; parish: string | null; occupation: string | null; notes: string | null; coverage: string[] };
  const { data: c } = await db.from("clients").insert({ broker_id: broker!.id, full_name: q.full_name, email: q.email, phone: q.phone, parish: q.parish, occupation: q.occupation, notes: [q.notes, q.coverage?.length ? `Asked about: ${q.coverage.join(", ")}` : ""].filter(Boolean).join("\n"), status: "prospect", source_lead_id: lead.id }).select("id").single();
  await db.from("leads").update({ status: "contacted" }).eq("id", lead.id).eq("status", "new");
  if (c) { await audit(broker!.id, user.id, "create", "client", c.id, { from_lead: lead.id }); redirect(`/hq/clients/${c.id}`); }
}

function clientFields(fd: FormData) {
  return {
    full_name: s(fd, "full_name", 120), email: n(s(fd, "email", 160)), phone: n(s(fd, "phone", 40)), date_of_birth: n(s(fd, "date_of_birth", 10)),
    trn: n(s(fd, "trn", 20)), address: n(s(fd, "address", 300)), parish: n(s(fd, "parish", 40)), occupation: n(s(fd, "occupation", 120)),
    policies: n(s(fd, "policies", 2000)), notes: n(s(fd, "notes", 4000)), status: s(fd, "status", 20) || "active",
  };
}

export async function saveClient(_: FormState, fd: FormData): Promise<FormState> {
  const { db, broker, user } = await session();
  const f = clientFields(fd);
  if (!f.full_name) return { error: "Client name is required." };
  const id = s(fd, "id", 40);
  if (id) {
    const { error } = await db.from("clients").update({ ...f, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: error.message };
    await audit(broker!.id, user.id, "update", "client", id);
    revalidatePath(`/hq/clients/${id}`);
    return { ok: "Saved." };
  }
  const lim = LIMITS[broker!.plan];
  const { count } = await db.from("clients").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= lim.clients) return { error: `Your ${broker!.plan} plan includes ${lim.clients} clients. Upgrade to Pro for unlimited clients.` };
  const { data, error } = await db.from("clients").insert({ ...f, broker_id: broker!.id }).select("id").single();
  if (error) return { error: error.message };
  await audit(broker!.id, user.id, "create", "client", data.id);
  redirect(`/hq/clients/${data.id}`);
}

/** Records a file the browser already uploaded to the broker's private folder. */
export async function recordDocument(input: { client_id: string; name: string; path: string; mime: string; size: number }) {
  const { db, broker, user } = await session();
  if (!input.path.startsWith(`${broker!.id}/`)) throw new Error("Invalid path");
  const { data: file, error: dlErr } = await db.storage.from("client-docs").download(input.path);
  if (dlErr || !file) throw new Error("Upload not found");
  const sha256 = crypto.createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
  const { data, error } = await db.from("documents").insert({ broker_id: broker!.id, client_id: input.client_id, name: input.name.slice(0, 200), storage_path: input.path, mime: input.mime, size_bytes: input.size, sha256 }).select("id").single();
  if (error) throw new Error(error.message);
  await audit(broker!.id, user.id, "upload", "document", data.id, { name: input.name });
  revalidatePath(`/hq/clients/${input.client_id}`);
}

export async function deleteDocument(fd: FormData) {
  const { db, broker, user } = await session();
  const id = s(fd, "id", 40);
  const { data: doc } = await db.from("documents").select("id,storage_path,client_id").eq("id", id).maybeSingle();
  if (!doc) return;
  await db.storage.from("client-docs").remove([doc.storage_path]);
  await db.from("documents").delete().eq("id", id);
  await audit(broker!.id, user.id, "delete", "document", id);
  revalidatePath(`/hq/clients/${doc.client_id}`);
}

export async function openDocument(fd: FormData) {
  const { db } = await session();
  const { data: doc } = await db.from("documents").select("storage_path,name").eq("id", s(fd, "id", 40)).maybeSingle();
  if (!doc) return;
  const { data } = await db.storage.from("client-docs").createSignedUrl(doc.storage_path, 120, { download: doc.name });
  if (data?.signedUrl) redirect(data.signedUrl);
}

export async function requestSignature(_: FormState, fd: FormData): Promise<FormState> {
  const { db, broker, user } = await session();
  const document_id = s(fd, "document_id", 40), signer_name = s(fd, "signer_name", 120);
  if (!signer_name) return { error: "Add the signer's name." };
  const { data: doc } = await db.from("documents").select("id,client_id,mime,sha256,name").eq("id", document_id).maybeSingle();
  if (!doc) return { error: "Document not found." };
  if (doc.mime !== "application/pdf") return { error: "Only PDF files can be sent for signature. Save the document as a PDF and upload it again." };
  const lim = LIMITS[broker!.plan];
  const { count } = await db.from("signature_requests").select("id", { count: "exact", head: true }).gte("created_at", monthStart());
  if ((count ?? 0) >= lim.signatures) return { error: `Your ${broker!.plan} plan includes ${lim.signatures} e-signatures a month. Upgrade to Pro for unlimited.` };
  const token = crypto.randomBytes(24).toString("base64url");
  const token_hash = crypto.createHash("sha256").update(token).digest("hex");
  const signer_email = n(s(fd, "signer_email", 160));
  const message = n(s(fd, "message", 1000));
  const { data, error } = await db.from("signature_requests").insert({ broker_id: broker!.id, client_id: doc.client_id, document_id, token_hash, signer_name, signer_email, signer_phone: n(s(fd, "signer_phone", 40)), message, original_sha256: doc.sha256 }).select("id").single();
  if (error) return { error: error.message };
  await audit(broker!.id, user.id, "request_signature", "signature_request", data.id, { document: doc.name });
  const link = `${SITE_URL}/sign/${token}`;
  let emailed = false;
  if (signer_email) emailed = await sendEmail(signer_email, `${broker!.display_name} sent you a document to sign`, `<p>Hello ${esc(signer_name)},</p><p>${esc(broker!.display_name)} has sent you <b>${esc(doc.name)}</b> to review and sign.</p>${message ? `<p>${esc(message)}</p>` : ""}<p><a href="${link}">Review and sign</a></p><p>This link expires in 14 days.</p>`);
  revalidatePath(`/hq/clients/${doc.client_id}`);
  return { ok: emailed ? "Sent by email. You can also share the link below." : "Signing link created. Send it to your client by WhatsApp, SMS or email.", link };
}

export async function cancelSignature(fd: FormData) {
  const { db, broker, user } = await session();
  const id = s(fd, "id", 40);
  await db.from("signature_requests").update({ status: "cancelled" }).eq("id", id).in("status", ["pending", "viewed"]);
  await audit(broker!.id, user.id, "cancel", "signature_request", id);
  revalidatePath("/hq/signatures");
}

// Admin
async function requireAdmin() { const ctx = await session({ needBroker: false }); if (!ctx.isAdmin) redirect("/hq"); return ctx; }
export async function adminSetBroker(fd: FormData) {
  const { user } = await requireAdmin();
  const id = s(fd, "id", 40), status = s(fd, "status", 20), plan = s(fd, "plan", 20), featured = s(fd, "featured", 5);
  const patch: Record<string, unknown> = {};
  if (["pending", "verified", "rejected", "suspended"].includes(status)) { patch.status = status; patch.verified_at = status === "verified" ? new Date().toISOString() : null; }
  if (["starter", "pro", "agency"].includes(plan)) patch.plan = plan;
  if (featured) patch.featured = featured === "true";
  const db = adminClient();
  const { data: b } = await db.from("brokers").update(patch).eq("id", id).select("email,display_name").single();
  await audit(id, user.id, "admin_update", "broker", id, patch);
  if (b?.email && patch.status === "verified") await sendEmail(b.email, "You're verified on Yaad Doctor", `<p>Hi ${esc(b.display_name)}, your licence has been checked and your profile is now live in the marketplace. <a href="${SITE_URL}/hq">Open Brokers HQ</a></p>`);
  revalidatePath("/hq/admin"); revalidatePath("/insurance");
}
export async function adminAssignLead(fd: FormData) {
  await requireAdmin();
  const qr = s(fd, "quote_request_id", 40), broker = s(fd, "broker_id", 40);
  if (qr && broker) await adminClient().from("leads").upsert({ quote_request_id: qr, broker_id: broker }, { onConflict: "quote_request_id,broker_id" });
  revalidatePath("/hq/admin");
}
