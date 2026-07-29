// Curated references only — actual verse text is fetched live from the ESV
// API (api.esv.org) at display time, never stored, so there's no copyrighted
// text embedded in the codebase.
export const VERSE_REFERENCES = [
  "Philippians 4:13",
  "Isaiah 40:31",
  "Joshua 1:9",
  "Psalm 46:1",
  "Psalm 118:24",
  "Proverbs 3:5-6",
  "Romans 8:28",
  "Jeremiah 29:11",
  "Psalm 23:1",
  "Matthew 11:28",
  "2 Corinthians 12:9",
  "Galatians 6:9",
  "1 Corinthians 10:13",
  "Psalm 34:17-18",
  "Isaiah 41:10",
  "Psalm 121:1-2",
  "Proverbs 16:3",
  "Philippians 4:6-7",
  "Psalm 27:1",
  "Nehemiah 8:10",
  "Habakkuk 3:19",
  "1 Corinthians 6:19-20",
  "3 John 1:2",
  "Proverbs 17:22",
  "Psalm 139:14",
  "Romans 12:1",
  "1 Timothy 4:8",
  "Psalm 55:22",
  "Matthew 6:33",
  "Colossians 3:23",
  "Hebrews 12:1",
  "2 Timothy 1:7",
  "Psalm 73:26",
  "Isaiah 40:29",
  "Psalm 28:7",
  "Proverbs 4:23",
  "Ecclesiastes 4:9-10",
  "Psalm 90:17",
  "James 1:2-4",
  "Romans 15:13",
  "Psalm 16:8",
  "Psalm 37:23-24",
  "1 Peter 5:7",
  "Deuteronomy 31:6",
  "Psalm 62:1-2",
  "Proverbs 24:16",
  "Psalm 84:11",
  "Isaiah 43:2",
  "Psalm 30:5",
  "Lamentations 3:22-23",
  "Psalm 143:8",
  "2 Corinthians 4:16",
  "Psalm 31:24",
  "Zephaniah 3:17",
  "Psalm 18:32",
  "1 Corinthians 9:24-25",
  "Galatians 2:20",
  "Ephesians 3:16",
  "Psalm 20:4",
  "Proverbs 3:7-8",
];

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

/** Same verse for everyone on a given calendar day (UTC), cycling yearly. */
export function verseReferenceForDate(date: Date = new Date()): string {
  const idx = dayOfYear(date) % VERSE_REFERENCES.length;
  return VERSE_REFERENCES[idx];
}
