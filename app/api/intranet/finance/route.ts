import { FinanceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

function toFinance(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/intranet/finance?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) return toFinance(request, "error=请先登录内网");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");

  if (action === "create") {
    const title = String(formData.get("title") ?? "").trim();
    const itemName = String(formData.get("itemName") ?? "").trim();
    const amountText = String(formData.get("amount") ?? "").trim();
    const approverId = String(formData.get("approverId") ?? "").trim();
    const justification = String(formData.get("justification") ?? "").trim();

    if (!title || !itemName || !amountText || !approverId || !justification) {
      return toFinance(request, "error=申请信息不完整");
    }

    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      return toFinance(request, "error=金额必须大于0");
    }

    const approver = await db.intranetUser.findUnique({ where: { id: approverId } });
    if (!approver || !approver.isActive || !approver.canApproveFinance) {
      return toFinance(request, "error=审批人无效");
    }

    await db.financeRequest.create({
      data: {
        title,
        itemName,
        amount,
        justification,
        approverId,
        requesterId: session.userId,
        progressNote: "已提交，等待审批",
        status: FinanceStatus.PENDING
      }
    });

    return toFinance(request, "ok=申请已提交");
  }

  if (action === "review") {
    if (!session.canApproveFinance) return toFinance(request, "error=你没有审批权限");

    const id = String(formData.get("id") ?? "").trim();
    const decision = String(formData.get("decision") ?? "").trim();
    const approverComment = String(formData.get("approverComment") ?? "").trim();
    const progressNote = String(formData.get("progressNote") ?? "").trim();

    if (!id || !decision || !approverComment || !progressNote) {
      return toFinance(request, "error=审批信息不完整");
    }
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return toFinance(request, "error=审批结论无效");
    }

    const requestDoc = await db.financeRequest.findUnique({ where: { id } });
    if (!requestDoc) return toFinance(request, "error=申请不存在");
    if (requestDoc.approverId !== session.userId) return toFinance(request, "error=你不能审批该申请");

    await db.financeRequest.update({
      where: { id },
      data: {
        status: decision as FinanceStatus,
        approverComment,
        progressNote,
        approvedAt: decision === "APPROVED" ? new Date() : null,
        rejectedAt: decision === "REJECTED" ? new Date() : null
      }
    });
    return toFinance(request, "ok=审批已提交");
  }

  return toFinance(request, "error=无效操作");
}
