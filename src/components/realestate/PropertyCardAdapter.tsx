import type { TemplateProperty } from './adapters';
import PropertyCard from './PropertyCard';

export default function PropertyCardAdapter({ item }: { item: TemplateProperty }) {
  return (
    <PropertyCard
      href={item.href}
      imageUrl={item.imageUrl ?? null}
      title={item.title}
      subtitle={item.subtitle}
      price={item.priceText ?? 'Price on request'}
      meta={item.meta}
      badge={item.badge ?? null}
    />
  );
}
