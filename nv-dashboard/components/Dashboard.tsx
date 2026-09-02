'use client';

import { useState } from 'react';
import type { MetricKey, Payload, Period, ServiceKey, UtmDim } from '@/lib/aggregate';
import { eur, fmt, pct, pctText } from '@/lib/format';
import BarList from './BarList';
import Donut from './Donut';
import LineChart from './LineChart';
import PeriodFilter from './PeriodFilter';

/* Short enough to sit inside the donut hole. */
const SHORT: Record<MetricKey, string> = {
  landing: 'Visits',
  button: 'Button views',
  click: 'Openings',
  redirect: 'Redirections',
  store: 'Selections',
  revenue: 'Revenue',
};

const UTM_LABEL: Record<MetricKey, string> = {
  landing: 'landing page visits',
  button: 'button views',
  click: 'widget openings',
  redirect: 'redirections',
  store: 'store selections',
  revenue: 'engaged revenue',
};

const UTM_CARDS: { dim: UtmDim; title: string }[] = [
  { dim: 'source', title: 'Top UTM sources' },
  { dim: 'medium', title: 'Top UTM mediums' },
  { dim: 'campaign', title: 'Top UTM campaigns' },
  { dim: 'content', title: 'Top UTM content' },
  { dim: 'term', title: 'Top UTM terms' },
];

export default function Dashboard({
  data,
  period,
  clientName,
  campaignName,
  logo,
  bounds,
}: {
  data: Payload;
  period: Period | 'custom';
  clientName: string;
  campaignName: string;
  logo: string;
  bounds: { min: string; max: string };
}) {
  const [service, setService] = useState<ServiceKey>('all');
  const [product, setProduct] = useState<'click' | 'redirect' | 'revenue'>('click');
  const [utm, setUtm] = useState<MetricKey>('click');

  const t = data.totals;
  const intent = t.redirect + t.store;

  const exportCsv = () => {
    const head =
      'date,landing_page_visits,button_views,widget_openings,online_redirections,' +
      'store_selections,engaged_revenue_eur';
    const body = data.daily
      .map((d) => [d.date, d.landing, d.button, d.click, d.redirect, d.store, d.revenue].join(','))
      .join('\n');
    const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `natures-variety-wtb-${data.dateFrom}-to-${data.dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const funnelSteps = [
    { name: 'Where-to-buy button views', value: t.button, of: null as string | null },
    { name: 'Widget openings', value: t.click, of: 'button views' },
    { name: 'Purchase intent', value: intent, of: 'widget openings' },
  ];

  const hasRetailers = data.redirectByRetailer.all.length > 0;
  const hasStores = data.storeByRetailer.length > 0;
  const hasRevenue = data.revenueByRetailer.length > 0;
  const hasCategories = data.categories.length > 0;
  const hasProducts = data.products[product].length > 0;
  const hasInternal = data.internal.length > 0;
  const hasEfficiency = data.efficiency.length > 0;
  const hasUtm = data.utm[utm].source.length > 0;
  const hasAds = data.ads.length > 0;

  return (
    <>
      <header className="topbar">
        <div className="brandlock">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={clientName} className="masthead__logo" />
          ) : (
            <span className="wordmark">{clientName}</span>
          )}
          <span className="topbar__what">
            Where to Buy &mdash; Partner Dashboard
            {campaignName ? <span>{campaignName}</span> : null}
          </span>
        </div>
      </header>

      <nav className="subnav" aria-label="Sections">
        <a href="#overview">Overview</a>
        <a href="#solution">Solution &amp; retailers</a>
        <a href="#products">Products &amp; categories</a>
        <a href="#campaigns">Marketing campaigns</a>
      </nav>

      <main className="shell">
        <PeriodFilter
          period={period}
          from={data.dateFrom}
          to={data.dateTo}
          bounds={bounds}
          days={data.days}
          rowCount={data.rowCount}
          onExport={exportCsv}
        />

        {/* ═══ OVERVIEW ═══ */}
        <section className="sec" id="overview">
          <div className="kpis">
            <div className="kpi">
              <span className="kpi__step">Reach</span>
              <span className="kpi__name">Landing page visits</span>
              <span className="kpi__value">{fmt(t.landing)}</span>
              <span className="kpi__note">Visits to the campaign page</span>
            </div>
            <div className="kpi">
              <span className="kpi__step">Step 1</span>
              <span className="kpi__name">Where-to-buy button views</span>
              <span className="kpi__value">{fmt(t.button)}</span>
              <span className="kpi__note">Counted once per visit, not once per scroll</span>
            </div>
            <div className="kpi">
              <span className="kpi__step">Step 2</span>
              <span className="kpi__name">Widget openings</span>
              <span className="kpi__value">{fmt(t.click)}</span>
              <span className="kpi__conv">
                {pctText(pct(t.click, t.button))} of button views
              </span>
            </div>
            <div className="kpi kpi--outcome">
              <span className="kpi__step">Step 3 &middot; online</span>
              <span className="kpi__name">Online redirections</span>
              <span className="kpi__value">{fmt(t.redirect)}</span>
              <span className="kpi__note">Delivery and click &amp; collect</span>
            </div>
            <div className="kpi kpi--outcome">
              <span className="kpi__step">Step 3 &middot; in store</span>
              <span className="kpi__name">Store selections</span>
              <span className="kpi__value">{fmt(t.store)}</span>
              <span className="kpi__note">Directions in Google Maps</span>
            </div>
            <div className="kpi kpi--rate">
              <span className="kpi__step">Outcome</span>
              <span className="kpi__name">Engagement rate</span>
              <span className="kpi__value">{pctText(pct(t.redirect, t.click))}</span>
              <span className="kpi__note">
                {fmt(t.redirect)} redirections / {fmt(t.click)} openings
              </span>
            </div>
            <div className="kpi kpi--money">
              <span className="kpi__step">Value</span>
              <span className="kpi__name">Engaged revenue</span>
              <span className="kpi__value">{eur(t.revenue)}</span>
              <span className="kpi__note">Basket value sent to retailers</span>
            </div>
          </div>
        </section>

        {/* ═══ SOLUTION & RETAILERS ═══ */}
        <section className="sec" id="solution">
          <div className="sec__head">
            <h2 className="sec__title">Solution &amp; retailers</h2>
            <p className="sec__lead">
              Widget performance, category engagement and retailer breakdowns.
            </p>
          </div>

          <div className="card card--wide">
            <div className="card__head">
              <div>
                <h3 className="card__title">Actions over time</h3>
                <p className="card__sub">
                  Every signal on one chart. Click a name to show or hide it &mdash; the
                  scale re-fits to what is showing, so the small numbers stay readable
                  once the big ones step aside.
                </p>
              </div>
            </div>
            <LineChart daily={data.daily} totals={t} />
          </div>

          <div className="grid2">
            <div className="card">
              <div className="card__head">
                <div>
                  <h3 className="card__title">Conversion funnel</h3>
                  <p className="card__sub">
                    Each bar is the share of the step above it, so a 3&nbsp;% step stays
                    readable next to a six-figure base.
                  </p>
                </div>
              </div>

              {funnelSteps.map((s, i) => {
                const base = i === 0 ? s.value : funnelSteps[i - 1].value;
                const sh = i === 0 ? 100 : pct(s.value, base);
                return (
                  <div className="fstep" key={s.name}>
                    <div className="fstep__head">
                      <span className="fstep__name">{s.name}</span>
                      <span className="fstep__val">{fmt(s.value)}</span>
                    </div>
                    <div className="fstep__track">
                      <div
                        className="fstep__bar"
                        style={{
                          width: `${Math.max(1.2, sh).toFixed(1)}%`,
                          background: 'var(--l1)',
                        }}
                      />
                    </div>
                    <p className="fstep__of">
                      {s.of ? (
                        <>
                          <b>{pctText(sh)}</b> of {s.of} carried on
                        </>
                      ) : (
                        'Everyone who saw a buy button'
                      )}
                    </p>
                  </div>
                );
              })}

              <div className="split">
                {[
                  { name: 'Online — retailer website', value: t.redirect, color: 'var(--l1)' },
                  { name: 'In store — Google Maps', value: t.store, color: 'var(--l2)' },
                ].map((c) => (
                  <div className="split__cell" key={c.name}>
                    <span className="split__name">{c.name}</span>
                    <span className="split__val">
                      {fmt(c.value)} <i>{pctText(pct(c.value, intent))} of purchase intent</i>
                    </span>
                    <span className="split__meter">
                      <span
                        className="split__fill"
                        style={{
                          width: `${pct(c.value, intent).toFixed(1)}%`,
                          background: c.color,
                        }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {hasRetailers && (
              <div className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">Online redirections by retailer</h3>
                    <p className="card__sub">Where the click-throughs went.</p>
                  </div>
                  <div className="seg" role="group" aria-label="Retailer service">
                    {(
                      [
                        ['all', 'All'],
                        ['delivery', 'Delivery'],
                        ['collect', 'Click & collect'],
                      ] as [ServiceKey, string][]
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={service === v}
                        onClick={() => setService(v)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Donut
                  items={data.redirectByRetailer[service]}
                  label={SHORT.redirect}
                  empty="No redirection recorded for this service over the period."
                />
              </div>
            )}

            {hasStores && (
              <div className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">Store selections by retailer</h3>
                    <p className="card__sub">Shops shoppers asked directions to.</p>
                  </div>
                </div>
                <Donut items={data.storeByRetailer} label={SHORT.store} />
              </div>
            )}

            {hasRevenue && (
              <div className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">Engaged revenue by retailer</h3>
                    <p className="card__sub">Basket value carried into each retailer.</p>
                  </div>
                </div>
                <Donut items={data.revenueByRetailer} label={SHORT.revenue} money />
              </div>
            )}

            {hasCategories && (
              <div className="card card--wide">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">Category openings on the landing page</h3>
                    <p className="card__sub">Which range shoppers opened from the landing page.</p>
                  </div>
                </div>
                <Donut items={data.categories} label="Openings" limit={7} />
              </div>
            )}
          </div>
        </section>

        {/* ═══ PRODUCTS & CATEGORIES ═══ */}
        <section className="sec" id="products">
          <div className="sec__head">
            <h2 className="sec__title">Products &amp; categories</h2>
            <p className="sec__lead">
              Top products by widget openings, redirections and engaged revenue.
            </p>
          </div>

          <div className="card card--wide">
            <div className="card__head">
              <div>
                <h3 className="card__title">Top products</h3>
                <p className="card__sub">
                  Ranked on the metric you pick. Smaller lines are grouped into Others.
                </p>
              </div>
              <div className="seg" role="group" aria-label="Product metric">
                {(
                  [
                    ['click', 'Widget openings'],
                    ['redirect', 'Redirections'],
                    ['revenue', 'Engaged revenue'],
                  ] as ['click' | 'redirect' | 'revenue', string][]
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={product === v}
                    onClick={() => setProduct(v)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Donut
              items={data.products[product]}
              label={SHORT[product]}
              money={product === 'revenue'}
              empty={
                hasProducts
                  ? 'Nothing recorded over this period.'
                  : 'The export carries no product identifier on these events yet.'
              }
            />
          </div>

          <div className="grid2">
            {hasInternal && (
              <div className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">Widget internal actions</h3>
                    <p className="card__sub">
                      What shoppers did inside the widget, outside the main funnel: which
                      buying option they switched to, and the two extra clicks available
                      to them.
                    </p>
                  </div>
                </div>
                <BarList items={data.internal} limit={6} />
              </div>
            )}

            {hasEfficiency && (
              <div className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">Retailer efficiency</h3>
                    <p className="card__sub">
                      How often a retailer is picked once it has been shown. A retailer
                      that is everywhere but never chosen shows up here.
                    </p>
                  </div>
                </div>
                <div className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Retailer</th>
                        <th scope="col">Shown</th>
                        <th scope="col">Picked</th>
                        <th scope="col">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.efficiency.map((r) => {
                        const index = r.displayed > 0 ? r.selected / r.displayed : 0;
                        return (
                          <tr key={r.label}>
                            <td>{r.label}</td>
                            <td>{fmt(r.displayed)}</td>
                            <td>{fmt(r.selected)}</td>
                            <td
                              style={{
                                fontWeight: 700,
                                color: index >= 1 ? 'var(--good)' : 'var(--ink-3)',
                              }}
                            >
                              &times;{index.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ MARKETING CAMPAIGNS ═══ */}
        <section className="sec" id="campaigns">
          <div className="sec__head">
            <h2 className="sec__title">Marketing campaigns</h2>
            <p className="sec__lead">UTM breakdowns and best-performing ad combinations.</p>
          </div>

          <div className="filters">
            <span className="eyebrow">Rank the UTM charts by</span>
            <div className="seg" role="group" aria-label="UTM metric">
              {(
                [
                  ['click', 'Widget openings'],
                  ['button', 'Button views'],
                  ['redirect', 'Redirections'],
                  ['store', 'Store selections'],
                  ['revenue', 'Engaged revenue'],
                ] as [MetricKey, string][]
              ).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={utm === v} onClick={() => setUtm(v)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {hasUtm ? (
            <div className="grid2">
              {UTM_CARDS.map((c) => (
                <div className="card" key={c.dim}>
                  <div className="card__head">
                    <div>
                      <h3 className="card__title">{c.title}</h3>
                      <p className="card__sub">Share of {UTM_LABEL[utm]}.</p>
                    </div>
                  </div>
                  <Donut
                    items={data.utm[utm][c.dim]}
                    label={SHORT[utm]}
                    money={utm === 'revenue'}
                    limit={6}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <p className="empty">
                No UTM parameter recorded on these events over the period.
              </p>
            </div>
          )}

          {hasAds && (
            <div className="card card--wide">
              <div className="card__head">
                <div>
                  <h3 className="card__title">Best ad combinations</h3>
                  <p className="card__sub">
                    Full UTM tuple, ranked by engagement rate (redirections &divide; widget
                    openings).
                  </p>
                </div>
              </div>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">UTM tuple</th>
                      <th scope="col">Button views</th>
                      <th scope="col">Openings</th>
                      <th scope="col">Redirections</th>
                      <th scope="col">Engaged revenue</th>
                      <th scope="col">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ads.map((a, i) => {
                      const engagement = pct(a.redirect, a.click);
                      return (
                        <tr key={i}>
                          <td className="tuple">
                            <b>{a.source}</b> <em>|</em> {a.medium} <em>|</em> {a.campaign}{' '}
                            <em>|</em> {a.content} <em>|</em> {a.term}
                          </td>
                          <td>{fmt(a.button)}</td>
                          <td>{fmt(a.click)}</td>
                          <td>{fmt(a.redirect)}</td>
                          <td>{eur(a.revenue)}</td>
                          <td
                            style={{
                              fontWeight: 700,
                              color: engagement >= 15 ? 'var(--good)' : 'var(--ink)',
                            }}
                          >
                            {pctText(engagement)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="foot">
            <span>
              {clientName} &mdash; Where to Buy campaign dashboard &middot; built by Click2Buy
            </span>
            <span>Updated automatically from the campaign export</span>
          </p>
        </section>
      </main>
    </>
  );
}
