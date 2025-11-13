// src/app/api/ddf/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { getDdfAccessToken } from "@/lib/ddfAuth";

const BASE = (process.env.DDF_BASE_URL ?? "https://ddfapi.realtor.ca/odata/v1").replace(/\/$/, "");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
  try {
    const token = await getDdfAccessToken();

    // Keep $select conservative; adjust after you inspect $metadata
    const select = [
      "ListingKey",
      "MlsNumber",
      "ListPrice",
      "PropertyType",
      "BedroomsTotal",
      "BathroomsTotalInteger", // if 400, change to BathroomsTotal
      "City",
      "StateOrProvince",
      "PostalCode",
      "StandardStatus",
      "ModificationTimestamp",
    ].join(",");

    const url = new URL(`${BASE}/Property`);
    url.searchParams.set("$top", "5");
    url.searchParams.set("$select", select);
    url.searchParams.set("$orderby", "ModificationTimestamp desc");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json({ ok: true, sample: json.value ?? json.records ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
