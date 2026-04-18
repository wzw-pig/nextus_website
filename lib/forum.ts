import { db } from "@/lib/db";
import { forumCategoryPresets } from "@/lib/constants";

export async function ensureForumCategories() {
  const count = await db.forumCategory.count();
  if (count > 0) return;

  await db.forumCategory.createMany({
    data: forumCategoryPresets.map((item) => ({
      name: item.name,
      slug: item.slug
    }))
  });
}
