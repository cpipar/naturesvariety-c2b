import type { EventRow } from './sheet';
import {
  BUTTON_VIEW,
  INTERNAL_ACTIONS,
  LANDING_VIEW,
  REDIRECTION,
  RETAILER_DISPLAY,
  STORE_SELECTION,
  WIDGET_OPEN,
  categoryName,
  matches,
  productName,
  serviceOf,
} from './mapping';

/* ─────────────────────────── Types ─────────────────────────── */

export type Bucket = { label: string; value: number };

export type MetricKey = 'landing' | 'button' | 'click' | 'redirect' | 'store' | 'revenue';
export type ServiceKey = 'all' | 'delivery' | 'collect';
export type UtmDim = 'source' | 'medium' | 'campaign' | 'content' | 'term';

export type DailyPoint = { date: string } & Record<Exclude<MetricKey, never>, number>;

export type AdRow = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  button: number;
  click: number;
  redirect: number;
  revenue: number;
};

export type EfficiencyRow = { label: string; displayed: number; selected: number };

export type Payload = {
  dateFrom: string;
  dateTo: string;
  days: number;
  rowCount: number;
  totals: Record<MetricKey, number>;
  daily: DailyPoint[];
  redirectByRetailer: Record<ServiceKey, Bucket[]>;
  storeByRetailer: Bucket[];
  storeByCity: Bucket[];
  revenueByRetailer: Bucket[];
  categories: Bucket[];
  products: Record<'click' | 'redirect' | 'revenue', Bucket[]>;
  internal: Bucket[];
  efficiency: EfficiencyRow[];
  utm: Record<MetricKey, Record<UtmDim, Bucket[]>>;
  ads: AdRow[];
};

/* ─────────────────────────── Helpers ─────────────────────────── */

const METRIC_SELECTOR = {
  landing: LANDING_VIEW,
  button: BUTTON_VIEW,
  click: WIDGET_OPEN,
  redirect: REDIRECTION,
  store: STORE_SELECTION,
  revenue: REDIRECTION, // le CA engagé, c'est `amount` sur les redirections
} as const;

const isMetric = (row: EventRow, key: MetricKey) => matches(row, METRIC_SELECTOR[key]);

/** `revenue` additionne les montants, tout le reste additionne les counts. */
const valueOf = (row: EventRow, key: MetricKey) =>
  key === 'revenue' ? row.amount : row.count;

function group(
  rows: EventRow[],
  labelOf: (r: EventRow) => string,
  valueOfRow: (r: EventRow) => number,
): Bucket[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const label = labelOf(r);
    if (!label) continue;
    const v = valueOfRow(r);
    if (!Number.isFinite(v) || v === 0) continue;
    map.set(label, (map.get(label) ?? 0) + v);
  }
  const out = [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((b) => b.value > 0)
    .sort((a, b) => b.value - a.value);

  /* A single "(not set)" bucket means the column is simply not filled in —
     a pie chart with one 100 % slice tells the client nothing. */
  if (out.length === 1 && out[0].label === '(not set)') return [];
  return out;
}

const byCount = (r: EventRow) => r.count;
const byAmount = (r: EventRow) => r.amount;

/* ─────────────────────────── Périodes ─────────────────────────── */

export type Period = '7' | '30' | '90' | 'all';

export const PERIODS: { value: Period; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'Whole campaign' },
];

export const isPeriod = (v: unknown): v is Period =>
  v === '7' || v === '30' || v === '90' || v === 'all';

/**
 * Filtre sur les N derniers jours **de données présentes dans le Sheet**, pas
 * par rapport à aujourd'hui : un export en retard reste lisible.
 */
export function filterRows(
  rows: EventRow[],
  opts: { period?: Period; from?: string; to?: string },
): EventRow[] {
  if (rows.length === 0) return rows;

  if (opts.from && opts.to) {
    const [a, b] = opts.from <= opts.to ? [opts.from, opts.to] : [opts.to, opts.from];
    return rows.filter((r) => r.date >= a && r.date <= b);
  }

  const period = opts.period ?? 'all';
  if (period === 'all') return rows;

  const last = rows.reduce((m, r) => (r.date > m ? r.date : m), rows[0].date);
  const start = new Date(`${last}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (Number(period) - 1));
  const from = start.toISOString().slice(0, 10);
  return rows.filter((r) => r.date >= from && r.date <= last);
}

/* ─────────────────────────── Le calcul ─────────────────────────── */

export function buildPayload(rows: EventRow[]): Payload {
  const dates = rows.map((r) => r.date).sort();
  const dateFrom = dates[0] ?? '';
  const dateTo = dates[dates.length - 1] ?? '';

  const METRICS: MetricKey[] = ['landing', 'button', 'click', 'redirect', 'store', 'revenue'];

  /* Totaux */
  const totals = {} as Record<MetricKey, number>;
  for (const k of METRICS) {
    totals[k] = rows.reduce((t, r) => (isMetric(r, k) ? t + valueOf(r, k) : t), 0);
  }

  /* Série quotidienne, trous comblés pour que la courbe ne mente pas */
  const dayMap = new Map<string, DailyPoint>();
  for (const r of rows) {
    const p =
      dayMap.get(r.date) ??
      ({ date: r.date, landing: 0, button: 0, click: 0, redirect: 0, store: 0, revenue: 0 } as DailyPoint);
    for (const k of METRICS) if (isMetric(r, k)) p[k] += valueOf(r, k);
    dayMap.set(r.date, p);
  }
  const daily = fillGaps([...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date)));

  /* Sous-ensembles réutilisés */
  const redirectRows = rows.filter((r) => isMetric(r, 'redirect'));
  const storeRows = rows.filter((r) => isMetric(r, 'store'));
  const clickRows = rows.filter((r) => isMetric(r, 'click'));
  const buttonRows = rows.filter((r) => isMetric(r, 'button'));
  const categoryRows = rows.filter(
    (r) => matches(r, LANDING_VIEW) && r.medium === 'landing_category',
  );

  /* Redirections par enseigne, en trois variantes de service */
  const redirectByRetailer: Record<ServiceKey, Bucket[]> = {
    all: group(redirectRows, (r) => r.retailerName, byCount),
    delivery: group(
      redirectRows.filter((r) => serviceOf(r.retailOutletService) === 'delivery'),
      (r) => r.retailerName,
      byCount,
    ),
    collect: group(
      redirectRows.filter((r) => serviceOf(r.retailOutletService) === 'collect'),
      (r) => r.retailerName,
      byCount,
    ),
  };

  /* Actions internes : la clé peut venir de `action` ou de `tab` */
  const internal = group(
    rows,
    (r) => INTERNAL_ACTIONS[r.action] ?? INTERNAL_ACTIONS[r.tab] ?? '',
    byCount,
  );

  /* Efficacité enseigne : choisie une fois montrée */
  const displayed = group(
    rows.filter((r) => matches(r, RETAILER_DISPLAY)),
    (r) => r.retailerName,
    byCount,
  );
  const selected = new Map(
    redirectByRetailer.all.map((b) => [b.label, b.value] as const),
  );
  const efficiency: EfficiencyRow[] = displayed.map((d) => ({
    label: d.label,
    displayed: d.value,
    selected: selected.get(d.label) ?? 0,
  }));

  /* UTM : une répartition par métrique et par dimension */
  const UTM_DIMS: Record<UtmDim, (r: EventRow) => string> = {
    source: (r) => r.utmSource || '(not set)',
    medium: (r) => r.utmMedium || '(not set)',
    campaign: (r) => r.utmCampaign || '(not set)',
    content: (r) => r.utmContent || '(not set)',
    term: (r) => r.utmTerm || '(not set)',
  };

  const utm = {} as Record<MetricKey, Record<UtmDim, Bucket[]>>;
  for (const k of METRICS) {
    const subset = rows.filter((r) => isMetric(r, k));
    const valueFn = k === 'revenue' ? byAmount : byCount;
    utm[k] = {
      source: group(subset, UTM_DIMS.source, valueFn),
      medium: group(subset, UTM_DIMS.medium, valueFn),
      campaign: group(subset, UTM_DIMS.campaign, valueFn),
      content: group(subset, UTM_DIMS.content, valueFn),
      term: group(subset, UTM_DIMS.term, valueFn),
    };
  }

  /* Meilleures combinaisons d'annonces */
  const adMap = new Map<string, AdRow>();
  const tupleKey = (r: EventRow) =>
    [r.utmSource, r.utmMedium, r.utmCampaign, r.utmContent, r.utmTerm]
      .map((v) => v || '(not set)')
      .join(' | ');

  const bumpAd = (r: EventRow, field: 'button' | 'click' | 'redirect' | 'revenue') => {
    const key = tupleKey(r);
    if (key === '(not set) | (not set) | (not set) | (not set) | (not set)') return;
    const parts = key.split(' | ');
    const row =
      adMap.get(key) ??
      {
        source: parts[0], medium: parts[1], campaign: parts[2],
        content: parts[3], term: parts[4],
        button: 0, click: 0, redirect: 0, revenue: 0,
      };
    row[field] += field === 'revenue' ? r.amount : r.count;
    adMap.set(key, row);
  };

  buttonRows.forEach((r) => bumpAd(r, 'button'));
  clickRows.forEach((r) => bumpAd(r, 'click'));
  redirectRows.forEach((r) => bumpAd(r, 'redirect'));
  redirectRows.forEach((r) => bumpAd(r, 'revenue'));

  const ads = [...adMap.values()]
    .filter((a) => a.click > 0 || a.redirect > 0 || a.button > 0)
    .sort((a, b) => {
      const ea = a.click > 0 ? a.redirect / a.click : 0;
      const eb = b.click > 0 ? b.redirect / b.click : 0;
      return eb - ea;
    })
    .slice(0, 25);

  return {
    dateFrom,
    dateTo,
    days: daily.length,
    rowCount: rows.length,
    totals,
    daily,
    redirectByRetailer,
    storeByRetailer: group(storeRows, (r) => r.retailerName, byCount),
    storeByCity: group(storeRows, (r) => r.retailOutletCity, byCount),
    revenueByRetailer: group(redirectRows, (r) => r.retailerName, byAmount),
    categories: group(categoryRows, (r) => categoryName(r.landingcategory, r.mediumId), byCount),
    products: {
      click: group(clickRows, (r) => productName(r.productId), byCount),
      redirect: group(redirectRows, (r) => productName(r.productId), byCount),
      revenue: group(redirectRows, (r) => productName(r.productId), byAmount),
    },
    internal,
    efficiency: efficiency.sort(
      (a, b) =>
        (b.displayed > 0 ? b.selected / b.displayed : 0) -
        (a.displayed > 0 ? a.selected / a.displayed : 0),
    ),
    utm,
    ads,
  };
}

function fillGaps(points: DailyPoint[]): DailyPoint[] {
  if (points.length < 2) return points;
  const out: DailyPoint[] = [];
  const cursor = new Date(`${points[0].date}T00:00:00Z`);
  const end = new Date(`${points[points.length - 1].date}T00:00:00Z`);
  const known = new Map(points.map((p) => [p.date, p]));

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    out.push(
      known.get(key) ??
        ({ date: key, landing: 0, button: 0, click: 0, redirect: 0, store: 0, revenue: 0 } as DailyPoint),
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (out.length > 1000) break;
  }
  return out;
}
