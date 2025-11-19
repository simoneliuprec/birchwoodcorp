import type { DbListing } from '@/lib/types';

export type TemplateProperty = {
  id: string;
  href: string;
  imageUrl?: string | null;
  title: string;
  subtitle?: string;
  priceText?: string;
  meta?: string[];
  badge?: string;
};

export function toTemplateProperty(l: DbListing): TemplateProperty {
  // 1) Price text
  const priceText =
    typeof l.list_price === 'number'
      ? l.list_price.toLocaleString('en-CA', {
          style: 'currency',
          currency: 'CAD',  // Hardcode currency here
          maximumFractionDigits: 0
        })
      : 'Price on request';

  // 2) Subtitle = city, province
  const subtitleParts = [l.municipality, l.province].filter(Boolean);
  const subtitle = subtitleParts.join(', ') || undefined;

  // 3) Meta line: beds · baths · sqft
  const metaParts: string[] = [];
  if (l.bedrooms != null) metaParts.push(`${l.bedrooms} bd`);
  if (l.bathrooms != null) metaParts.push(`${l.bathrooms} ba`);
  if (l.living_area != null) {
    metaParts.push(`${l.living_area.toLocaleString()} sqft`);
  }
  const meta = metaParts.length ? [metaParts.join(' · ')] : undefined;

  // 4) Badge: property type / subtype
  const badge = l.property_type ?? l.property_subtype ?? undefined;

  // 5) Title fallback
  const title =
    l.address ??
    (l.mls_number ? `MLS® #${l.mls_number}` : 'Listing');

  return {
    id: l.id,
    href: `/listings/${l.id}`,
    imageUrl: l.main_image_url && l.main_image_url.trim() !== ''
      ? l.main_image_url
      : '/placeholder.jpg',
    title,
    subtitle,
    priceText,
    meta,
    badge,
  };
}
