import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import CoachChat from "./CoachChat";

export default async function CoachPage() {
  const userId = await requireUserId();

  const history = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Coach</h1>
        <p className="mt-1 text-sm text-dim">
          Ask about your trends and get suggestions grounded in your actual logged data.
        </p>
      </div>

      <CoachChat
        initialMessages={history.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))}
      />
    </div>
  );
}
