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
    // url.searchParams.set('$select', PROPERTY_SELECT_FIELDS.join(','));
    // url.searchParams.set('$expand', 'Media');
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

/** Fetch a single property by ListingKey using /Property('key') */
async function fetchPropertyByKey(listingKey: string) {
  const token = await getDdfAccessToken();
  const url = `${BASE}/Property('${listingKey.replace(/'/g, "''")}')`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`DDF property-by-key ${res.status}: ${await res.text()}`);
  }

  const json: any = await res.json();
  return json;
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
    const ok =
      bearer === `Bearer ${CRON_SECRET}` ||
      (!!xcron && xcron === CRON_SECRET);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get('mode') ?? 'delta').toLowerCase(); // init | delta | master | single
  const since = searchParams.get('since'); // ISO string, used in delta
  const singleKey = searchParams.get('key'); // for mode=single
  const max = Number(searchParams.get('max') ?? '50'); // used in init

  // ---------------- DEBUG probe ----------------
  if (searchParams.get('debug') === '1') {
    try {
      const token = await getDdfAccessToken();
      const probeUrl = new URL(`${BASE}/Property/PropertyReplication`);
      const res = await fetch(probeUrl.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      const text = await res.text();
      return NextResponse.json({
        ok: res.ok,
        status: res.status,
        bytes: text.length,
        preview: text.slice(0, 500),
      });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: String(e?.message ?? e) },
        { status: 500 }
      );
    }
  }

  try {
    const sb = supabaseService();
    const changedIds: string[] = [];

    // current sync state row (may or may not exist yet)
    const stateRes = await sb
      .from('ddf_sync_state')
      .select('*')
      .eq('id', 'property')
      .maybeSingle();

    if (stateRes.error) throw stateRes.error;
    const syncState = stateRes.data ?? null;

    /* ------------------------ MASTER ------------------------ */
    if (mode === 'master') {
      // full master list of keys (all pages), then reconcile deletions
      const master = await fetchReplicationSince(null, 'ModificationTimestamp desc');
      const activeKeys = new Set(master.map((x) => String(x.ListingKey)));

      // Soft-unpublish any rows whose listing_key is NOT in activeKeys
      const { data: staleRows, error: staleErr } = await sb
        .from('listings')
        .select('id, listing_key');

      if (staleErr) throw staleErr;

      const toUnpublish = (staleRows ?? [])
        .filter((r) => !activeKeys.has(String(r.listing_key)))
        .map((r) => r.id);

      if (toUnpublish.length) {
        const { error } = await sb
          .from('listings')
          .update({ is_published: false, listing_status: 'Expired' })
          .in('id', toUnpublish);

        if (error) throw error;
      }

      // update sync state
      await sb
        .from('ddf_sync_state')
        .upsert({
          id: 'property',
          last_master_at: new Date().toISOString(),
        });

      revalidateTag(TAGS.LISTINGS_INDEX);
      return NextResponse.json({
        ok: true,
        mode,
        removed: toUnpublish.length,
      });
    }

    /* ------------------------ SINGLE ------------------------ */
    if (mode === 'single') {
      if (!singleKey) {
        return NextResponse.json(
          { ok: false, error: 'missing key param for mode=single' },
          { status: 400 }
        );
      }

      // 1) Fetch single property details (includes inline Media)
      const property = await fetchPropertyByKey(singleKey);
      if (!property || !property.ListingKey) {
        return NextResponse.json(
          { ok: false, error: 'property not found for given key' },
          { status: 404 }
        );
      }

      // 2) Fetch media for this property as a fallback (in case some boards don't inline Media)
      const details = [property];
      const mediaByKey = await fetchMediaForListings(details);
      const inline = Array.isArray(property.Media) ? property.Media : [];
      const external = mediaByKey.get(String(property.ListingKey)) ?? [];
      const media = inline.length ? inline : external;

      // 3) Map & upsert
      const row = mapToRow(property, media);
      if (!row?.mls_number) {
        return NextResponse.json(
          { ok: false, error: 'mapped row is missing mls_number' },
          { status: 400 }
        );
      }

      const { data, error } = await sb
        .from('listings')
        .upsert(row, { onConflict: 'mls_number' })
        .select('id');

      if (error) throw error;
      const changedId = data?.[0]?.id ?? null;

      revalidateTag(TAGS.LISTINGS_INDEX);
      return NextResponse.json({
        ok: true,
        mode,
        changed: changedId ? 1 : 0,
        id: changedId,
      });
    }

    /* ------------------------ INIT (simple dev-friendly) ------------------------ */
    if (mode === 'init') {
      const safeMax = Math.max(1, Math.min(max, 100)); // /Property $top limit is 100
      console.log('[sync:init] starting simple init', { max: safeMax });

      // 1) Directly fetch latest `safeMax` properties with full payload (including Media)
      const token = await getDdfAccessToken();
      const url = new URL(`${BASE}/Property`);
      url.searchParams.set('$top', String(safeMax));
      url.searchParams.set('$orderby', 'ModificationTimestamp desc');
      // IMPORTANT: no $select, no $expand so we get full objects + inline Media

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `DDF initial Property fetch ${res.status}: ${text}`
        );
      }

      const json: any = await res.json();
      const details: any[] = json.value ?? [];
      console.log('[sync:init] fetched properties from DDF', details.length);

      if (!details.length) {
        revalidateTag(TAGS.LISTINGS_INDEX);
        return NextResponse.json({
          ok: true,
          mode,
          changed: 0,
          message: 'No properties returned from /Property',
        });
      }

      // 2) Map & upsert using inline Media
      const rows = details
        .map((p: any) => {
          const inlineMedia = Array.isArray(p.Media) ? p.Media : [];
          return mapToRow(p, inlineMedia);
        })
        .filter((r) => !!r?.mls_number);

      console.log('[sync:init] rows to upsert', rows.length);

      if (rows.length) {
        const { data, error } = await sb
          .from('listings')
          .upsert(rows, { onConflict: 'mls_number' })
          .select('id');

        if (error) throw error;
        (data ?? []).forEach((x: any) => changedIds.push(x.id));

        // store latest ModificationTimestamp into sync state
        const newestMod =
          details
            .map(
              (p: any) =>
                (p.ModificationTimestamp as string | null | undefined) ?? null
            )
            .filter((v): v is string => !!v)
            .sort()
            .at(-1) ?? null;

        if (newestMod) {
          await sb
            .from('ddf_sync_state')
            .upsert({
              id: 'property',
              last_init_at: new Date().toISOString(),
              last_delta_at: new Date().toISOString(),
              last_successful_modification: newestMod,
            });
        }
      }

      revalidateTag(TAGS.LISTINGS_INDEX);
      return NextResponse.json({
        ok: true,
        mode,
        changed: rows.length,
      });
    }

    /* ------------------------ DELTA (default) ------------------------ */
    let sinceIso = since;
    let usedFallback = false;

    if (!sinceIso) {
      if (syncState?.last_successful_modification) {
        // resume from last successful mod time
        sinceIso = syncState.last_successful_modification;
      } else {
        // safety fallback if init never ran: go back 7 days
        sinceIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        usedFallback = true;
      }
    }

    const repl = await fetchReplicationSince(
      sinceIso,
      'ModificationTimestamp desc'
    );
    const keys = [...new Set(repl.map((r) => String(r.ListingKey)))];

    if (!keys.length) {
      // no changes since sinceIso
      if (!usedFallback && syncState?.last_successful_modification) {
        await sb
          .from('ddf_sync_state')
          .upsert({
            id: 'property',
            last_delta_at: new Date().toISOString(),
          });
      }

      revalidateTag(TAGS.LISTINGS_INDEX);
      return NextResponse.json({
        ok: true,
        mode,
        changed: 0,
        since: sinceIso,
        message: 'No recent updates',
      });
    }

    // Fetch details for those keys
    const details = await fetchPropertiesByKeys(keys);
    // Fetch media for them
    const mediaByKey = await fetchMediaForListings(details);

    const rows = details
      .map((p: any) => {
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

      // newest ModificationTimestamp from details
      const newestMod =
        details
          .map(
            (p: any) =>
              (p.ModificationTimestamp as string | null | undefined) ?? null
          )
          .filter((v): v is string => !!v)
          .sort()
          .at(-1) ?? null;

      if (newestMod) {
        await sb
          .from('ddf_sync_state')
          .upsert({
            id: 'property',
            last_delta_at: new Date().toISOString(),
            last_successful_modification: newestMod,
          });
      }
    }

    revalidateTag(TAGS.LISTINGS_INDEX);
    return NextResponse.json({
      ok: true,
      mode,
      changed: changedIds.length,
      since: sinceIso,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'sync failed' },
      { status: 500 }
    );
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
