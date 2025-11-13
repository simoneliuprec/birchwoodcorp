import Image from 'next/image';
import Link from 'next/link';
import type { DbListing } from '@/lib/types';

function formatPrice(value: number | null | undefined, currency: string | null | undefined) {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) return 'Contact for price';
  const cur = (currency ?? 'CAD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
}

export default function ListingCard({ listing }: { listing: DbListing }) {
  const {
    id,
    mls_number,
    property_type,
    bedrooms,
    bathrooms,
    area_sqft,
    list_price,
    currency,
    municipality,
    address,
    main_image_url,
    listing_status,
  } = listing;

  const city = municipality ?? address?.municipality ?? 'Unknown City';
  const priceText = formatPrice(list_price, currency);

  return (
    <article className="rounded-2xl shadow p-4 bg-white hover:shadow-md transition">
      {/* MEDIA (only this part is linked) */}
      <Link href={`/listings/${id}`} className="block group" prefetch={false}>
        {/* ✅ Fixed-height, positioned box so <Image fill> can't overflow */}
        <div className="mb-3 overflow-hidden rounded-lg">
          {/* ratio box: 16/9 = 56.25% */}
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <Image
              src={main_image_url ?? '/placeholder.jpg'}
              alt={mls_number ?? 'Listing'}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
              priority={false}
            />
          </div>
        </div>

        <h3 className="font-semibold text-lg line-clamp-1 group-hover:underline">
          {city} – {property_type ?? 'Property'}
        </h3>
      </Link>

      {/* TEXT (not inside any absolute container) */}
      <p className="text-gray-600 text-sm mt-1">
        {bedrooms ?? '?'} bd • {bathrooms ?? '?'} ba
        {area_sqft ? <> • {area_sqft.toLocaleString()} sqft</> : null}
      </p>

      <p className="mt-1 font-bold">{priceText}</p>

      {listing_status && (
        <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {listing_status}
        </span>
      )}

      {mls_number && <p className="mt-1 text-xs text-gray-500">MLS® #{mls_number}</p>}
    </article>
  );
}
