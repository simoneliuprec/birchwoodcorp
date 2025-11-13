'use client';

import { useEffect, useTransition, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// optional: you might have i18n here; I'm keeping it generic

function sortedQS(qs: URLSearchParams): string {
  const entries = Array.from(qs.entries());
  entries.sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(entries).toString();
}

export default function SearchControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = searchParams ?? new URLSearchParams();

  const [city, setCity]   = useState(sp.get('city') ?? '');
  const [min, setMin]     = useState(sp.get('min') ?? '');
  const [max, setMax]     = useState(sp.get('max') ?? '');
  const [beds, setBeds]   = useState(sp.get('beds') ?? '');
  const [baths, setBaths] = useState(sp.get('baths') ?? '');
  const [type, setType]   = useState(sp.get('type') ?? '');
  const [sort, setSort]   = useState(sp.get('sort') ?? '');
  const [isPending, startTransition] = useTransition();

  // keep state in sync if URL changes
  useEffect(() => {
    const vCity  = sp.get('city') ?? '';
    const vMin   = sp.get('min') ?? '';
    const vMax   = sp.get('max') ?? '';
    const vBeds  = sp.get('beds') ?? '';
    const vBaths = sp.get('baths') ?? '';
    const vType  = sp.get('type') ?? '';
    const vSort  = sp.get('sort') ?? '';

    if (vCity !== city) setCity(vCity);
    if (vMin !== min) setMin(vMin);
    if (vMax !== max) setMax(vMax);
    if (vBeds !== beds) setBeds(vBeds);
    if (vBaths !== baths) setBaths(vBaths);
    if (vType !== type) setType(vType);
    if (vSort !== sort) setSort(vSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const applyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams(Array.from(sp.entries()));

      const setOrDelete = (key: string, value: string) => {
        if (value) params.set(key, value);
        else params.delete(key);
      };

      setOrDelete('city', city.trim());
      setOrDelete('min', min.trim());
      setOrDelete('max', max.trim());
      setOrDelete('beds', beds.trim());
      setOrDelete('baths', baths.trim());
      setOrDelete('type', type.trim());
      setOrDelete('sort', sort.trim());

      // reset to first page when filters change
      params.delete('page');

      const qs = sortedQS(params);
      router.push(qs ? `/listings?${qs}` : '/listings');
    });
  };

  const clearAll = () => {
    startTransition(() => {
      const params = new URLSearchParams(Array.from(sp.entries()));
      ['city', 'min', 'max', 'beds', 'baths', 'type', 'sort', 'page'].forEach(k => params.delete(k));
      setCity('');
      setMin('');
      setMax('');
      setBeds('');
      setBaths('');
      setType('');
      setSort('');
      const qs = sortedQS(params);
      router.push(qs ? `/listings?${qs}` : '/listings');
    });
  };

  return (
    <section className="rounded-xl bg-white shadow p-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="City"
          className="border rounded px-3 py-2 text-sm w-full"
        />
        <input
          value={min}
          onChange={e => setMin(e.target.value)}
          placeholder="Min price"
          className="border rounded px-3 py-2 text-sm w-full"
        />
        <input
          value={max}
          onChange={e => setMax(e.target.value)}
          placeholder="Max price"
          className="border rounded px-3 py-2 text-sm w-full"
        />
        <input
          value={beds}
          onChange={e => setBeds(e.target.value)}
          placeholder="Beds"
          className="border rounded px-3 py-2 text-sm w-full"
        />
        <input
          value={baths}
          onChange={e => setBaths(e.target.value)}
          placeholder="Baths"
          className="border rounded px-3 py-2 text-sm w-full"
        />
        <input
          value={type}
          onChange={e => setType(e.target.value)}
          placeholder="Property type"
          className="border rounded px-3 py-2 text-sm w-full"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full"
        >
          <option value="">Sort: newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          className="text-sm px-3 py-1 rounded border"
          onClick={clearAll}
          disabled={isPending}
        >
          Clear
        </button>
        <button
          type="button"
          className="text-sm px-4 py-1 rounded bg-birchwood-green text-white disabled:opacity-60"
          onClick={applyFilters}
          disabled={isPending}
        >
          {isPending ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </section>
  );
}
