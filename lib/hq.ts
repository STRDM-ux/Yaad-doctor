import "server-only";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import { dbReady } from "@/lib/supabase/env";

export type Broker = {
  id: string; owner_id: string; display_name: string; company: string | null; licence_type: string; fsc_licence_no: string;
  bio: string | null; phone: string | null; email: string | null; whatsapp: string | null; website: string | null;
  parishes: string[]; products: string[]; insurers: string[]; languages: string[]; status: string; plan: string; featured: boolean;
};

/** Signed-in user, profile and broker. Redirects to login when signed out. */
export async function session(opts: { needBroker?: boolean } = { needBroker: true }) {
  if (!dbReady()) redirect("/brokers?setup=1");
  const db = await userClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/hq/login");
  const [{ data: profile }, { data: broker }] = await Promise.all([
    db.from("profiles").select("id,email,full_name,role").eq("id", user.id).maybeSingle(),
    db.from("brokers").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);
  const isAdmin = profile?.role === "admin";
  if (opts.needBroker && !broker) redirect(isAdmin ? "/hq/admin" : "/hq/onboarding");
  return { db, user, profile, broker: broker as Broker | null, isAdmin };
}

export const LIMITS: Record<string, { leads: number; clients: number; signatures: number }> = {
  starter: { leads: 5, clients: 10, signatures: 3 },
  pro: { leads: Infinity, clients: Infinity, signatures: Infinity },
  agency: { leads: Infinity, clients: Infinity, signatures: Infinity },
};
export function monthStart() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString(); }
