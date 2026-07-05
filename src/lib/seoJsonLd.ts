const JSON_LD_ATTR = "data-seo-jsonld-key";

type CollectionPageInput = {
  name: string;
  url: string;
  items: Array<{
    name: string;
    url: string;
  }>;
  description?: string;
  inLanguage?: string;
};

export function clearJsonLd(key: string) {
  document.querySelectorAll(`script[${JSON_LD_ATTR}='${key}']`).forEach((node) => node.remove());
}

export function setJsonLd(key: string, schemas: Record<string, unknown> | Array<Record<string, unknown>>) {
  clearJsonLd(key);
  const items = Array.isArray(schemas) ? schemas : [schemas];
  for (const schema of items) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(JSON_LD_ATTR, key);
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}

export function setCollectionPageJsonLd(key: string, input: CollectionPageInput) {
  setJsonLd(key, {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: input.url,
    description: input.description,
    inLanguage: input.inLanguage,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  });
}