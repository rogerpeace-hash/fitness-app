"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

export async function createGroup(formData: FormData) {
  const userId = await requireUserId();
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Group name is required");

  await prisma.group.create({
    data: {
      name,
      ownerId: userId,
      members: { create: { userId } },
    },
  });

  revalidatePath("/family");
}

export async function addGroupMember(formData: FormData) {
  const userId = await requireUserId();
  const groupId = formData.get("groupId") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId: userId } });
  if (!group) throw new Error("Group not found");

  const member = await prisma.user.findUnique({ where: { email } });
  if (!member) {
    redirect(`/family?error=${encodeURIComponent("That person hasn't signed into the app yet — ask them to sign in once first, then try adding them again.")}`);
  }

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: member.id } },
    create: { groupId, userId: member.id },
    update: {},
  });

  revalidatePath("/family");
  redirect("/family");
}

export async function removeGroupMember(groupId: string, memberUserId: string) {
  const userId = await requireUserId();
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId: userId } });
  if (!group) throw new Error("Group not found");
  if (memberUserId === userId) throw new Error("The group owner can't be removed — delete the group instead.");

  await prisma.groupMember.deleteMany({ where: { groupId, userId: memberUserId } });
  revalidatePath("/family");
}

export async function deleteGroup(groupId: string) {
  const userId = await requireUserId();
  await prisma.group.deleteMany({ where: { id: groupId, ownerId: userId } });
  revalidatePath("/family");
}

export async function setSharePreference(groupId: string, category: "WORKOUT" | "GOAL", enabled: boolean) {
  const userId = await requireUserId();
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw new Error("Not a member of this group");

  await prisma.sharePreference.upsert({
    where: { userId_groupId_category: { userId, groupId, category } },
    create: { userId, groupId, category, enabled },
    update: { enabled },
  });

  revalidatePath("/family");
}
