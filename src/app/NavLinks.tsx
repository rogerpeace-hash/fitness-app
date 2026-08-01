"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/coach", label: "Coach", icon: "🎓" },
  { href: "/log/weight", label: "Weight", icon: "⚖️" },
  { href: "/log/nutrition", label: "Nutrition", icon: "🍎" },
  { href: "/log/workout", label: "Workout", icon: "💪" },
  { href: "/log/journal", label: "Journal", icon: "📓" },
  { href: "/log/body-composition", label: "Body Comp", icon: "📊" },
  { href: "/log/bloodwork", label: "Bloodwork", icon: "🩸" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/family", label: "Family", icon: "👨‍👩‍👧" },
  { href: "/import", label: "Import", icon: "📥" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-1 text-sm font-medium">
      {navLinks.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 transition-colors ${
              isActive
                ? "border-ignite/40 bg-ignite/15 text-ignite-hover"
                : "border-transparent bg-surface-2 text-dim hover:text-hi"
            }`}
          >
            <span className="text-sm">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
