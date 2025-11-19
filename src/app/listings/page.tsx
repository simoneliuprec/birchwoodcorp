// app/listings/page.tsx — Server Component (Next 15)
import type { DbListing } from '@/lib/types';
import { unstable_cache } from 'next/cache';
import { supabaseAnon } from '@/lib/supabase';
import { TAGS, PAGE_SIZE, REVALIDATE_SECONDS } from '@/lib/caching';
import SearchControls from './components/SearchControls';
import Pagination from './components/Pagination';
import { toTemplateProperty } from '@/components/realestate/adapters';
import PropertyCardAdapter from '@/components/realestate/PropertyCardAdapter';

export const revalidate = 300;

type SearchParams = {
  city?: string;
  min?: string;
  max?: string;
  beds?: string;
  baths?: string;
  type?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: string;
};

export const metadata = {
  title: 'Listings | BirchwoodCorp',
  description: 'Browse current real estate listings.',
};

// ----- Data fetcher -----
async function fetchListings(filters: {
  city?: string;
  min?: number;
  max?: number;
  beds?: number;
  baths?: number;
  type?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page: number;
}) {
  const sb = supabaseAnon();
  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = sb
    .from('listings')
    .select(
      `
      id,
      mls_number,
      property_type,
      list_price,
      bedrooms,
      bathrooms,
      living_area,
      municipality,
      province,
      postal_code,
      main_image_url,
      address,
      listing_status,
      updated_at
      `,
      { count: 'exact' }
    )
    .eq('is_published', true)
    .neq('listing_status', 'Expired');

  if (filters.city) q = q.ilike('municipality', `%${filters.city}%`);
  if (filters.type) q = q.eq('property_type', filters.type);
  if (filters.min != null) q = q.gte('list_price', filters.min);
  if (filters.max != null) q = q.lte('list_price', filters.max);
  if (filters.beds != null) q = q.gte('bedrooms', filters.beds);
  if (filters.baths != null) q = q.gte('bathrooms', filters.baths);

  switch (filters.sort) {
    case 'price_asc':
      q = q.order('list_price', { ascending: true, nullsFirst: true });
      break;
    case 'price_desc':
      q = q.order('list_price', { ascending: false });
      break;
    case 'newest':
    default:
      q = q.order('updated_at', { ascending: false });
      break;
  }

  const { data, error, count } = await q.range(from, to);
  if (error) throw error;

  const listings = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { listings, totalPages };
}

// Cached wrapper — IMPORTANT: tag must match /api/sync revalidation
const getCached = (filters: Parameters<typeof fetchListings>[0]) =>
  unstable_cache(
    () => fetchListings(filters),
    ['listings', JSON.stringify(filters)],
    { tags: [TAGS.LISTINGS_INDEX], revalidate: REVALIDATE_SECONDS }
  )();

// ----- Page -----
export default async function ListingsPage({
  searchParams,
}: {
  // Next 15: Promise style
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const page = Math.max(1, Number(sp.page ?? '1'));

  const rawSort = sp.sort;
  const sort: 'newest' | 'price_asc' | 'price_desc' =
    rawSort === 'price_asc' || rawSort === 'price_desc' || rawSort === 'newest'
      ? rawSort
      : 'newest';

  const { listings, totalPages } = await getCached({
    city: sp.city,
    min: sp.min ? Number(sp.min) : undefined,
    max: sp.max ? Number(sp.max) : undefined,
    beds: sp.beds ? Number(sp.beds) : undefined,
    baths: sp.baths ? Number(sp.baths) : undefined,
    type: sp.type,
    sort,
    page,
  });

  return (
    <main className="container mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Browse Listings</h1>

      {/* Client search/filter controls (i18n handled client-side) */}
      <SearchControls />

      {/* Results */}
      {listings.length === 0 ? (
        <div className="text-center text-gray-600 mt-6">
          No results found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-2">
          {(listings as DbListing[]).map((l) => {
            const item = toTemplateProperty(l);
            const key =
              item.id ||
              l.mls_number ||
              l.listing_key ||
              String(l.id);
            return <PropertyCardAdapter key={key} item={item} />;
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </main>
  );
}
