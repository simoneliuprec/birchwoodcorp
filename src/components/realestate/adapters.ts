import type { DbListing } from '@/lib/types';

export type TemplateProperty = {
  id: string;
  href: string;
  title: string;          // e.g., "Vancouver – Condo"
  subtitle?: string;      // optional small line
  priceText: string;      // formatted price
  meta: string;           // e.g., "2 bd • 2 ba • 920 sqft"
  badge?: string | null;  // e.g., "Active"
  imageUrl: string;
  mls?: string | null;
};

function formatPrice(value: number | null | undefined, currency: string | null | undefined) {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) return 'Contact for price';
  const cur = (currency ?? 'CAD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
      return `$${value.toLocaleString()}`;
  }
}

export function toTemplateProperty(l: DbListing): TemplateProperty {
  const city = l.municipality ?? l.address?.municipality ?? 'Unknown City';
  const title = `${city} – ${l.property_type ?? 'Property'}`;
  const priceText = formatPrice(l.list_price, l.currency);

  const parts: string[] = [];
  parts.push(`${l.bedrooms ?? '?' } bd`);
  parts.push(`${l.bathrooms ?? '?' } ba`);
  if (l.area_sqft) parts.push(`${l.area_sqft.toLocaleString()} sqft`);

  return {
    id: l.id,
    href: `/listings/${l.id}`,
    title,
    subtitle: l.mls_number ? `MLS® #${l.mls_number}` : undefined,
    priceText,
    meta: parts.join(' • '),
    badge: l.listing_status,
    imageUrl: l.main_image_url ?? '/placeholder.jpg',
    mls: l.mls_number,
  };
}
