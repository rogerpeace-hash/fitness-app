import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// ALLOWED_EMAILS is a comma-separated list, e.g. "me@x.com,spouse@x.com".
// ALLOWED_EMAIL (singular) is kept as a fallback for existing deployments.
const allowedEmails = (process.env.ALLOWED_EMAILS ?? process.env.ALLOWED_EMAIL ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "database" },
  // Deployed behind Fly's proxy, so Auth.js must be told to trust the
  // forwarded host header rather than depending on AUTH_TRUST_HOST being set.
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      return !!email && allowedEmails.includes(email);
    },
  },
});
