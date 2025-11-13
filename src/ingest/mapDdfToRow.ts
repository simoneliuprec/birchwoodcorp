// src/ingest/mapDdfToRow.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// import type { DbListing } from "@/lib/types";

type DdfProperty = any; // tighten later if you like
type DdfMedia = { MediaURL?: string; Order?: number; MediaSequence?: number };

/**
 * Map a DDF Property + Media[] to your public.listings row.
 * Ensure your DB has matching columns: mls_number, listing_key, main_image_url, photo_urls, etc.
 */
export function mapDdfToRow(property: DdfProperty, media: DdfMedia[]) {
  const sortedPhotos = (media ?? [])
    .filter((m) => typeof m?.MediaURL === "string")
    .sort((a, b) => {
      const aa = a?.Order ?? a?.MediaSequence ?? 9999;
      const bb = b?.Order ?? b?.MediaSequence ?? 9999;
      return aa - bb;
    });

  const photoUrls = sortedPhotos.map((m) => m.MediaURL as string);

  // Build a fallback address string from parts
  const addrFromParts = [property.StreetNumber, property.StreetName, property.City]
    .filter(Boolean)
    .join(' ');

  // IMPORTANT: parens so ?? mixing with || is unambiguous
  const address = (property.UnparsedAddress ?? addrFromParts) || null;

  return {
    // identifiers
    mls_number: property.ListingId ?? null,
    listing_key: String(property.ListingKey ?? ""),

    // core fields
    property_type: property.PropertyType ?? property.PropertySubType ?? null,
    property_subtype: property.PropertySubType ?? null,
    list_price: property.ListPrice ?? null,
    bedrooms: property.BedroomsTotal ?? null,
    bathrooms: property.BathroomsTotalInteger ?? null, // if your board uses BathroomsTotal, swap here

    // address / geo
    municipality: property.City ?? null,
    province: property.StateOrProvince ?? null,
    postal_code: property.PostalCode ?? null,
    address,
    lat: property.Latitude ?? null,
    lng: property.Longitude ?? null,

    // status / dates
    listing_status: property.StandardStatus ?? null,
    listed_at: property.ListingContractDate ??
      property.OriginalEntryTimestamp ??
      property.StatusChangeTimestamp ??
      null,
    updated_at: property.ModificationTimestamp ?? null,

    // media
    main_image_url: photoUrls[0] ?? null,
    photo_urls: photoUrls,

    // raw blobs (optional but useful for debugging)
    raw: property,
    raw_media: media ?? [],

    // publish logic (adjust as needed)
    is_published: true,
  };
}
