import { FloorTimeSlot } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";
import { cleanupBeforeTodayWhere, isDateInNext7Days, toDateOnly } from "@/lib/floor-reservation";

export const runtime = "nodejs";

function toSchedule(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/intranet/floor-reservations?${query}`, request.url));
}

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json") || request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function json(ok: boolean, message: string, redirectTo?: string) {
  return NextResponse.json({ ok, message, redirectTo });
}

const validSlots = new Set(Object.values(FloorTimeSlot));

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) return wantsJson(request) ? json(false, "请先登录内网") : toSchedule(request, "error=请先登录内网");

  const floorReservationModel = db.floorReservation;
  if (!floorReservationModel) {
    const message = "预约模块未初始化，请先执行 Prisma 迁移并重启服务";
    return wantsJson(request) ? json(false, message) : toSchedule(request, `error=${encodeURIComponent(message)}`);
  }

  await floorReservationModel.deleteMany({ where: cleanupBeforeTodayWhere() });

  const formData = await request.formData();
  const dateText = String(formData.get("date") ?? "");
  const slot = String(formData.get("slot") ?? "") as FloorTimeSlot;
  const reason = String(formData.get("reason") ?? "").trim();

  const date = toDateOnly(dateText);
  if (!date) return wantsJson(request) ? json(false, "预约日期无效") : toSchedule(request, "error=预约日期无效");
  if (!isDateInNext7Days(date)) {
    return wantsJson(request) ? json(false, "仅支持预约今天起7天内的时段") : toSchedule(request, "error=仅支持预约今天起7天内的时段");
  }
  if (!validSlots.has(slot)) return wantsJson(request) ? json(false, "预约时段无效") : toSchedule(request, "error=预约时段无效");
  if (!reason) return wantsJson(request) ? json(false, "使用事由不能为空") : toSchedule(request, "error=使用事由不能为空");
  if (reason.length > 10) {
    return wantsJson(request) ? json(false, "使用事由最多10个字") : toSchedule(request, "error=使用事由最多10个字");
  }

  const exists = await floorReservationModel.findUnique({
    where: { date_slot: { date, slot } },
    select: { id: true }
  });
  if (exists) return wantsJson(request) ? json(false, "该时段已被预约") : toSchedule(request, "error=该时段已被预约");

  await floorReservationModel.create({
    data: {
      date,
      slot,
      reason,
      userId: session.userId
    }
  });

  return wantsJson(request)
    ? json(true, "预约成功", "/intranet/floor-reservations")
    : toSchedule(request, "ok=预约成功");
}
