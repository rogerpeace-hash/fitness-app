import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { buildFeed, loadEngagement } from "@/lib/feed";
import { createGroup, addGroupMember, removeGroupMember, deleteGroup, setSharePreference } from "@/lib/actions/groups";
import FeedItemActions from "./FeedItemActions";

const CATEGORIES: { key: "WORKOUT" | "GOAL"; label: string }[] = [
  { key: "WORKOUT", label: "Workouts" },
  { key: "GOAL", label: "Goals" },
];

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const userId = await requireUserId();
  const { error } = await searchParams;

  const [groups, myPrefs, feed] = await Promise.all([
    prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sharePreference.findMany({ where: { userId } }),
    buildFeed(userId),
  ]);

  const { reactionsByItem, commentsByItem } = await loadEngagement(
    feed.map((f) => ({ itemType: f.itemType, itemId: f.itemId })),
  );

  const prefLookup = new Map(myPrefs.map((p) => [`${p.groupId}:${p.category}`, p.enabled]));

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">Family</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Your groups</h2>

        {groups.map((group) => {
          const isOwner = group.ownerId === userId;
          return (
            <div key={group.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{group.name}</span>
                {isOwner && (
                  <form action={deleteGroup.bind(null, group.id)}>
                    <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                      Delete group
                    </button>
                  </form>
                )}
              </div>

              <ul className="mb-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400">
                {group.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                    {m.user.name ?? m.user.email}
                    {isOwner && m.userId !== userId && (
                      <form action={removeGroupMember.bind(null, group.id, m.userId)}>
                        <button type="submit" className="ml-1 text-slate-400 hover:text-red-600" title="Remove from group">
                          ×
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>

              {isOwner && (
                <form action={addGroupMember} className="mb-3 flex gap-2">
                  <input type="hidden" name="groupId" value={group.id} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Add member by email…"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button type="submit" className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100">
                    Add
                  </button>
                </form>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                <span className="text-slate-500">Share my:</span>
                {CATEGORIES.map(({ key, label }) => {
                  const enabled = prefLookup.get(`${group.id}:${key}`) ?? false;
                  return (
                    <form key={key} action={setSharePreference.bind(null, group.id, key, !enabled)}>
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          enabled
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {label} {enabled ? "· shared" : "· private"}
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <p className="text-sm text-slate-500">
            No groups yet — create one below and add family members by the email they sign in with.
          </p>
        )}

        <form action={createGroup} className="flex gap-2">
          <input
            type="text"
            name="name"
            required
            placeholder="New group name, e.g. Family or Pull-up Crew"
            className="flex-1 max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            Create group
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Family feed</h2>
        <div className="flex flex-col gap-4">
          {feed.map((item) => {
            const key = `${item.itemType}:${item.itemId}`;
            return (
              <div key={key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.userName}</span>
                  <span className="text-slate-500">{item.date.toISOString().slice(0, 10)}</span>
                </div>
                <p className="mt-1 font-semibold">{item.title}</p>
                <p className="text-sm text-slate-500">{item.detail}</p>
                <FeedItemActions
                  itemType={item.itemType}
                  itemId={item.itemId}
                  viewerId={userId}
                  reactions={reactionsByItem.get(key) ?? []}
                  comments={commentsByItem.get(key) ?? []}
                />
              </div>
            );
          })}
          {feed.length === 0 && (
            <p className="text-sm text-slate-500">
              Nothing shared yet. Join or create a group above, then turn on sharing for workouts or goals to
              see activity here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
