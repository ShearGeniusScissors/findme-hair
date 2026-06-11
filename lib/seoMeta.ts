const SITE = "https://www.findme.hair";

export function canonicalAlternates(pathOrUrl: string) {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${SITE}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  return {
    canonical: url,
    languages: {
      "en-AU": url,
      "x-default": url,
    },
  };
}

/**
 * Strip markdown then group sentences into short readable paragraphs
 * (~4,729 ai_descriptions contain raw `**` — audit 2026-06-11). Same words,
 * same order — SEO-safe; only the asterisks and the wall-of-text go.
 */
export function toParagraphs(input: string | null | undefined, sentencesPerPara = 3): string[] {
  const clean = stripMarkdown(input);
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]+["')\]]*(?:\s+|$)/g) ?? [clean];
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerPara) {
    const p = sentences.slice(i, i + sentencesPerPara).join('').replace(/\s+/g, ' ').trim();
    if (p) paras.push(p);
  }
  return paras;
}

export function stripMarkdown(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
