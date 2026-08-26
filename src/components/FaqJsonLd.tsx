interface Item {
  q: string;
  a: string;
}

/** Emits FAQPage structured data so FAQs can appear as rich results. */
export default function FaqJsonLd({ items }: { items: Item[] }) {
  if (!items.length) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
