import { auth } from "@/auth";

export const proxy = auth((req) => {
  const isSignedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isHealthRoute = req.nextUrl.pathname.startsWith("/api/health");
  const isSignInPage = req.nextUrl.pathname.startsWith("/sign-in");

  if (!isSignedIn && !isAuthRoute && !isHealthRoute && !isSignInPage) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-192.png|icon-512.png|apple-touch-icon.png).*)",
  ],
};
