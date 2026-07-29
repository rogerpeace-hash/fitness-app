import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import DailyVerseModal from "./DailyVerseModal";
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
  themeColor: "#111827",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/coach", label: "Coach" },
  { href: "/log/weight", label: "Weight" },
  { href: "/log/nutrition", label: "Nutrition" },
  { href: "/log/workout", label: "Workout" },
  { href: "/log/journal", label: "Journal" },
  { href: "/log/inbody", label: "InBody" },
  { href: "/log/renpho", label: "Renpho" },
  { href: "/log/bloodwork", label: "Bloodwork" },
  { href: "/goals", label: "Goals" },
  { href: "/import", label: "Import" },
];

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
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        {session?.user && <DailyVerseModal />}
        {session?.user && (
          <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
              <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/sign-in" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-zinc-500 hover:text-black dark:hover:text-white"
                >
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
