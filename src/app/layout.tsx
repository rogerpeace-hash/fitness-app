import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import DailyVerseModal from "./DailyVerseModal";
import NavLinks from "./NavLinks";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Stride",
  description: "Family fitness tracker — workouts, goals, streaks, and momentum",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stride",
  },
};

export const viewport: Viewport = {
  themeColor: "#070d18",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg font-sans">
        {session?.user && <DailyVerseModal />}
        {session?.user && (
          <header className="sticky top-0 z-40 border-b border-border bg-surface">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-2">
                <Image src="/icon-192.png" alt="" width={30} height={30} className="rounded-lg" />
                <span className="font-display text-xl font-extrabold uppercase tracking-wide text-hi">
                  Stride
                </span>
              </div>
              <div className="flex items-center gap-4">
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/sign-in" });
                  }}
                >
                  <button type="submit" className="text-sm font-medium text-dim hover:text-hi">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
            <div className="mx-auto max-w-5xl px-5 pb-3">
              <NavLinks />
            </div>
          </header>
        )}
        <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
