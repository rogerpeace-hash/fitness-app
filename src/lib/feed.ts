import { prisma } from "@/lib/prisma";

export type FeedItemType = "WORKOUT" | "GOAL";

export type FeedItem = {
  itemType: FeedItemType;
  itemId: string;
  userId: string;
  userName: string;
  date: Date;
  title: string;
  detail: string;
};

const goalTypeLabels: Record<string, string> = {
  WEIGHT: "Weight goal",
  BODY_FAT: "Body fat % goal",
  EXERCISE: "Exercise frequency goal",
};

const SINCE_DAYS = 60;

export async function buildFeed(userId: string): Promise<FeedItem[]> {
  const myGroups = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const groupIds = myGroups.map((g) => g.groupId);
  if (groupIds.length === 0) return [];

  const members = await prisma.groupMember.findMany({
    where: { groupId: { in: groupIds } },
    select: { userId: true },
  });
  // Include the viewer themselves — otherwise you can never see reactions or
  // comments left on your own shared items from your own Family page.
  const memberIds = [...new Set(members.map((m) => m.userId))];

  const prefs = await prisma.sharePreference.findMany({
    where: { userId: { in: memberIds }, groupId: { in: groupIds }, enabled: true },
  });
  const workoutUserIds = [...new Set(prefs.filter((p) => p.category === "WORKOUT").map((p) => p.userId))];
  const goalUserIds = [...new Set(prefs.filter((p) => p.category === "GOAL").map((p) => p.userId))];

  const since = new Date();
  since.setDate(since.getDate() - SINCE_DAYS);

  const [workouts, goals] = await Promise.all([
    workoutUserIds.length
      ? prisma.workout.findMany({
          where: { userId: { in: workoutUserIds }, date: { gte: since } },
          include: { user: true },
          orderBy: { date: "desc" },
          take: 40,
        })
      : Promise.resolve([]),
    goalUserIds.length
      ? prisma.goal.findMany({
          where: { userId: { in: goalUserIds } },
          include: { user: true, progressLogs: { orderBy: { date: "desc" }, take: 1 } },
          orderBy: { createdAt: "desc" },
          take: 40,
        })
      : Promise.resolve([]),
  ]);

  const items: FeedItem[] = [
    ...workouts.map((w) => ({
      itemType: "WORKOUT" as const,
      itemId: w.id,
      userId: w.userId,
      userName: w.user.name ?? w.user.email ?? "Someone",
      date: w.date,
      title: `${w.type}${w.trackedWith ? ` · ${w.trackedWith}` : ""}`,
      detail: [
        `${w.durationMin} min`,
        w.distanceKm !== null ? `${w.distanceKm} km` : null,
        w.caloriesBurned !== null ? `${w.caloriesBurned} cal` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
    ...goals.map((g) => ({
      itemType: "GOAL" as const,
      itemId: g.id,
      userId: g.userId,
      userName: g.user.name ?? g.user.email ?? "Someone",
      date: g.createdAt,
      title: g.type === "EXERCISE_REPS" ? (g.exerciseName ?? "Exercise goal") : goalTypeLabels[g.type],
      detail:
        (g.type === "EXERCISE_REPS"
          ? `${g.progressLogs[0]?.value ?? g.startValue} → ${g.targetValue} reps`
          : `${g.startValue} → ${g.targetValue}`) + (g.status === "ACHIEVED" ? " · 🎉 Achieved!" : ""),
    })),
  ];

  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function canViewItem(
  viewerId: string,
  itemType: FeedItemType,
  itemId: string,
): Promise<boolean> {
  const ownerId =
    itemType === "WORKOUT"
      ? (await prisma.workout.findUnique({ where: { id: itemId }, select: { userId: true } }))?.userId
      : (await prisma.goal.findUnique({ where: { id: itemId }, select: { userId: true } }))?.userId;

  if (!ownerId) return false;
  if (ownerId === viewerId) return true;

  const sharedGroups = await prisma.groupMember.findMany({
    where: { userId: viewerId, group: { members: { some: { userId: ownerId } } } },
    select: { groupId: true },
  });
  if (sharedGroups.length === 0) return false;

  const pref = await prisma.sharePreference.findFirst({
    where: {
      userId: ownerId,
      groupId: { in: sharedGroups.map((g) => g.groupId) },
      category: itemType,
      enabled: true,
    },
  });
  return !!pref;
}

export async function loadEngagement(items: { itemType: FeedItemType; itemId: string }[]) {
  const reactionsByItem = new Map<
    string,
    { emoji: string; count: number; userNames: string[]; userIds: string[] }[]
  >();
  const commentsByItem = new Map<
    string,
    { id: string; userName: string; body: string; createdAt: Date }[]
  >();
  if (items.length === 0) return { reactionsByItem, commentsByItem };

  const or = items.map((i) => ({ itemType: i.itemType, itemId: i.itemId }));
  const [reactions, comments] = await Promise.all([
    prisma.reaction.findMany({ where: { OR: or }, include: { user: true } }),
    prisma.comment.findMany({ where: { OR: or }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);

  for (const r of reactions) {
    const key = `${r.itemType}:${r.itemId}`;
    const list = reactionsByItem.get(key) ?? [];
    const existing = list.find((e) => e.emoji === r.emoji);
    const userName = r.user.name ?? r.user.email ?? "Someone";
    if (existing) {
      existing.count += 1;
      existing.userNames.push(userName);
      existing.userIds.push(r.userId);
    } else {
      list.push({ emoji: r.emoji, count: 1, userNames: [userName], userIds: [r.userId] });
    }
    reactionsByItem.set(key, list);
  }

  for (const c of comments) {
    const key = `${c.itemType}:${c.itemId}`;
    const list = commentsByItem.get(key) ?? [];
    list.push({
      id: c.id,
      userName: c.user.name ?? c.user.email ?? "Someone",
      body: c.body,
      createdAt: c.createdAt,
    });
    commentsByItem.set(key, list);
  }

  return { reactionsByItem, commentsByItem };
}
