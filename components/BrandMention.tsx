import { sgLink, type LinkTag } from '@/lib/outbound';

/**
 * BrandMention — renders a sentence that names ShearGenius, linking the brand name only.
 * 2026-11-06: findme.hair runs as its own brand, so its pages mention ShearGenius plainly
 * instead of linking keyword phrases ("professional hairdressing scissors…") on hundreds of pages.
 * A sentence without the brand name renders as plain text.
 * 2026-11-19: the link carries the findme.hair UTM set (lib/outbound) for the page + block.
 */

const BRAND = 'ShearGenius';

export default function BrandMention({
  sentence,
  href,
  tag,
  className,
}: {
  sentence: string;
  href: string;
  tag: LinkTag;
  className?: string;
}) {
  const i = sentence.indexOf(BRAND);
  if (i < 0) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, i)}
      <a href={sgLink(href, tag)} target="_blank" rel="noopener" className={className ?? 'text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]'}>
        {BRAND}
      </a>
      {sentence.slice(i + BRAND.length)}
    </>
  );
}
