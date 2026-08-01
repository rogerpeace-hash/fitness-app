"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { clearChat } from "@/lib/actions/coach";

type Message = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTED_PROMPTS = [
  "What exercises should I focus on based on my InBody scan?",
  "How can I get more protein in my diet? Suggest some recipes.",
  "How am I trending toward my goals?",
  "What's my visceral fat level and what does it mean?",
];

export default function CoachChat({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;
    setError(null);
    const userMsg: Message = { id: `local-${Date.now()}`, role: "user", content: text };
    const assistantId = `local-${Date.now()}-a`;
    setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, content: full } : msg)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((m) => m.filter((msg) => msg.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-dim hover:border-ignite hover:text-ignite"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-[300px] flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        {messages.length === 0 && (
          <p className="text-sm text-dim">
            Ask about your trends — what to work on, how you're tracking toward goals, or
            nutrition ideas based on your logs.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "self-end text-right" : "self-start"}>
            <div
              className={`inline-block max-w-lg rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-ignite text-ignite-fg"
                  : "bg-surface-2 text-hi"
              }`}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <div className="flex flex-col gap-2 text-left [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  isStreaming && "…"
                )
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the coach..."
          disabled={isStreaming}
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-hi focus:border-ignite focus:outline-none"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover disabled:opacity-40"
        >
          Send
        </button>
      </form>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={async () => {
            await clearChat();
            setMessages([]);
          }}
          className="w-fit text-xs text-dim hover:text-ignite"
        >
          Clear chat
        </button>
      )}
    </div>
  );
}
