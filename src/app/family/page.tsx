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
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Family</h1>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-hi">Your groups</h2>

        {groups.map((group) => {
          const isOwner = group.ownerId === userId;
          return (
            <div key={group.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{group.name}</span>
                {isOwner && (
                  <form action={deleteGroup.bind(null, group.id)}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                      Delete group
                    </button>
                  </form>
                )}
              </div>

              <ul className="mb-3 flex flex-wrap gap-2 text-sm text-dim">
                {group.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-hi">
                    {m.user.name ?? m.user.email}
                    {isOwner && m.userId !== userId && (
                      <form action={removeGroupMember.bind(null, group.id, m.userId)}>
                        <button type="submit" className="ml-1 text-dimmer hover:text-red-400" title="Remove from group">
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
                    className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-hi focus:border-ignite focus:outline-none"
                  />
                  <button type="submit" className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold text-hi hover:bg-border">
                    Add
                  </button>
                </form>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
                <span className="text-dim">Share my:</span>
                {CATEGORIES.map(({ key, label }) => {
                  const enabled = prefLookup.get(`${group.id}:${key}`) ?? false;
                  return (
                    <form key={key} action={setSharePreference.bind(null, group.id, key, !enabled)}>
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          enabled
                            ? "bg-ignite text-ignite-fg"
                            : "bg-surface-2 text-dim"
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
          <p className="text-sm text-dim">
            No groups yet — create one below and add family members by the email they sign in with.
          </p>
        )}

        <form action={createGroup} className="flex gap-2">
          <input
            type="text"
            name="name"
            required
            placeholder="New group name, e.g. Family or Pull-up Crew"
            className="flex-1 max-w-sm rounded-lg border border-border bg-bg px-3 py-2 text-sm text-hi focus:border-ignite focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover">
            Create group
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-hi">Family feed</h2>
        <div className="flex flex-col gap-4">
          {feed.map((item) => {
            const key = `${item.itemType}:${item.itemId}`;
            return (
              <div key={key} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.userName}</span>
                  <span className="text-dim">{item.date.toISOString().slice(0, 10)}</span>
                </div>
                <p className="mt-1 font-semibold">{item.title}</p>
                <p className="text-sm text-dim">{item.detail}</p>
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
            <p className="text-sm text-dim">
              Nothing shared yet. Join or create a group above, then turn on sharing for workouts or goals to
              see activity here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
