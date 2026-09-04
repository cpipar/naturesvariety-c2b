const nf = new Intl.NumberFormat('en-US');
const cf = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const kf = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const fmt = (n: number) => nf.format(Math.round(n));
export const eur = (n: number) => cf.format(Math.round(n));
export const axisNum = (n: number) => (Math.abs(n) >= 10000 ? kf.format(n) : nf.format(Math.round(n)));
export const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
export const pctText = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(1)) + '%';

/** Compact enough never to touch the donut ring. */
export const centerText = (v: number, money: boolean) =>
  money
    ? Math.abs(v) >= 10000
      ? '€' + kf.format(v)
      : eur(v)
    : Math.abs(v) >= 100000
      ? kf.format(v)
      : fmt(v);

export const centerSize = (s: string) => (s.length <= 6 ? 21 : s.length <= 8 ? 18 : 16);

export const dayLabel = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

export const dayLong = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

/** Fixed hue order, validated for colour-vision deficiency in both themes. */
export const PIE = [
  'var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)',
  'var(--p5)', 'var(--p6)', 'var(--p7)',
];

export const RAMP = ['var(--r5)', 'var(--r4)', 'var(--r3)', 'var(--r2)', 'var(--r1)'];

export type Bucket = { label: string; value: number };

/** Top N plus an "Others" bucket, so a chart never grows a ninth hue. */
export function fold(items: Bucket[], limit: number): Bucket[] {
  const rows = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  if (rows.length <= limit + 1) return rows;
  const rest = rows.slice(limit);
  return rows.slice(0, limit).concat([
    { label: `Others (${rest.length})`, value: rest.reduce((t, r) => t + r.value, 0) },
  ]);
}
