import { redirect } from "next/navigation";
import BrokerForm from "@/components/BrokerForm";
import { session } from "@/lib/hq";
export const metadata = { title: "Set up your broker profile" };
export default async function Onboarding() {
  const { broker, profile } = await session({ needBroker: false });
  if (broker) redirect("/hq");
  return (
    <div className="wrap" style={{ padding: "40px 0 80px", maxWidth: 860 }}>
      <span className="eyebrow">Step 1 of 1</span>
      <h1 style={{ fontSize: "clamp(32px,4vw,48px)", margin: "14px 0 10px" }}>Set up your <i>broker profile</i></h1>
      <p className="lede" style={{ margin: "0 0 24px" }}>We check your Financial Services Commission licence before your profile goes live, usually within one working day.</p>
      <BrokerForm defaults={{ name: profile?.full_name ?? "", email: profile?.email ?? "" }} />
    </div>
  );
}
