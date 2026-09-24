import { Bucket, RAMP, eur, fmt, fold, pct, pctText } from '@/lib/format';

/**
 * Ranked horizontal bars, one hue getting darker with magnitude. The value is
 * always written out; the share of the list total is shown only when the
 * rows are actually parts of one whole (`showShare`) — for unrelated event
 * types, a "% of this list" figure doesn't mean anything.
 */
export default function BarList({
  items,
  limit = 8,
  money = false,
  showShare = false,
  empty = 'Nothing recorded over this period.',
}: {
  items: Bucket[];
  limit?: number;
  money?: boolean;
  showShare?: boolean;
  empty?: string;
}) {
  const rows = fold(items, limit).map((r) => ({ ...r, value: Math.round(r.value) }));
  if (rows.length === 0) return <p className="empty">{empty}</p>;

  const sum = rows.reduce((t, r) => t + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="bars">
      {rows.map((r, i) => (
        <div className="bar" key={r.label}>
          <div className="bar__head">
            <span className="bar__label" title={r.label}>
              {r.label}
            </span>
            <span className="bar__value">
              {money ? eur(r.value) : fmt(r.value)}
              {showShare && <i>{pctText(pct(r.value, sum))}</i>}
            </span>
          </div>
          <div className="bar__track">
            <span
              className="bar__fill"
              style={{
                width: `${Math.max(1.5, (r.value / max) * 100).toFixed(1)}%`,
                background: RAMP[Math.min(i, RAMP.length - 1)],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
