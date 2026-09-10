import Dashboard from '@/components/Dashboard';
import { buildPayload, filterRows, isPeriod, type Period } from '@/lib/aggregate';
import { DATA_START_DATE } from '@/lib/mapping';
import { fetchEvents } from '@/lib/sheet';

export const revalidate = 900;

/** Hier en UTC — la dernière journée dont les stats sont considérées complètes. */
function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;

  const clientName = process.env.CLIENT_NAME?.trim() || 'Nature’s Variety';
  const campaignName = process.env.CAMPAIGN_NAME?.trim() || '';
  const logo = process.env.CLIENT_LOGO?.trim() || '';

  const result = await fetchEvents();

  if (!result.ok) {
    return (
      <>
        <header className="topbar">
          <div className="brandlock">
            <span className="wordmark">{clientName}</span>
            <span className="topbar__what">Click2Buy - Partner Dashboard</span>
          </div>
        </header>
        <div className="errorwrap">
          <div className="note">
            <b>The data is not available.</b>
            <p>{result.error}</p>
            <p style={{ color: 'var(--ink-3)' }}>{result.hint}</p>
          </div>
        </div>
      </>
    );
  }

  const all = result.rows.filter((r) => r.date >= DATA_START_DATE);
  const dates = all.map((r) => r.date).sort();
  const bounds = { min: dates[0] ?? '', max: dates[dates.length - 1] ?? '' };

  const hasRange = typeof sp.from === 'string' && typeof sp.to === 'string';
  const hasPeriod = isPeriod(sp.p);
  const period: Period = hasPeriod ? (sp.p as Period) : 'all';

  /* Sans période ni plage choisie explicitement, le dashboard s'ouvre toujours
     sur le premier jour de la campagne jusqu'à hier — jamais "aujourd'hui",
     dont les stats de la journée ne sont pas encore complètes. */
  const rows = hasRange
    ? filterRows(all, { from: sp.from, to: sp.to })
    : hasPeriod
      ? filterRows(all, { period })
      : filterRows(all, { from: DATA_START_DATE, to: yesterday() });
  const data = buildPayload(rows.length > 0 ? rows : all);

  return (
    <Dashboard
      data={data}
      period={hasRange || !hasPeriod ? 'custom' : period}
      clientName={clientName}
      campaignName={campaignName}
      logo={logo}
      bounds={bounds}
    />
  );
}
