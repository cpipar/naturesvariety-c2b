'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PERIODS, type Period } from '@/lib/aggregate';
import { dayLabel, fmt } from '@/lib/format';

/**
 * The only page-level filter. Changing it changes the URL, so the server
 * re-aggregates over the right window and the whole page stays consistent.
 */
export default function PeriodFilter({
  period,
  from,
  to,
  bounds,
  days,
  rowCount,
}: {
  period: Period | 'custom';
  from: string;
  to: string;
  bounds: { min: string; max: string };
  days: number;
  rowCount: number;
}) {
  const router = useRouter();
  const [a, setA] = useState(from);
  const [b, setB] = useState(to);

  const goPeriod = (p: Period) => router.push(`/?p=${p}`);
  const goRange = (nextA: string, nextB: string) => {
    if (!nextA || !nextB) return;
    router.push(`/?from=${nextA}&to=${nextB}`);
  };

  return (
    <section className="filters" aria-label="Period">
      <span className="eyebrow">Period</span>

      <div className="seg seg--lg" role="group" aria-label="Quick periods">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={p.value === period}
            onClick={() => goPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="daterange">
        <label htmlFor="from">From</label>
        <input
          className="dateinput"
          type="date"
          id="from"
          value={a}
          min={bounds.min}
          max={bounds.max}
          onChange={(e) => {
            setA(e.target.value);
            goRange(e.target.value, b);
          }}
        />
        <label htmlFor="to">to</label>
        <input
          className="dateinput"
          type="date"
          id="to"
          value={b}
          min={bounds.min}
          max={bounds.max}
          onChange={(e) => {
            setB(e.target.value);
            goRange(a, e.target.value);
          }}
        />
      </div>

      <div className="filters__end">
        <span className="freshness">
          {dayLabel(from)} &ndash; {dayLabel(to)} &middot; {days} days
          <br />
          {fmt(rowCount)} event rows
        </span>
      </div>
    </section>
  );
}
