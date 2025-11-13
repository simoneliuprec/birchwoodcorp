export const TAGS = {
  LISTINGS: 'listings',
  LISTING: (id: string | number) => `listing:${id}`,
  LISTINGS_INDEX: "listings-index",
  LISTING_DETAIL: "listing-detail",
};
export const REVALIDATE_SECONDS = 60 * 30; // 5mins ISR
export const PAGE_SIZE = 24;