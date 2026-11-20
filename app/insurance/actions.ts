"use server";
import { adminClient } from "@/lib/supabase/server";
import { dbReady, SITE_URL } from "@/lib/supabase/env";
import { PARISHES } from "@/lib/data";
import { PRODUCTS, productName } from "@/lib/insurance";
import { esc, sendEmail } from "@/lib/email";

export type QuoteState = { ok?: boolean; error?: string; sentTo?: number };
const s = (v: FormDataEntryValue | null, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function submitQuote(_: QuoteState, fd: FormData): Promise<QuoteState> {
  if (s(fd.get("company_website"))) return { ok: true, sentTo: 0 }; // honeypot
  if (!dbReady()) return { error: "Quote requests are switching on shortly. Please try again later today." };
  const full_name = s(fd.get("full_name"), 120), phone = s(fd.get("phone"), 40), email = s(fd.get("email"), 160);
  const parish = s(fd.get("parish"), 40), occupation = s(fd.get("occupation"), 120), notes = s(fd.get("notes"), 2000);
  const coverage = fd.getAll("coverage").map(String).filter((c) => PRODUCTS.some((p) => p.id === c));
  const brokerIds = fd.getAll("broker").map(String).filter((b) => /^[0-9a-f-]{36}$/.test(b)).slice(0, 3);
  const household = parseInt(s(fd.get("household_size"), 3)) || null;
  if (!full_name || phone.replace(/\D/g, "").length < 7) return { error: "Please add your name and a phone number brokers can reach you on." };
  if (!coverage.length) return { error: "Pick at least one type of cover." };
  if (fd.get("consent") !== "on") return { error: "Please agree to be contacted by the brokers you chose." };
  if (parish && !PARISHES.includes(parish)) return { error: "Please choose a parish from the list." };

  const db = adminClient();
  const { data: qr, error } = await db.from("quote_requests").insert({
    full_name, phone, email: email || null, parish: parish || null, occupation: occupation || null, coverage,
    household_size: household, monthly_budget: s(fd.get("monthly_budget"), 40) || null,
    current_insurer: s(fd.get("current_insurer"), 80) || null, notes: notes || null, consent: true,
  }).select("id").single();
  if (error || !qr) return { error: "Something went wrong saving your request. Please try again." };

  let targets: { id: string; email: string | null; display_name: string }[] = [];
  if (brokerIds.length) {
    const { data } = await db.from("brokers").select("id,email,display_name").in("id", brokerIds).eq("status", "verified");
    targets = data ?? [];
  } else {
    const { data } = await db.from("brokers").select("id,email,display_name,parishes,products,featured,plan").eq("status", "verified");
    const rank: Record<string, number> = { agency: 0, pro: 1, starter: 2 };
    targets = (data ?? [])
      .map((b) => ({ b, score: (parish && b.parishes?.includes(parish) ? 2 : 0) + (coverage.some((c) => b.products?.includes(c)) ? 1 : 0) }))
      .sort((x, y) => y.score - x.score || Number(y.b.featured) - Number(x.b.featured) || rank[x.b.plan] - rank[y.b.plan])
      .slice(0, 3).map((x) => x.b);
  }
  // Starter plans get 5 new leads a month; skip brokers who have used theirs
  if (targets.length) {
    const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
    const { data: plans } = await db.from("brokers").select("id,plan").in("id", targets.map((t) => t.id));
    const starters = (plans ?? []).filter((p) => p.plan === "starter").map((p) => p.id);
    if (starters.length) {
      const { data: used } = await db.from("leads").select("broker_id").in("broker_id", starters).gte("created_at", since);
      const count = new Map<string, number>(); (used ?? []).forEach((u) => count.set(u.broker_id, (count.get(u.broker_id) ?? 0) + 1));
      targets = targets.filter((t) => (count.get(t.id) ?? 0) < 5);
    }
  }
  if (targets.length) {
    await db.from("leads").insert(targets.map((t) => ({ quote_request_id: qr.id, broker_id: t.id })));
    const html = `<p>You have a new quote request on Yaad Doctor from <b>${esc(full_name)}</b>${parish ? ` in ${esc(parish)}` : ""}.</p><p>Cover: ${esc(coverage.map(productName).join(", "))}</p><p><a href="${SITE_URL}/hq/leads">Open your lead inbox</a></p>`;
    await Promise.all(targets.filter((t) => t.email).map((t) => sendEmail(t.email!, "New quote request on Yaad Doctor", html)));
  }
  return { ok: true, sentTo: targets.length };
}
