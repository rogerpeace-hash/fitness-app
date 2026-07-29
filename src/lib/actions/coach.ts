"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

export async function clearChat() {
  const userId = await requireUserId();
  await prisma.chatMessage.deleteMany({ where: { userId } });
  revalidatePath("/coach");
}
