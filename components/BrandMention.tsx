/**
 * BrandMention — renders a sentence that names ShearGenius, linking the brand name only.
 * 2026-11-06: findme.hair runs as its own brand, so its pages mention ShearGenius plainly
 * instead of linking keyword phrases ("professional hairdressing scissors…") on hundreds of pages.
 * A sentence without the brand name renders as plain text.
 */

const BRAND = 'ShearGenius';

export default function BrandMention({ sentence, href, className }: { sentence: string; href: string; className?: string }) {
  const i = sentence.indexOf(BRAND);
  if (i < 0) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, i)}
      <a href={href} target="_blank" rel="noopener" className={className ?? 'text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]'}>
        {BRAND}
      </a>
      {sentence.slice(i + BRAND.length)}
    </>
  );
}
