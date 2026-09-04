'use client';

import { useState } from 'react';
import {
  Bucket,
  PIE,
  centerSize,
  centerText,
  eur,
  fmt,
  fold,
  pct,
  pctText,
} from '@/lib/format';

const BOX = 196;
const C = BOX / 2;
const R_OUT = 80;
const R_IN = 48;

const point = (rad: number, ang: number) =>
  `${(C + rad * Math.cos(ang)).toFixed(2)},${(C + rad * Math.sin(ang)).toFixed(2)}`;

/**
 * Donut with a legend that always spells out name, value and share — identity
 * is never carried by colour alone, and the centre reads the hovered slice.
 */
export default function Donut({
  items,
  label,
  money = false,
  limit = 6,
  empty = 'Nothing recorded over this period.',
}: {
  items: Bucket[];
  label: string;
  money?: boolean;
  limit?: number;
  empty?: string;
}) {
  const [hot, setHot] = useState<number | null>(null);

  const rows = fold(items, limit).map((r) => ({ ...r, value: Math.round(r.value) }));
  if (rows.length === 0) return <p className="empty">{empty}</p>;

  const sum = rows.reduce((t, r) => t + r.value, 0);
  if (sum <= 0) return <p className="empty">{empty}</p>;

  const show = (v: number) => (money ? eur(v) : fmt(v));

  const slices: { d: string; color: string }[] = [];
  let ang = -Math.PI / 2;
  rows.forEach((r, i) => {
    const a0 = ang;
    const a1 = ang + (r.value / sum) * Math.PI * 2;
    ang = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    slices.push({
      color: PIE[i % PIE.length],
      d:
        `M ${point(R_OUT, a0)} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${point(R_OUT, a1)} ` +
        `L ${point(R_IN, a1)} A ${R_IN} ${R_IN} 0 ${large} 0 ${point(R_IN, a0)} Z`,
    });
  });

  const centreValue = hot === null ? sum : rows[hot].value;
  const centreStr = centerText(centreValue, money);
  const centreLabel = hot === null ? label : pctText(pct(rows[hot].value, sum));

  return (
    <div className="donut" onMouseLeave={() => setHot(null)}>
      <svg
        className="donut__svg"
        width={BOX}
        height={BOX}
        viewBox={`0 0 ${BOX} ${BOX}`}
        role="img"
        aria-label={`${label} breakdown`}
      >
        {rows.length === 1 ? (
          <circle
            cx={C}
            cy={C}
            r={(R_OUT + R_IN) / 2}
            fill="none"
            stroke={PIE[0]}
            strokeWidth={R_OUT - R_IN}
          />
        ) : (
          slices.map((s, i) => (
            <path
              key={i}
              className={`donut__slice${hot === i ? ' hot' : ''}`}
              d={s.d}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={2}
              strokeLinejoin="round"
              onMouseEnter={() => setHot(i)}
            />
          ))
        )}
        <text
          x={C}
          y={C - 2}
          textAnchor="middle"
          fontSize={centerSize(centreStr)}
          fontWeight={700}
          fill="var(--ink)"
          fontFamily="Baloo 2, sans-serif"
        >
          {centreStr}
        </text>
        <text x={C} y={C + 16} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)">
          {centreLabel}
        </text>
      </svg>

      <ul className="dlegend">
        {rows.map((r, i) => (
          <li
            key={r.label}
            className={hot === i ? 'hot' : undefined}
            onMouseEnter={() => setHot(i)}
          >
            <span className="dlegend__sw" style={{ background: PIE[i % PIE.length] }} />
            <span className="dlegend__name" title={r.label}>
              {r.label}
            </span>
            <span className="dlegend__val">{show(r.value)}</span>
            <span className="dlegend__pct">{pctText(pct(r.value, sum))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
