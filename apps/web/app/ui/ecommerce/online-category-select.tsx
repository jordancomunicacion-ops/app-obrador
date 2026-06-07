'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setOnlineCategory } from '@/app/lib/actions/ecommerce';
import { SHOP_CATEGORIES } from '@/app/lib/ecommerce-constants';

export default function OnlineCategorySelect({
  productId,
  current,
}: {
  productId: string;
  current: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      disabled={pending}
      defaultValue={current ?? ''}
      onChange={(e) =>
        startTransition(async () => {
          const res = await setOnlineCategory(productId, e.target.value);
          if (res.ok) router.refresh();
          else alert(res.error ?? 'No se pudo cambiar la categoría.');
        })
      }
      className="px-2 py-1 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
    >
      <option value="">— Sin categoría —</option>
      {SHOP_CATEGORIES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
