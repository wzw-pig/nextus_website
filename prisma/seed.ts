import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.forumCategory.createMany({
    data: [
      { name: "求助答疑", slug: "help" },
      { name: "部门公告", slug: "announcements" },
      { name: "质询建议", slug: "suggestions" },
      { name: "资料发布", slug: "resources" }
    ],
    skipDuplicates: true
  });

  const superAdminExists = await prisma.adminUser.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true }
  });

  if (!superAdminExists && process.env.SUPER_ADMIN_USERNAME && process.env.SUPER_ADMIN_PASSWORD) {
    await prisma.adminUser.create({
      data: {
        username: process.env.SUPER_ADMIN_USERNAME,
        passwordHash: await hash(process.env.SUPER_ADMIN_PASSWORD, 12),
        displayName: process.env.SUPER_ADMIN_DISPLAY_NAME || "Nextus 超级管理员",
        role: "SUPER_ADMIN"
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
