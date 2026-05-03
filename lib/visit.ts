import { db } from "@/lib/db";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function recordWebsiteVisit(input: {
  host: string | null;
  method: string | null;
  purpose: string | null;
  pathname: string | null;
}) {
  const host = (input.host ?? "").toLowerCase();
  if (!host.includes("nextus.top")) return;
  if (input.method && input.method.toUpperCase() !== "GET") return;
  if ((input.purpose ?? "").toLowerCase() === "prefetch") return;

  const pathname = input.pathname ?? "/";
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") return;

  const visitModel = db.websiteVisitDaily;
  if (!visitModel) return;

  const date = startOfToday();
  await visitModel.upsert({
    where: { date },
    update: { count: { increment: 1 } },
    create: { date, count: 1 }
  });
}

export function getVisitRangeStart(days: number) {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
}
