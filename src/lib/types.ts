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
  id: string;                       // uuid
  mls_number: string | null;
  listing_status: string | null;    // e.g., "Active", "Sold", "Pending"
  property_type: string | null;     // house/condo/townhouse...
  list_price: number | null;        // numeric
  original_price: number | null;
  sale_price: number | null;
  currency: string | null;          // 'CAD' by default
  list_date: string | null;         // timestamptz
  update_date: string | null;       // timestamptz (upstream)
  days_on_market: number | null;
  address: Address | null;          // jsonb
  municipality: string | null;      // STORED from address
  province: string | null;          // STORED
  postal_code: string | null;       // STORED
  latitude: number | null;          // STORED from address.geo.lat
  longitude: number | null;         // STORED from address.geo.lng
  bedrooms: number | null;          // integer
  bathrooms: number | null;         // numeric
  bathrooms_partial: number | null; // integer
  total_rooms: number | null;
  stories: number | null;
  building_age: number | null;
  building_type: string | null;
  parking_type: string | null;
  parking_spaces: number | null;
  heating: string | null;
  cooling: string | null;
  basement: string | null;
  dimensions: Dimensions | null;    // jsonb
  area_sqft: number | null;         // STORED from dimensions.sqft
  media_urls: string[] | null;
  main_image_url: string | null;
  gallery_urls: string[] | null;
  virtual_tour_url: string | null;
  public_remarks: string | null;
  private_notes: string | null;
  listing_agent_id: string | null;
  cooperating_broker: string | null;
  amenities: string[] | null;
  keywords: string[] | null;
  source: string | null;
  status_updated_at: string | null;
  public_url: string | null;
  raw_payload: Record<string, unknown> | null;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};
