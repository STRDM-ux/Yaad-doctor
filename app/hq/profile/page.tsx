import Link from "next/link";
import HqShell from "@/components/HqShell";
import BrokerForm from "@/components/BrokerForm";
import { session } from "@/lib/hq";
export const metadata = { title: "Profile" };
export default async function Profile() {
  const { broker, isAdmin } = await session();
  return (
    <HqShell active="/hq/profile" title="Your profile" status={broker!.status} isAdmin={isAdmin}
      action={broker!.status === "verified" ? <Link className="btn btn-ghost btn-sm" href={`/insurance/brokers/${broker!.id}`}>View public profile</Link> : undefined}>
      <BrokerForm broker={broker} />
    </HqShell>
  );
}
