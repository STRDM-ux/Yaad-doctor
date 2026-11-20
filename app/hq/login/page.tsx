import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { dbReady } from "@/lib/supabase/env";
export const metadata = { title: "Brokers HQ sign in" };
export default function Login() {
  if (!dbReady()) redirect("/brokers?setup=1");
  return <div className="wrap" style={{ padding: "56px 0 80px" }}><AuthForm /></div>;
}
