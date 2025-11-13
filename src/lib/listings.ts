import { supabaseAnon } from '@/lib/supabase';
import { PAGE_SIZE } from './caching';
import type { DbListing } from './types';

export type ListingFilters = {
  page?: number;
  q?: string;           // keyword on remarks/address/keywords
  city?: string;        // municipality
  min?: number;         // price
  max?: number;         // price
  beds?: number;
  baths?: number;
  type?: string;        // property_type
  sort?: 'newest' | 'price_asc' | 'price_desc';
  amenities?: string[]; // intersection filter
};

export async function fetchListings(filters: ListingFilters) {
  const page = Math.max(1, Number(filters.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const sb = supabaseAnon();

  // Core select: only columns needed for the list cards
  let query = sb
    .from('listings')
    .select(`
      id, mls_number, property_type, list_price, currency,
      bedrooms, bathrooms, area_sqft,
      municipality, province, postal_code,
      main_image_url, gallery_urls, public_remarks, updated_at,
      address
    `, { count: 'exact' })
    // publish/status gating (adjust as your business rule)
    .eq('is_published', true)
    .neq('listing_status', 'Expired');

  // filters
  if (filters.city) {
    query = query.ilike('municipality', `%${filters.city}%`);
  }
  if (filters.type) {
    query = query.eq('property_type', filters.type);
  }
  if (filters.min != null) query = query.gte('list_price', filters.min);
  if (filters.max != null) query = query.lte('list_price', filters.max);
  if (filters.beds != null) query = query.gte('bedrooms', filters.beds);
  if (filters.baths != null) query = query.gte('bathrooms', filters.baths);
  if (filters.amenities?.length) {
    // array overlap: require *contains all* (change to .overlaps if you want any-match)
    query = query.contains('amenities', filters.amenities);
  }
  if (filters.q) {
    const q = `%${filters.q}%`;
    // Fast path using your indexes: ilike on STORED columns + jsonb address
    // We OR public_remarks + address streetName + keywords (array)
    // Supabase “or” syntax uses CSV of conditions with dot-notation for JSON fields
    query = query.or(
      [
        `public_remarks.ilike.${q}`,
        // address->>'streetName'
        `address->>streetName.ilike.${q}`,
        // address->>'streetNumber'
        `address->>streetNumber.ilike.${q}`,
        // municipality/province/postal_code (all STORED)
        `municipality.ilike.${q}`,
        `province.ilike.${q}`,
        `postal_code.ilike.${q}`,
      ].join(',')
    );
  }

  // sort
  switch (filters.sort) {
    case 'price_asc':  query = query.order('list_price', { ascending: true, nullsFirst: true }); break;
    case 'price_desc': query = query.order('list_price', { ascending: false }); break;
    case 'newest':
    default:           query = query.order('updated_at', { ascending: false }); break; // idx_listings_updated_at
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as DbListing[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { rows, page, total, totalPages };
}
