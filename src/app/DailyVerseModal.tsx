"use client";

import { useEffect, useState } from "react";

type Verse = { reference: string; text: string };

export default function DailyVerseModal() {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("dailyVerseShown") === todayKey) return;

    fetch("/api/verse-of-day")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Verse | null) => {
        if (data?.text) {
          setVerse(data);
          setOpen(true);
          localStorage.setItem("dailyVerseShown", todayKey);
        }
      })
      .catch(() => {});
  }, []);

  if (!open || !verse) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Verse of the day</p>
        <p className="mt-3 text-lg leading-relaxed text-zinc-800 dark:text-zinc-100">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-500">{verse.reference}</p>
        <p className="mt-4 text-[11px] leading-snug text-zinc-400">
          Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard
          Version®), copyright © 2001 by Crossway, a publishing ministry of Good News
          Publishers. Used by permission. All rights reserved.
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-black"
        >
          Amen
        </button>
      </div>
    </div>
  );
}
