/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Address = {
  streetNumber?: string | null;
  streetName?: string | null;
  unit?: string | null;
  municipality?: string | null;
  province?: string | null;
  postalCode?: string | null;
  geo?: { lat?: number; lng?: number } | null;
};

export type Dimensions = {
  sqft?: number | null;
  lotSqft?: number | null;
  [k: string]: unknown;
};

export type DbListing = {
  id: string;
  mls_number: string | null;
  listing_key: string | null;

  property_type: string | null;
  property_subtype: string | null;
  list_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;

  municipality: string | null;
  province: string | null;
  postal_code: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;

  living_area: number | null;
  photos_count: number | null;

  main_image_url: string | null;
  photo_urls: string[] | null;

  public_remarks: string | null;
  listing_status: string | null;
  listed_at: string | null;
  updated_at: string | null;

  is_published: boolean;
  raw?: Json | null;
  raw_media?: Json | null;
};
