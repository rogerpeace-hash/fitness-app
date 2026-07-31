"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { canViewItem, type FeedItemType } from "@/lib/feed";

export async function toggleReaction(itemType: FeedItemType, itemId: string, emoji: string) {
  const userId = await requireUserId();
  if (!(await canViewItem(userId, itemType, itemId))) throw new Error("Not visible to you");

  const existing = await prisma.reaction.findUnique({
    where: { userId_itemType_itemId_emoji: { userId, itemType, itemId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { userId, itemType, itemId, emoji } });
  }

  revalidatePath("/family");
}

export async function addComment(formData: FormData) {
  const userId = await requireUserId();
  const itemType = formData.get("itemType") as FeedItemType;
  const itemId = formData.get("itemId") as string;
  const body = (formData.get("body") as string)?.trim();
  if (!body) return;

  if (!(await canViewItem(userId, itemType, itemId))) throw new Error("Not visible to you");

  await prisma.comment.create({ data: { userId, itemType, itemId, body } });
  revalidatePath("/family");
}
