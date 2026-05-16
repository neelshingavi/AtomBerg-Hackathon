import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  EMPLOYEE: "/employee",
  MANAGER: "/manager",
  ADMIN: "/admin",
};

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  redirect(DASHBOARD_BY_ROLE[session.user.role] ?? "/employee");
}
