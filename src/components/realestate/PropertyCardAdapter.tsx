import type { TemplateProperty } from './adapters';
import PropertyCard from './PropertyCard';

export default function PropertyCardAdapter({ item }: { item: TemplateProperty }) {
  return (
    <PropertyCard
      href={item.href}
      imageUrl={item.imageUrl}
      title={item.title}
      subtitle={item.subtitle}
      price={item.priceText}
      meta={item.meta}
      badge={item.badge}
    />
  );
}
