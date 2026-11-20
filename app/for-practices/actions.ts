"use server";
import { adminClient } from "@/lib/supabase/server";
import { dbReady } from "@/lib/supabase/env";
import { esc, sendEmail } from "@/lib/email";
export type ClaimState = { ok?: boolean; error?: string };
const s = (fd: FormData, k: string, max = 300) => { const v = fd.get(k); return typeof v === "string" ? v.trim().slice(0, max) : ""; };
export async function submitClaim(_: ClaimState, fd: FormData): Promise<ClaimState> {
  if (s(fd, "website_url")) return { ok: true };
  if (!dbReady()) return { error: "Listing requests are switching on shortly. Please try again later today." };
  const row = { listing_id: s(fd, "listing_id", 80) || null, practice_name: s(fd, "practice_name", 160), contact_name: s(fd, "contact_name", 120), role: s(fd, "role", 80) || null, email: s(fd, "email", 160), phone: s(fd, "phone", 40) || null, wants_featured: fd.get("wants_featured") === "on", details: s(fd, "details", 2000) || null };
  if (!row.practice_name || !row.contact_name || !/^\S+@\S+\.\S+$/.test(row.email)) return { error: "Please add the practice name, your name and a valid email." };
  const { error } = await adminClient().from("listing_claims").insert(row);
  if (error) return { error: "Something went wrong. Please try again." };
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
  if (admins.length) await sendEmail(admins, `Listing request: ${row.practice_name}`, `<p>${esc(row.contact_name)} (${esc(row.email)}) asked about ${esc(row.practice_name)}${row.wants_featured ? " and wants a featured listing" : ""}.</p>`);
  return { ok: true };
}
