import "server-only";
import { adminClient } from "@/lib/supabase/server";
import { dbReady } from "@/lib/supabase/env";

export type PublicBroker = {
  id: string; display_name: string; company: string | null; licence_type: string; fsc_licence_no: string; bio: string | null;
  phone: string | null; email: string | null; whatsapp: string | null; website: string | null; parishes: string[]; products: string[];
  insurers: string[]; languages: string[]; featured: boolean; plan: string; verified_at: string | null;
};
const COLS = "id,display_name,company,licence_type,fsc_licence_no,bio,phone,email,whatsapp,website,parishes,products,insurers,languages,featured,plan,verified_at";

export async function verifiedBrokers(): Promise<PublicBroker[]> {
  if (!dbReady()) return [];
  const { data } = await adminClient().from("brokers").select(COLS).eq("status", "verified")
    .order("featured", { ascending: false }).order("plan", { ascending: true }).order("verified_at", { ascending: true });
  // plan order: agency > pro > starter
  const rank: Record<string, number> = { agency: 0, pro: 1, starter: 2 };
  return ((data ?? []) as PublicBroker[]).sort((a, b) => Number(b.featured) - Number(a.featured) || rank[a.plan] - rank[b.plan]);
}
export async function brokerById(id: string): Promise<PublicBroker | null> {
  if (!dbReady() || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await adminClient().from("brokers").select(COLS).eq("id", id).eq("status", "verified").maybeSingle();
  return (data as PublicBroker) ?? null;
}
