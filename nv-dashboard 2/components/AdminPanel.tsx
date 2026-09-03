'use client';

import { useMemo, useState } from 'react';
import type { Bucket } from '@/lib/format';
import { eur, fmt, pctText } from '@/lib/format';
import { estimate, type Settings } from '@/lib/settings';

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string }
  | { kind: 'no-store'; json: string };

/**
 * Écran Admin : les taux d'extrapolation. Les valeurs saisies ici s'appliquent
 * au dashboard que voit le client, une fois enregistrées.
 */
export default function AdminPanel({
  open,
  onClose,
  isAdmin,
  settings,
  redirections,
  onSaved,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  settings: Settings;
  redirections: Bucket[];
  onSaved: (s: Settings) => void;
  onAuthenticated: () => void;
}) {
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [draft, setDraft] = useState<Settings>(settings);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });

  const preview = useMemo(() => estimate(draft, redirections), [draft, redirections]);
  const totalRedirections = redirections.reduce((t, r) => t + r.value, 0);

  if (!open) return null;

  const unlock = async () => {
    setAuthError(false);
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword('');
      onAuthenticated();
    } else {
      setAuthError(true);
    }
  };

  const submit = async () => {
    setSave({ kind: 'saving' });
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      json?: string;
    };

    if (data.ok) {
      onSaved(draft);
      setSave({ kind: 'saved' });
      setTimeout(() => setSave({ kind: 'idle' }), 2500);
      return;
    }
    if (data.error === 'no_store' && data.json) {
      onSaved(draft);
      setSave({ kind: 'no-store', json: data.json });
      return;
    }
    setSave({
      kind: 'error',
      message:
        data.error === 'not_admin'
          ? 'Session admin expirée — ferme et rouvre l’écran Admin.'
          : 'L’enregistrement a échoué. Réessaie dans un instant.',
    });
  };

  const setOverride = (retailer: string, field: 'avgBasketEur' | 'conversionRatePct', raw: string) => {
    setDraft((prev) => {
      const overrides = { ...prev.retailerOverrides };
      const entry = { ...(overrides[retailer] ?? {}) };
      if (raw === '') delete entry[field];
      else entry[field] = Number(raw.replace(',', '.'));
      if (Object.keys(entry).length === 0) delete overrides[retailer];
      else overrides[retailer] = entry;
      return { ...prev, retailerOverrides: overrides };
    });
  };

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Admin">
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__head">
          <div>
            <h2 className="sheet__title">Admin &mdash; extrapolation rates</h2>
            <p className="card__sub">
              Turn redirections into estimated orders and revenue. What you save here
              applies to the dashboard the client sees.
            </p>
          </div>
          <button className="linkbtn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {!isAdmin ? (
          <div className="sheet__body">
            <p className="card__sub" style={{ marginBottom: 12 }}>
              Enter the admin password to change these rates.
            </p>
            {authError && <p className="login__error">That password is not right.</p>}
            <div className="fieldrow">
              <input
                className="dateinput"
                type="password"
                value={password}
                placeholder="Admin password"
                aria-label="Admin password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') unlock();
                }}
                style={{ flex: 1 }}
              />
              <button className="linkbtn" type="button" onClick={unlock}>
                Unlock
              </button>
            </div>
          </div>
        ) : (
          <div className="sheet__body">
            <div className="fieldgrid">
              <label className="field">
                <span className="field__label">Average basket</span>
                <span className="field__input">
                  <input
                    className="dateinput"
                    type="number"
                    min={0}
                    step={1}
                    value={draft.avgBasketEur}
                    onChange={(e) =>
                      setDraft({ ...draft, avgBasketEur: Number(e.target.value) })
                    }
                  />
                  <span className="field__unit">&euro;</span>
                </span>
                <span className="field__hint">Value of one order, all retailers.</span>
              </label>

              <label className="field">
                <span className="field__label">Conversion rate</span>
                <span className="field__input">
                  <input
                    className="dateinput"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={draft.conversionRatePct}
                    onChange={(e) =>
                      setDraft({ ...draft, conversionRatePct: Number(e.target.value) })
                    }
                  />
                  <span className="field__unit">%</span>
                </span>
                <span className="field__hint">
                  Share of redirections that end in an order.
                </span>
              </label>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={draft.showEstimates}
                onChange={(e) => setDraft({ ...draft, showEstimates: e.target.checked })}
              />
              <span>
                <b>Show estimates to the client</b>
                <span className="field__hint">
                  Off by default. While it is off, nobody sees an extrapolated figure —
                  only the events actually recorded.
                </span>
              </span>
            </label>

            {redirections.length > 0 && (
              <>
                <p className="eyebrow" style={{ marginTop: 22, marginBottom: 8 }}>
                  Per retailer &mdash; leave empty to use the values above
                </p>
                <div className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Retailer</th>
                        <th scope="col">Redirections</th>
                        <th scope="col">Basket &euro;</th>
                        <th scope="col">Conversion %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redirections.map((r) => (
                        <tr key={r.label}>
                          <td>{r.label}</td>
                          <td>{fmt(r.value)}</td>
                          <td>
                            <input
                              className="dateinput dateinput--tiny"
                              type="number"
                              min={0}
                              step={1}
                              placeholder={String(draft.avgBasketEur)}
                              value={draft.retailerOverrides[r.label]?.avgBasketEur ?? ''}
                              onChange={(e) =>
                                setOverride(r.label, 'avgBasketEur', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="dateinput dateinput--tiny"
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder={String(draft.conversionRatePct)}
                              value={
                                draft.retailerOverrides[r.label]?.conversionRatePct ?? ''
                              }
                              onChange={(e) =>
                                setOverride(r.label, 'conversionRatePct', e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="previewbox">
              <p className="eyebrow" style={{ marginBottom: 10 }}>
                What this gives over the selected period
              </p>
              <div className="previewbox__row">
                <span>Redirections recorded</span>
                <b>{fmt(totalRedirections)}</b>
              </div>
              <div className="previewbox__row">
                <span>Estimated orders</span>
                <b>{fmt(preview.orders)}</b>
              </div>
              <div className="previewbox__row">
                <span>Estimated revenue</span>
                <b>{eur(preview.revenue)}</b>
              </div>
              <div className="previewbox__row">
                <span>Implied revenue per redirection</span>
                <b>
                  {totalRedirections > 0
                    ? eur(preview.revenue / totalRedirections)
                    : eur(0)}
                </b>
              </div>
              {draft.conversionRatePct === 0 &&
                Object.keys(draft.retailerOverrides).length === 0 && (
                  <p className="field__hint" style={{ marginTop: 10 }}>
                    The conversion rate is at 0&nbsp;%, so no order is estimated. Set it
                    above 0 to see figures here.
                  </p>
                )}
            </div>

            {save.kind === 'no-store' && (
              <div className="note" style={{ marginTop: 18 }}>
                <b>Applied to your view, but not saved for everyone.</b>
                <p>
                  No storage is connected yet. To make these rates permanent, paste this
                  into the Vercel variable <code>SETTINGS_JSON</code>, then redeploy:
                </p>
                <pre className="jsonbox">{save.json}</pre>
                <p style={{ color: 'var(--ink-3)' }}>
                  Or connect a KV store in Vercel (Storage &rarr; Create) and Save will
                  write there directly.
                </p>
              </div>
            )}

            {save.kind === 'error' && (
              <p className="login__error" style={{ marginTop: 14 }}>
                {save.message}
              </p>
            )}

            <div className="sheet__foot">
              <button className="linkbtn" type="button" onClick={() => setDraft(settings)}>
                Reset
              </button>
              <button
                className="linkbtn linkbtn--primary"
                type="button"
                onClick={submit}
                disabled={save.kind === 'saving'}
              >
                {save.kind === 'saving'
                  ? 'Saving…'
                  : save.kind === 'saved'
                    ? 'Saved'
                    : 'Save for everyone'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
