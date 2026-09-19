import { prisma } from "@/lib/prisma";

export async function getCategoriesWithSub() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });
}
