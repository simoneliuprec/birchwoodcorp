// src/app/api/sync/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabaseAnon, supabaseService } from '@/lib/supabase';
import { getDdfAccessToken } from '@/lib/ddfAuth';
import { TAGS } from '@/lib/caching';
import { mapDdfToRow as mapToRow } from '@/ingest/mapDdfToRow';

const BASE = (process.env.DDF_BASE_URL ?? 'https://ddfapi.realtor.ca/odata/v1').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET ?? '';
const ENFORCE_CRON_AUTH = process.env.VERCEL === '1' && !!CRON_SECRET;
const PAGE_TOP = 100;

/* ------------------------ Small helpers ------------------------ */

function chunk<T>(arr: T[], n = 50): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function encodeInList(values: string[]) {
  // OData `in ('a','b')` with doubled quotes
  const quoted = values.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
  return `(${quoted})`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------ Property Select ------------------------ */
/** Use only fields you actually observed in your feed (from your sample). */
const PROPERTY_SELECT_FIELDS = [
  'ListingKey',
  'ListingId',
  'ListPrice',
  'PropertySubType',
  'BedroomsTotal',
  'BathroomsTotalInteger',   // swap to BathroomsTotal if needed
  'UnparsedAddress',
  'StreetNumber',
  'StreetName',
  'City',
  'StateOrProvince',
  'PostalCode',
  'Latitude',
  'Longitude',
  'StandardStatus',
  'OriginalEntryTimestamp',
  'StatusChangeTimestamp',
  'ModificationTimestamp',
];

/* ------------------------ (Optional) Initial full page crawler ------------------------
   Kept for reference; current init uses Replication -> details path.
*/
/*
function propertyFirstPageUrl(): string {
  const url = new URL(`${BASE}/Property`);
  url.searchParams.set('$top', String(PAGE_TOP));
  url.searchParams.set('$select', PROPERTY_SELECT_FIELDS.join(','));
  url.searchParams.set('$orderby', 'ModificationTimestamp desc');
  return url.toString();
}

async function fetchPropertyPage(urlOrNext: string) {
  const token = await getDdfAccessToken();
  const res = await fetch(urlOrNext, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 429) {
    await sleep(800);
    return fetchPropertyPage(urlOrNext);
  }
  if (!res.ok) throw new Error(`DDF fetch ${res.status}: ${await res.text()}`);

  const json: any = await res.json();
  const records: any[] = json.value ?? [];
  const nextLink: string | undefined = json['@odata.nextLink'] ?? undefined;
  return { records, nextLink };
}
*/
/* ------------------------ Replication (no $top) ------------------------
   Allowed: $filter, $orderby, $select, $count. We only use $filter/$orderby.
*/
async function fetchReplicationSince(sinceISO: string | null, orderBy?: string) {
  const token = await getDdfAccessToken();

  // Path-style per your doc (function-style () is also valid)
  let url = new URL(`${BASE}/Property/PropertyReplication`);
  if (sinceISO) {
    // examples show unquoted ISO
    url.searchParams.set('$filter', `ModificationTimestamp gt ${sinceISO}`);
  }
  if (orderBy) {
    url.searchParams.set('$orderby', orderBy); // e.g., 'ModificationTimestamp desc'
  }
  // DO NOT set $top

  const out: { ListingKey: string; ModificationTimestamp?: string }[] = [];

  while (true) {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`DDF replication ${res.status}: ${text}`);
    }

    const json: any = await res.json();
    const rows: any[] = json.value ?? [];
    for (const r of rows) {
      if (r?.ListingKey != null) {
        out.push({
          ListingKey: String(r.ListingKey),
          ModificationTimestamp: r.ModificationTimestamp,
        });
      }
    }

    const next = json['@odata.nextLink'];
    if (!next) break;
    url = new URL(next); // follow server-driven paging
  }

  return out;
}

/** Fetch details for a set of ListingKeys via `$filter=ListingKey in ('a','b')` */
async function fetchPropertiesByKeys(keys: string[]) {
  const token = await getDdfAccessToken();
  const all: any[] = [];
  for (const part of chunk(keys, 60)) {
    const url = new URL(`${BASE}/Property`);
    const inList = encodeInList(part);
    url.searchParams.set('$filter', `ListingKey in ${inList}`);
    url.searchParams.set('$select', PROPERTY_SELECT_FIELDS.join(','));
    url.searchParams.set('$top', String(PAGE_TOP)); // okay on /Property
    url.searchParams.set('$orderby', 'ModificationTimestamp desc');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`DDF property-by-keys ${res.status}: ${await res.text()}`);
    const json: any = await res.json();
    all.push(...(json.value ?? []));
  }
  return all;
}

/* ------------------------ Media (resilient dual strategy) ------------------------ */
async function fetchMediaForListings(props: any[]) {
  const mediaByKey = new Map<string, any[]>();
  if (!props.length) return mediaByKey;

  const token = await getDdfAccessToken();
  const listingKeys = props.map(p => String(p.ListingKey));
  const listingIds  = props.map(p => String(p.ListingId ?? ''));

  async function runMediaQuery(filter: string) {
    const select = [
      'MediaKey',
      'ResourceRecordKey', // expected to match ListingKey
      'ResourceRecordId',  // often equals ListingId
      'ResourceName',      // 'Property'
      'MediaURL',
      'Order',
      'MediaSequence',
      'PreferredPhotoYN',
      'LongDescription',
      'MediaCategory',
      'ModificationTimestamp',
    ].join(',');
    const u = new URL(`${BASE}/Media`);
    u.searchParams.set('$select', select);
    u.searchParams.set('$filter', filter);
    u.searchParams.set('$top', '1000'); // okay on /Media
    return fetch(u.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  }

  // Try by ResourceRecordKey (== ListingKey)
  try {
    for (const ks of chunk(listingKeys, 50)) {
      const keyFilter = ks.map(k => `ResourceRecordKey eq '${k.replace(/'/g, "''")}'`).join(' or ');
      const res = await runMediaQuery(`(ResourceName eq 'Property') and (${keyFilter})`);
      if (res.status === 404) throw new Error('fallback-to-id');
      if (!res.ok) throw new Error(await res.text());
      const json: any = await res.json();
      for (const m of (json.value ?? [])) {
        const key = String(m.ResourceRecordKey ?? '');
        if (!key) continue;
        if (!mediaByKey.has(key)) mediaByKey.set(key, []);
        mediaByKey.get(key)!.push(m);
      }
    }
  } catch {
    // Fallback by ResourceRecordId (== ListingId)
    for (const ids of chunk(listingIds.filter(Boolean), 50)) {
      const idFilter = ids.map(id => `ResourceRecordId eq '${id.replace(/'/g, "''")}'`).join(' or ');
      const res = await runMediaQuery(`(ResourceName eq 'Property') and (${idFilter})`);
      if (!res.ok) {
        // Give up silently; we’ll still use inline Media when present
        return mediaByKey;
      }
      const json: any = await res.json();
      for (const m of (json.value ?? [])) {
        const id = String(m.ResourceRecordId ?? '');
        const prop = props.find(p => String(p.ListingId ?? '') === id);
        const key = prop ? String(prop.ListingKey) : '';
        if (!key) continue;
        if (!mediaByKey.has(key)) mediaByKey.set(key, []);
        mediaByKey.get(key)!.push(m);
      }
    }
  }

  // Sort media per listing by Order/MediaSequence (ascending)
  for (const arr of mediaByKey.values()) {
    arr.sort((a, b) => {
      const aa = a?.Order ?? a?.MediaSequence ?? 9999;
      const bb = b?.Order ?? b?.MediaSequence ?? 9999;
      return aa - bb;
    });
  }

  return mediaByKey;
}

/* ------------------------ POST: /api/sync ------------------------ */
export async function POST(req: Request) {
  if (ENFORCE_CRON_AUTH) {
    const bearer = req.headers.get('authorization');
    const xcron = req.headers.get('x-cron-secret');
    const ok = bearer === `Bearer ${CRON_SECRET}` || (!!xcron && xcron === CRON_SECRET);
    if (!ok) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get('mode') ?? 'delta').toLowerCase(); // init | delta | master
  const since = searchParams.get('since'); // ISO string (only used in delta)

  // DEBUG
  if (searchParams.get('debug') === '1') {
  try {
      const token = await getDdfAccessToken();
      // probe first replication *page only*
      const probeUrl = new URL(`${BASE}/Property/PropertyReplication`);
      // keep it tiny; no $top on replication
      const res = await fetch(probeUrl.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      const text = await res.text();
      // don’t parse large JSON—just return status + a small slice
      return NextResponse.json({
        ok: res.ok,
        status: res.status,
        bytes: text.length,
        preview: text.slice(0, 500), // first 500 chars so we know it’s alive
      });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
  }

  try {
    const sb = supabaseService();
    const changedIds: string[] = [];
    let pages = 0;

    if (mode === 'master') {
      // full master list (active keys), then reconcile deletions
      const master = await fetchReplicationSince(null, 'ModificationTimestamp desc'); // all pages
      const activeKeys = new Set(master.map(x => String(x.ListingKey)));

      // Soft-unpublish any rows not in activeKeys
      const { data: staleRows, error: staleErr } = await sb
        .from('listings')
        .select('id, listing_key');
      if (staleErr) throw staleErr;

      const toUnpublish = (staleRows ?? [])
        .filter(r => !activeKeys.has(String(r.listing_key)))
        .map(r => r.id);
      if (toUnpublish.length) {
        const { error } = await sb
          .from('listings')
          .update({ is_published: false, listing_status: 'Expired' })
          .in('id', toUnpublish);
        if (error) throw error;
      }

      revalidateTag(TAGS.LISTINGS_INDEX);
      return NextResponse.json({ ok: true, mode, removed: toUnpublish.length });
    }

    if (mode === 'init') {
      // 1) Get full master list of keys (paged)
      const master = await fetchReplicationSince(null, 'ModificationTimestamp desc');
      const keys = [...new Set(master.map(x => String(x.ListingKey)))];
      if (!keys.length) {
        revalidateTag(TAGS.LISTINGS_INDEX);
        return NextResponse.json({ ok: true, mode, pages: 0, changed: 0, message: 'No records in master' });
      }

      // 2) Fetch details in batches
      const details: any[] = [];
      for (const part of chunk(keys, 60)) {
        const partProps = await fetchPropertiesByKeys(part);
        details.push(...partProps);
        pages++;
        await sleep(80);
      }

      // 3) Fetch media (resilient)
      const mediaByKey = await fetchMediaForListings(details);

      // 4) Map & upsert — prefer inline media
      const rows = details
        .map((p) => {
          const inline = Array.isArray(p.Media) ? p.Media : [];
          const external = mediaByKey.get(String(p.ListingKey)) ?? [];
          const media = inline.length ? inline : external;
          return mapToRow(p, media);
        })
        .filter((r) => !!r?.mls_number);

      if (rows.length) {
        const { data, error } = await sb
          .from('listings')
          .upsert(rows, { onConflict: 'mls_number' })
          .select('id');
        if (error) throw error;
        (data ?? []).forEach((x: any) => changedIds.push(x.id));
      }

      revalidateTag(TAGS.LISTINGS_INDEX);
      return NextResponse.json({
        ok: true,
        mode,
        pages,               // number of detail batches
        changed: rows.length,
      });
    }

    // default: delta
    const sinceIso = since || new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const repl = await fetchReplicationSince(sinceIso, 'ModificationTimestamp desc');
    const keys = [...new Set(repl.map(r => String(r.ListingKey)))];
    if (!keys.length) {
      revalidateTag(TAGS.LISTINGS_INDEX);
      return NextResponse.json({ ok: true, mode, pages: 0, changed: 0, message: 'No recent updates' });
    }

    // details for keys
    const details = await fetchPropertiesByKeys(keys);
    // media for details
    const mediaByKey = await fetchMediaForListings(details);

    const rows = details.map(p => {
      const inline = Array.isArray(p.Media) ? p.Media : [];
      const external = mediaByKey.get(String(p.ListingKey)) ?? [];
      const media = inline.length ? inline : external;
      return mapToRow(p, media);
    }).filter(r => !!r?.mls_number);

    if (rows.length) {
      const { data, error } = await sb
        .from('listings')
        .upsert(rows, { onConflict: 'mls_number' })
        .select('id');
      if (error) throw error;
      (data ?? []).forEach((x: any) => changedIds.push(x.id));
    }

    revalidateTag(TAGS.LISTINGS_INDEX);
    return NextResponse.json({ ok: true, mode, pages: 1, changed: changedIds.length, since: sinceIso });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message ?? 'sync failed' }, { status: 500 });
  }
}

/* ------------------------ GET: quick health ------------------------ */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sb = supabaseAnon();

  let query = sb
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .neq('listing_status', 'Expired');

  const city = searchParams.get('city');
  if (city) query = query.ilike('municipality', `%${city}%`);

  const { count, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: count ?? 0 });
}
