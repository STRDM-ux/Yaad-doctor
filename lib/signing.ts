import "server-only";
import crypto from "node:crypto";
import { adminClient } from "@/lib/supabase/server";
import { dbReady } from "@/lib/supabase/env";

export const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");
export async function findRequest(token: string) {
  if (!dbReady() || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const db = adminClient();
  const { data } = await db.from("signature_requests")
    .select("id,broker_id,client_id,document_id,signer_name,message,status,expires_at,original_sha256,signed_document_id,documents!signature_requests_document_id_fkey(name,storage_path,sha256),brokers(display_name,company,fsc_licence_no)")
    .eq("token_hash", hashToken(token)).maybeSingle();
  if (!data) return null;
  return data as unknown as {
    id: string; broker_id: string; client_id: string | null; document_id: string; signer_name: string; message: string | null; status: string;
    expires_at: string; original_sha256: string | null; signed_document_id: string | null;
    documents: { name: string; storage_path: string; sha256: string | null }; brokers: { display_name: string; company: string | null; fsc_licence_no: string };
  };
}
