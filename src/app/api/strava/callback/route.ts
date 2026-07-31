import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const cookieState = request.cookies.get("strava_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(new URL("/log/workout?strava_error=denied", request.url));
  }
  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(new URL("/log/workout?strava_error=invalid", request.url));
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/log/workout?strava_error=token", request.url));
  }
  const data = await tokenRes.json();

  await prisma.stravaConnection.upsert({
    where: { userId },
    create: {
      userId,
      athleteId: String(data.athlete.id),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    },
    update: {
      athleteId: String(data.athlete.id),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    },
  });

  const response = NextResponse.redirect(new URL("/log/workout?strava=connected", request.url));
  response.cookies.delete("strava_oauth_state");
  return response;
}
