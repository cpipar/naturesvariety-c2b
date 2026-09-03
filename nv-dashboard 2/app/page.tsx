import { cookies } from 'next/headers';
import Dashboard from '@/components/Dashboard';
import { buildPayload, filterRows, isPeriod, type Period } from '@/lib/aggregate';
import { ADMIN_COOKIE, accessToken, adminPassword, passwordRequired } from '@/lib/auth';
import { readSettings } from '@/lib/settings';
import { fetchEvents } from '@/lib/sheet';

export const revalidate = 900;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;

  const clientName = process.env.CLIENT_NAME?.trim() || 'Nature’s Variety';
  const campaignName = process.env.CAMPAIGN_NAME?.trim() || '';
  const headerTitle = process.env.HEADER_TITLE?.trim() || 'Click2Buy — Partner Dashboard';
  const logo = process.env.CLIENT_LOGO?.trim() || '';

  /* Admin : le bouton n'apparaît que si un mot de passe admin est configuré. */
  const adminPwd = adminPassword();
  const jar = await cookies();
  const isAdmin =
    adminPwd !== null && jar.get(ADMIN_COOKIE)?.value === (await accessToken(adminPwd, 'admin'));

  const settings = await readSettings();
  const result = await fetchEvents();

  if (!result.ok) {
    return (
      <>
        <header className="topbar">
          <div className="brandlock">
            <span className="wordmark">{clientName}</span>
            <span className="topbar__what">{headerTitle}</span>
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

  const all = result.rows;
  const dates = all.map((r) => r.date).sort();
  const bounds = { min: dates[0] ?? '', max: dates[dates.length - 1] ?? '' };

  const hasRange = typeof sp.from === 'string' && typeof sp.to === 'string';
  const period: Period = isPeriod(sp.p) ? sp.p : 'all';

  const rows = filterRows(all, hasRange ? { from: sp.from, to: sp.to } : { period });
  const data = buildPayload(rows.length > 0 ? rows : all);

  return (
    <Dashboard
      data={data}
      period={hasRange ? 'custom' : period}
      clientName={clientName}
      campaignName={campaignName}
      headerTitle={headerTitle}
      logo={logo}
      bounds={bounds}
      settings={settings}
      isAdmin={isAdmin}
      adminEnabled={adminPwd !== null}
      isProtected={passwordRequired() !== null}
    />
  );
}
