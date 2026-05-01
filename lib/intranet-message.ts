import { db } from "@/lib/db";

export async function sendSystemMessage(recipientId: string, title: string, content: string) {
  await db.intranetMessage.create({
    data: {
      recipientId,
      title,
      content,
      senderName: "系统"
    }
  });
}
