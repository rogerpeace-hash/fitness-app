"use client";

import { useState, useTransition } from "react";
import { toggleReaction, addComment } from "@/lib/actions/engagement";
import type { FeedItemType } from "@/lib/feed";

const EMOJIS = ["👏", "🔥", "💪", "🎉"];

type ReactionSummary = { emoji: string; count: number; userNames: string[]; userIds: string[] };
type CommentSummary = { id: string; userName: string; body: string; createdAt: Date };

export default function FeedItemActions({
  itemType,
  itemId,
  viewerId,
  reactions,
  comments,
}: {
  itemType: FeedItemType;
  itemId: string;
  viewerId: string;
  reactions: ReactionSummary[];
  comments: CommentSummary[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(comments.length > 0);

  function handleReact(emoji: string) {
    startTransition(() => {
      toggleReaction(itemType, itemId, emoji);
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {EMOJIS.map((emoji) => {
          const summary = reactions.find((r) => r.emoji === emoji);
          const mine = summary?.userIds.includes(viewerId) ?? false;
          return (
            <button
              key={emoji}
              type="button"
              disabled={isPending}
              onClick={() => handleReact(emoji)}
              title={summary?.userNames.join(", ")}
              className={`rounded-full border px-2.5 py-1 text-sm transition-colors ${
                mine
                  ? "border-ignite/40 bg-ignite/15"
                  : "border-border hover:bg-surface-2"
              }`}
            >
              {emoji}
              {summary && summary.count > 0 && <span className="ml-1 text-xs text-dimmer">{summary.count}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="ml-1 text-xs text-dim underline"
        >
          {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium">{c.userName}</span>{" "}
              <span className="text-dim">{c.body}</span>
            </div>
          ))}
          <form
            action={addComment}
            className="flex gap-2"
            onSubmit={() => setShowComments(true)}
          >
            <input type="hidden" name="itemType" value={itemType} />
            <input type="hidden" name="itemId" value={itemId} />
            <input
              type="text"
              name="body"
              placeholder="Say something encouraging…"
              className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-hi focus:border-ignite focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-ignite px-3 py-1.5 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
