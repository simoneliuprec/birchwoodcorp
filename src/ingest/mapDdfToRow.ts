// src/ingest/mapDdfToRow.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export type DdfMedia = {
  MediaKey?: string;
  MediaURL?: string;
  Order?: number;
  MediaSequence?: number;
  LongDescription?: string | null;
  PreferredPhotoYN?: boolean;
  MediaCategory?: string | null;
  ModificationTimestamp?: string | null;
};

export type DdfProperty = {
  ListingKey?: string | number;
  ListingId?: string;
  ListPrice?: number | null;
  StandardStatus?: string | null;

  PropertyType?: string | null;
  PropertySubType?: string | null;

  BedroomsTotal?: number | null;
  BathroomsTotalInteger?: number | null;

  City?: string | null;
  StateOrProvince?: string | null;
  PostalCode?: string | null;
  Country?: string | null;
  UnparsedAddress?: string | null;
  StreetNumber?: string | null;
  StreetName?: string | null;

  Latitude?: number | null;
  Longitude?: number | null;

  PublicRemarks?: string | null;
  PhotosCount?: number | null;

  // area
  LivingArea?: number | null;
  LivingAreaUnits?: string | null;

  OriginalEntryTimestamp?: string | null;
  ModificationTimestamp?: string | null;
  StatusChangeTimestamp?: string | null;

  Media?: DdfMedia[];
};

/**
 * Minimal mapping (still available if you ever need it)
 */
export type ListingRowMinimal = {
  mls_number: string;
  list_price: number | null;
  listing_status: string | null;
  is_published: boolean;
};

export function mapDdfToRowMinimal(p: DdfProperty): ListingRowMinimal | null {
  const mls =
    (typeof p.ListingId === 'string' && p.ListingId.trim()) ||
    (p.ListingKey != null ? String(p.ListingKey) : '');

  if (!mls) return null;

  return {
    mls_number: mls,
    list_price: p.ListPrice ?? null,
    listing_status: p.StandardStatus ?? null,
    is_published: true,
  };
}

/**
 * Rich mapping used by /api/sync.
 *
 * Make sure your `public.listings` table has these columns:
 *
 *  mls_number           text        unique
 *  listing_key          text
 *  list_price           numeric
 *  listing_status       text
 *  property_type        text
 *  property_subtype     text
 *  bedrooms             int
 *  bathrooms            int
 *  living_area          numeric      -- from DDF LivingArea
 *  municipality         text
 *  province             text
 *  postal_code          text
 *  address              text
 *  lat                  double precision
 *  lng                  double precision
 *  photos_count         int
 *  main_image_url       text
 *  public_remarks       text
 *  listed_at            timestamptz
 *  updated_at           timestamptz
 *  photo_urls           text[] or jsonb
 *  raw                  jsonb
 *  raw_media            jsonb
 *  is_published         boolean
 */
export function mapDdfToRow(
  property: DdfProperty,
  mediaFromFetcher?: DdfMedia[]
) {
  // Prefer media passed in from fetchMediaForListings, but fall back to inline property.Media
  const media = mediaFromFetcher ?? property.Media ?? [];

  // Only keep real photo media (not virtual tours, PDFs, etc.)
  const photoMedia = (media ?? []).filter((m) => {
    if (!m?.MediaURL) return false;
    const url = m.MediaURL.toLowerCase();

    // Prefer category "Property Photo" if present
    const isPhotoCategory =
      !m.MediaCategory || m.MediaCategory === 'Property Photo';

    // Only treat as image if URL looks like an image file
    const looksLikeImage =
      url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.png') ||
      url.endsWith('.webp') ||
      url.endsWith('.gif');

    return isPhotoCategory && looksLikeImage;
  });

  const sortedPhotos = photoMedia.sort((a, b) => {
    const aa = a?.Order ?? a?.MediaSequence ?? 9999;
    const bb = b?.Order ?? b?.MediaSequence ?? 9999;
    return aa - bb;
  });

  const photoUrls = sortedPhotos.map((m) => m.MediaURL as string);

  // Build fallback address string: "123 MAIN Vancouver"
  const addrFromParts = [property.StreetNumber, property.StreetName, property.City]
    .filter(Boolean)
    .join(' ');

  const addressCandidate = property.UnparsedAddress ?? addrFromParts;
  const address =
    addressCandidate && addressCandidate.trim() !== '' ? addressCandidate : null;

  const listingKey =
    property.ListingKey != null ? String(property.ListingKey) : null;

  const mls =
    (typeof property.ListingId === 'string' && property.ListingId.trim()) ||
    listingKey;

  return {
    // identifiers
    mls_number: mls ?? null,
    listing_key: listingKey,

    // core fields
    property_type: property.PropertyType ?? property.PropertySubType ?? null,
    property_subtype: property.PropertySubType ?? null,
    list_price: property.ListPrice ?? null,

    // beds/baths: your schema uses `bedrooms` / `bathrooms`
    bedrooms: property.BedroomsTotal ?? null,
    bathrooms: property.BathroomsTotalInteger ?? null,

    // area: map DDF LivingArea -> DB living_area
    living_area: property.LivingArea ?? null,

    // address / geo
    municipality: property.City ?? null,
    province: property.StateOrProvince ?? null,
    postal_code: property.PostalCode ?? null,
    address,
    lat: property.Latitude ?? null,
    lng: property.Longitude ?? null,

    // status / dates
    listing_status: property.StandardStatus ?? null,
    listed_at:
      property.OriginalEntryTimestamp ??
      property.StatusChangeTimestamp ??
      null,
    updated_at: property.ModificationTimestamp ?? null,

    // media
    main_image_url: photoUrls[0] ?? null,
    photo_urls: photoUrls,

    // extras
    photos_count: property.PhotosCount ?? (photoUrls.length || null),
    public_remarks: property.PublicRemarks ?? null,

    // raw blobs (optional, very handy for debugging)
    raw: property as unknown,
    raw_media: media as unknown,

    // publish logic
    is_published: true,
  };
}
