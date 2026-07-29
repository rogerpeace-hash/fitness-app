import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import DailyVerseModal from "./DailyVerseModal";
import NavLinks from "./NavLinks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health Tracker",
  description: "Personal health data dashboard",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Health Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950">
        {session?.user && <DailyVerseModal />}
        {session?.user && (
          <header className="border-b border-blue-950/40 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 shadow-md">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Image src="/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
                  <span className="font-semibold tracking-tight text-white">Health Tracker</span>
                </div>
                <NavLinks />
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/sign-in" });
                }}
              >
                <button type="submit" className="text-sm text-slate-400 hover:text-blue-300">
                  Sign out
                </button>
              </form>
            </div>
          </header>
        )}
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
