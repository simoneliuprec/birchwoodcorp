import Image from 'next/image';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { supabaseAnon } from '@/lib/supabase';
import { TAGS, REVALIDATE_SECONDS } from '@/lib/caching';
import type { DbListing } from '@/lib/types';

export const revalidate = 300;
export const dynamic = 'force-static';

// --- data fetchers ---
async function fetchListing(id: string) {
  const sb = supabaseAnon();
  const { data, error } = await sb
    .from('listings')
    .select(`
      id, mls_number, listing_status, property_type, list_price, currency,
      bedrooms, bathrooms, area_sqft,
      address, municipality, province, postal_code,
      main_image_url, gallery_urls,
      public_remarks, updated_at
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as DbListing | null);
}

const getListing = (id: string) =>
  unstable_cache(
    () => fetchListing(id),
    ['listing', id],
    { tags: [TAGS.LISTING(id)], revalidate: REVALIDATE_SECONDS }
  )();

// --- metadata (await params!) ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // 👈 Next 15: await
  const data = await getListing(id);

  const titleBits = [
    data?.municipality ?? data?.address?.municipality,
    data?.property_type ?? 'Listing',
  ].filter(Boolean);

  const title = `${titleBits.join(' – ')} | BirchwoodCorp`;
  return {
    title,
    openGraph: {
      title,
      images: data?.main_image_url ? [{ url: data.main_image_url }] : undefined,
    },
    twitter: { card: 'summary_large_image', title },
  };
}

// --- page (await params!) ---
export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // 👈 Next 15: await
  const data = await getListing(id);
  if (!data) return notFound();

  const city = data.municipality ?? data.address?.municipality ?? '';
  const street = [
    data.address?.streetNumber,
    data.address?.streetName,
    data.address?.unit ? `#${data.address.unit}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const prov = data.province ?? data.address?.province ?? '';
  const postal = data.postal_code ?? data.address?.postalCode ?? '';

  return (
    <main className="container mx-auto py-10">
      <h1 className="text-2xl font-semibold">
        {city ? `${city} – ` : ''}{data.property_type ?? 'Property'}
      </h1>

      <p className="text-lg font-bold mt-2">
        {typeof data.list_price === 'number' && data.list_price > 0
          ? `${(data.currency ?? 'CAD').toUpperCase()} $${data.list_price.toLocaleString()}`
          : 'Contact for price'}
      </p>

      {/* Cover image */}
      <div className="mt-6 relative w-full h-80 overflow-hidden rounded-xl">
        <Image
          src={data.main_image_url || '/placeholder.jpg'}
          alt={data.property_type ?? 'Listing cover'}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      {/* Gallery */}
      {Array.isArray(data.gallery_urls) && data.gallery_urls.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {data.gallery_urls.map((u) => (
            <div key={u} className="relative w-full h-48 overflow-hidden rounded-lg">
              <Image src={u} alt="" fill className="object-cover" sizes="33vw" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Facts */}
      <div className="mt-6 grid gap-2 text-gray-700">
        <div>
          {data.bedrooms ?? '?'} bd • {data.bathrooms ?? '?'} ba • {data.area_sqft ?? '?'} sqft
        </div>
        <div>{street}</div>
        <div>
          {city}{city && (prov || postal) ? ',' : ''} {prov} {postal}
        </div>
      </div>

      {/* Remarks */}
      {data.public_remarks && (
        <article className="mt-6 prose max-w-none">
          <h2>Description</h2>
          <p>{data.public_remarks}</p>
        </article>
      )}
    </main>
  );
}
