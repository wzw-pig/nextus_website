import { redirect } from "next/navigation";
import { getIntranetSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IntranetResourcesPage() {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");
  redirect("/intranet/forum/resources");
}
