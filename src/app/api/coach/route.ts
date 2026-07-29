import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { buildUserContext } from "@/lib/ai/context";

const SYSTEM_PROMPT_PREFIX = `You are the "Coach" inside a personal health tracking app, talking with the app's user about their own logged data. Be specific and practical: suggest concrete exercises, foods, or recipes grounded in the numbers below rather than generic advice. Keep answers conversational and reasonably concise (a few short paragraphs or a short list, not an essay).

You are not a doctor. For anything that sounds like a medical concern (unusual pain, suspected conditions, big changes before starting an intense new program), suggest they check with a healthcare provider — but don't be preachy about it, just a natural aside when relevant.

Here is the user's current data:

`;

const MAX_HISTORY_MESSAGES = 20;

export async function POST(req: Request) {
  const userId = await requireUserId();
  const { message } = (await req.json()) as { message?: string };

  if (!message || typeof message !== "string" || message.trim() === "") {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 501 });
  }

  await prisma.chatMessage.create({
    data: { userId, role: "user", content: message },
  });

  const [history, contextSummary] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY_MESSAGES,
    }),
    buildUserContext(userId),
  ]);

  const conversation = history
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const anthropic = new Anthropic({ apiKey });
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 1536,
    system: SYSTEM_PROMPT_PREFIX + contextSummary,
    messages: conversation,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let full = "";
      stream.on("text", (delta) => {
        full += delta;
        controller.enqueue(encoder.encode(delta));
      });
      try {
        await stream.done();
        if (full.trim() !== "") {
          await prisma.chatMessage.create({
            data: { userId, role: "assistant", content: full },
          });
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
