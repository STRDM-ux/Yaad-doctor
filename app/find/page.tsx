import { Suspense } from "react";
import Finder from "@/components/Finder";
export const metadata = { title: "Find care" };
export default function FindPage() {
  return <Suspense fallback={<div className="wrap" style={{ padding: "48px 0" }}>Loading listings…</div>}><Finder /></Suspense>;
}
