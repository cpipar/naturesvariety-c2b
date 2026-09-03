'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyPoint } from '@/lib/aggregate';
import { axisNum, dayLabel, dayLong, eur, fmt } from '@/lib/format';

type SeriesDef = {
  key: 'landing' | 'button' | 'click' | 'redirect' | 'store' | 'revenue';
  name: string;
  color: string;
  money?: boolean;
};

/** Fixed hue order — every step clears 3:1 on both surfaces. */
const SERIES: SeriesDef[] = [
  { key: 'landing', name: 'Landing page visits', color: 'var(--l1)' },
  { key: 'button', name: 'Button views', color: 'var(--l2)' },
  { key: 'click', name: 'Widget openings', color: 'var(--l3)' },
  { key: 'redirect', name: 'Online redirections', color: 'var(--l4)' },
  { key: 'store', name: 'Store selections', color: 'var(--l5)' },
];

const PAD = { top: 14, right: 20, bottom: 28, left: 58 };
const H = 268;

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) if (s * mag >= v) return s * mag;
  return 10 * mag;
}

/**
 * One chart, every signal on it, each one hideable. The y-axis re-fits to the
 * visible series — without that, six-figure button views flatten everything
 * else onto the axis.
 */
export default function LineChart({
  daily,
  totals,
}: {
  daily: DailyPoint[];
  totals: Record<string, number>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* A series with no data at all is dropped rather than shown as a flat zero. */
  const available = useMemo(
    () => SERIES.filter((s) => daily.some((d) => d[s.key] > 0)),
    [daily],
  );
  const visible = available.filter((s) => !hidden.has(s.key));

  if (daily.length === 0 || available.length === 0) {
    return <p className="empty">Nothing recorded over this period.</p>;
  }

  const n = daily.length;
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const max = niceMax(
    Math.max(1, ...daily.flatMap((d) => (visible.length ? visible : available).map((s) => d[s.key]))),
  );

  const x = (i: number) => PAD.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const ticks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f)))];
  const every = Math.max(1, Math.ceil(n / (width < 520 ? 4 : 8)));

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (available.filter((s) => !next.has(s.key)).length > 1) next.add(key);
      return next;
    });
  };

  const onMove = (ev: React.MouseEvent<HTMLDivElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const i = Math.round(((ev.clientX - rect.left - PAD.left) / plotW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, n === 1 ? 0 : i)));
  };

  const point = hover !== null ? daily[hover] : null;
  const cx = hover !== null ? x(hover) : 0;
  const flip = cx > width * 0.55;

  return (
    <>
      <div className="serieskeys">
        {available.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={!hidden.has(s.key)}
            onClick={() => toggle(s.key)}
          >
            <span className="skey" style={{ background: s.color }} />
            {s.name} <b>{s.money ? eur(totals[s.key]) : fmt(totals[s.key])}</b>
          </button>
        ))}
      </div>

      <div
        className="chart"
        ref={host}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label="Actions over time"
          style={{ display: 'block', overflow: 'visible' }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'}
                strokeWidth={1}
                fill="none"
              />
              <text
                x={PAD.left - 10}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={10.5}
                fill="var(--ink-3)"
              >
                {axisNum(t)}
              </text>
            </g>
          ))}

          {daily.map((d, i) =>
            i % every === 0 || i === n - 1 ? (
              <text
                key={d.date}
                x={x(i)}
                y={H - 9}
                textAnchor="middle"
                fontSize={10.5}
                fill="var(--ink-3)"
              >
                {dayLabel(d.date)}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <line
              x1={cx}
              x2={cx}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--axis)"
              strokeWidth={1}
              fill="none"
            />
          )}

          {visible.map((s) => {
            const d = daily
              .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[s.key]).toFixed(1)}`)
              .join(' ');
            const at = hover !== null ? hover : n - 1;
            return (
              <g key={s.key}>
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx={x(at)}
                  cy={y(daily[at][s.key])}
                  r={4}
                  fill={s.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>

        {point && (
          <div
            className="tooltip on"
            style={{
              left: flip ? 'auto' : cx + 14,
              right: flip ? width - cx + 14 : 'auto',
              top: PAD.top,
            }}
          >
            <div className="tooltip__date">{dayLong(point.date)}</div>
            {visible.map((s) => (
              <div className="tooltip__row" key={s.key}>
                <span className="skey" style={{ background: s.color }} />
                <span>{s.name}</span>
                <b>{fmt(point[s.key])}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
