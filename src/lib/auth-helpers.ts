import { auth } from "@/auth";

// Server Actions are POST requests to the page route the proxy matcher may
// exclude, so every action must re-check auth itself rather than relying on
// src/proxy.ts alone.
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}
