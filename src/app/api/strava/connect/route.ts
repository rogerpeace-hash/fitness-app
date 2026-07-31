import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET() {
  await requireUserId();

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${process.env.APP_URL}/api/strava/callback`;

  const authorizeUrl = new URL("https://www.strava.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", process.env.STRAVA_CLIENT_ID ?? "");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("approval_prompt", "auto");
  authorizeUrl.searchParams.set("scope", "activity:read_all");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set("strava_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
