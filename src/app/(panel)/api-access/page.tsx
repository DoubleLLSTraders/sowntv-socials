import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function ApiAccessRemoved() {
  const user = await getSessionUser();
  redirect(user?.role === "admin" ? "/admin?tab=api" : "/dashboard");
}
