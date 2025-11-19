'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
  page: number;
  totalPages: number;
};

export default function Pagination({ page, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = searchParams ?? new URLSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set('page', String(p));
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        type="button"
        className="px-3 py-1 rounded border text-sm disabled:opacity-40"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="px-3 py-1 rounded border text-sm disabled:opacity-40"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}
