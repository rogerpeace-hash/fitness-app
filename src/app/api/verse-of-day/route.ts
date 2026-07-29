import { requireUserId } from "@/lib/auth-helpers";
import { verseReferenceForDate } from "@/lib/bible-verses";

export async function GET() {
  await requireUserId();

  const apiKey = process.env.ESV_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ESV_API_KEY not configured" }, { status: 501 });
  }

  const reference = verseReferenceForDate();
  const url = new URL("https://api.esv.org/v3/passage/text/");
  url.searchParams.set("q", reference);
  url.searchParams.set("include-headings", "false");
  url.searchParams.set("include-footnotes", "false");
  url.searchParams.set("include-verse-numbers", "false");
  url.searchParams.set("include-short-copyright", "false");
  url.searchParams.set("include-passage-references", "false");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Token ${apiKey}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return Response.json({ error: "Failed to fetch verse" }, { status: 502 });
  }

  const data = await res.json();
  const text = ((data.passages?.[0] as string | undefined) ?? "").trim();
  if (!text) {
    return Response.json({ error: "No verse text returned" }, { status: 502 });
  }

  return Response.json({ reference, text });
}
