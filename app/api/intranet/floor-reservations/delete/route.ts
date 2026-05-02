import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";
import { sendSystemMessage } from "@/lib/intranet-message";
import { cleanupBeforeTodayWhere } from "@/lib/floor-reservation";

export const runtime = "nodejs";

function toSchedule(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/intranet/floor-reservations?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) return toSchedule(request, "error=请先登录内网");

  const floorReservationModel = db.floorReservation;
  if (!floorReservationModel) {
    return toSchedule(request, `error=${encodeURIComponent("预约模块未初始化，请先执行 Prisma 迁移并重启服务")}`);
  }

  await floorReservationModel.deleteMany({ where: cleanupBeforeTodayWhere() });

  const formData = await request.formData();
  const reservationId = String(formData.get("reservationId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reservationId) return toSchedule(request, "error=缺少预约记录ID");

  const reservation = await floorReservationModel.findUnique({
    where: { id: reservationId },
    include: { user: true }
  });
  if (!reservation) return toSchedule(request, "error=预约记录不存在");

  const deletingOther = reservation.userId !== session.userId;
  if (deletingOther && !session.isForumAdmin) return toSchedule(request, "error=仅内网管理员可删除他人预约");
  if (deletingOther && !reason) return toSchedule(request, "error=删除他人预约必须填写理由");

  await floorReservationModel.delete({ where: { id: reservation.id } });

  if (deletingOther) {
    await sendSystemMessage(
      reservation.userId,
      "十楼使用预约被删除通知",
      [
        `预约日期：${reservation.date.toLocaleDateString("zh-CN")}`,
        `预约时间段：${reservation.slot}`,
        `预约人：${reservation.user.name}`,
        `删除时间：${new Date().toLocaleString("zh-CN")}`,
        `删除人：${session.displayName}`,
        `删除理由：${reason}`
      ].join("\n")
    );
  }

  return toSchedule(request, "ok=预约记录已删除");
}
