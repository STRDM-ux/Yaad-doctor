import HqShell from "@/components/HqShell";
import ClientForm from "@/components/ClientForm";
import { session } from "@/lib/hq";
export const metadata = { title: "Add client" };
export default async function NewClient() {
  const { broker, isAdmin } = await session();
  return <HqShell active="/hq/clients" title="Add client" status={broker!.status} isAdmin={isAdmin}><ClientForm /></HqShell>;
}
