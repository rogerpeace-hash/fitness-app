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
                  ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/50"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              }`}
            >
              {emoji}
              {summary && summary.count > 0 && <span className="ml-1 text-xs text-slate-500">{summary.count}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="ml-1 text-xs text-slate-500 underline"
        >
          {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium">{c.userName}</span>{" "}
              <span className="text-slate-600 dark:text-slate-400">{c.body}</span>
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
              className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
