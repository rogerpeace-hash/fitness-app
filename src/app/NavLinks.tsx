"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
      {navLinks.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${
              isActive
                ? "bg-blue-500/15 text-blue-300"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
