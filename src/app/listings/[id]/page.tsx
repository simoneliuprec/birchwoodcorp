// src/app/listings/[id]/page.tsx
import type { Metadata } from 'next';
import { supabaseAnon } from '@/lib/supabase';
import type { DbListing } from '@/lib/types';
import Image from 'next/image';

type ListingParams = {
  id: string;
};

// ----- generateMetadata -----
export async function generateMetadata(
  { params }: { params: Promise<ListingParams> }
): Promise<Metadata> {
  const { id } = await params;

  const sb = supabaseAnon();
  const { data } = await sb
    .from('listings')
    .select(
      'id, mls_number, address, municipality, province, public_remarks, main_image_url'
    )
    .eq('id', id)
    .maybeSingle<DbListing>();

  if (!data) {
    return {
      title: 'Listing not found | BirchwoodCorp',
    };
  }

  const titleParts = [
    data.address,
    data.mls_number ? `MLS® ${data.mls_number}` : null,
  ].filter(Boolean);

  return {
    title: `${titleParts.join(' | ')} | BirchwoodCorp`,
    description:
      data.public_remarks ??
      `View details for listing ${data.mls_number ?? data.id} in ${
        data.municipality ?? data.province ?? 'Canada'
      }.`,
    openGraph: {
      title: titleParts.join(' | '),
      description: data.public_remarks ?? undefined,
      images: data.main_image_url ? [data.main_image_url] : [],
    },
  };
}

// ----- Page component -----
export default async function ListingDetailPage(
  { params }: { params: Promise<ListingParams> }
) {
  const { id } = await params;

  const sb = supabaseAnon();
  const { data, error } = await sb
    .from('listings')
    .select('*')
    .eq('id', id)
    .maybeSingle<DbListing>();

  if (error) {
    console.error(error);
    throw error;
  }

  if (!data) {
    return (
      <main className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <p className="mt-2 text-gray-600">
          The listing you’re looking for may have been removed or is no longer available.
        </p>
      </main>
    );
  }

  const city = data.municipality ?? '';
  const fullAddress = data.address ?? '';
  const prov = data.province ?? '';
  const postal = data.postal_code ?? '';

  const gallery: string[] = Array.isArray(data.photo_urls)
    ? (data.photo_urls as string[])
    : data.main_image_url
    ? [data.main_image_url]
    : [];

  const priceText =
    typeof data.list_price === 'number'
      ? `CAD $${data.list_price.toLocaleString()}`
      : 'Price on request';

  return (
    <main className="container mx-auto py-10 space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          {city && prov ? `${city}, ${prov}` : city || prov}
        </p>
        <h1 className="text-2xl font-semibold">{fullAddress || data.mls_number}</h1>
        <p className="text-lg font-medium mt-1">{priceText}</p>
        <p className="text-sm text-gray-500 mt-1">
          {postal && `${postal}`}
        </p>
      </div>

      {/* Main image / gallery */}
      {gallery.length > 0 && (
        <section className="space-y-3">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border">
            <Image
              src={gallery[0] ?? '/placeholder.jpg'}
              alt={fullAddress || data.mls_number || 'Listing photo'}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(1).map((u, idx) => (
                <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={u}
                    alt={`Photo ${idx + 2} of ${fullAddress || data.mls_number || 'listing'}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 25vw, 15vw"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Details */}
      <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {data.public_remarks ?? 'No description provided for this listing.'}
          </p>

          <div className="mt-4 text-gray-700 text-sm">
            <p>
              {data.bedrooms ?? '?'} bd • {data.bathrooms ?? '?'} ba •{' '}
              {data.living_area ?? '?'} sqft
            </p>
          </div>
        </div>

        <aside className="space-y-3 border rounded-xl p-4 bg-gray-50">
          <h3 className="font-semibold text-lg">Property details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">MLS® Number</dt>
              <dd className="font-medium">{data.mls_number ?? 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium">{data.property_type ?? 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium">{data.listing_status ?? 'Active'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Updated</dt>
              <dd className="font-medium">
                {data.updated_at
                  ? new Date(data.updated_at).toLocaleDateString()
                  : 'N/A'}
              </dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
