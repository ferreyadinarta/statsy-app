import { redirect } from "next/navigation";
import { getUserFromHeaders } from "@/lib/auth";

export default async function Home() {
  const user = await getUserFromHeaders();
  if (user) {
    redirect("/dashboard");
  } else {
    redirect(process.env.NEXT_PUBLIC_LANDING_URL || "/login");
  }
}
