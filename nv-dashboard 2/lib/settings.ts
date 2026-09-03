/* ═══════════════════════════════════════════════════════════════════════════
   RÉGLAGES ADMIN — taux d'extrapolation

   Ces réglages sont modifiables depuis l'écran Admin du dashboard, et
   s'appliquent à ce que voit le client.

   Où ils sont stockés, par ordre de priorité :
     1. Vercel KV / Upstash Redis, si les variables KV_REST_API_URL et
        KV_REST_API_TOKEN existent → modifiables en un clic depuis l'admin.
     2. La variable d'environnement SETTINGS_JSON, sinon.
     3. Les valeurs par défaut ci-dessous.

   Sans KV, l'écran Admin fonctionne quand même : il affiche le JSON à coller
   dans SETTINGS_JSON, puis il faut redéployer.
   ═══════════════════════════════════════════════════════════════════════════ */

export type RetailerOverride = {
  avgBasketEur?: number;
  conversionRatePct?: number;
};

export type Settings = {
  /** Panier moyen d'une commande, en euros. */
  avgBasketEur: number;
  /** Part des redirections qui se transforment en commande, en %. */
  conversionRatePct: number;
  /** Réglages par enseigne, qui prennent le pas sur les valeurs globales. */
  retailerOverrides: Record<string, RetailerOverride>;
  /**
   * Tant que c'est false, le client ne voit aucun chiffre extrapolé : ni
   * commandes estimées, ni CA estimé. À n'activer qu'une fois les taux validés.
   */
  showEstimates: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  avgBasketEur: 45,
  conversionRatePct: 0,
  retailerOverrides: {},
  showEstimates: false,
};

const KEY = 'nv-wtb-settings';

/* ─────────────────────────── Normalisation ─────────────────────────── */

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** Ne fait jamais confiance à ce qui arrive du réseau ou d'une variable. */
export function normalize(raw: unknown): Settings {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const overrides: Record<string, RetailerOverride> = {};
  const rawOverrides = o.retailerOverrides;
  if (rawOverrides && typeof rawOverrides === 'object') {
    for (const [name, value] of Object.entries(rawOverrides as Record<string, unknown>)) {
      if (!name || name.length > 120) continue;
      const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
      const entry: RetailerOverride = {};
      if (v.avgBasketEur !== undefined && v.avgBasketEur !== '') {
        entry.avgBasketEur = clamp(v.avgBasketEur, 0, 100000, DEFAULT_SETTINGS.avgBasketEur);
      }
      if (v.conversionRatePct !== undefined && v.conversionRatePct !== '') {
        entry.conversionRatePct = clamp(v.conversionRatePct, 0, 100, 0);
      }
      if (Object.keys(entry).length > 0) overrides[name] = entry;
    }
  }

  return {
    avgBasketEur: clamp(o.avgBasketEur, 0, 100000, DEFAULT_SETTINGS.avgBasketEur),
    conversionRatePct: clamp(o.conversionRatePct, 0, 100, DEFAULT_SETTINGS.conversionRatePct),
    retailerOverrides: overrides,
    showEstimates: o.showEstimates === true || o.showEstimates === 'true',
  };
}

/* ─────────────────────────── Stockage ─────────────────────────── */

function kvConfig(): { url: string; token: string } | null {
  const url = (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export const hasStore = () => kvConfig() !== null;

/** Commande Redis via l'API REST Upstash — aucune dépendance à installer. */
async function redis(command: unknown[]): Promise<unknown> {
  const cfg = kvConfig();
  if (!cfg) return null;
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${cfg.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  const json = (await res.json()) as { result?: unknown };
  return json.result ?? null;
}

export async function readSettings(): Promise<Settings> {
  if (hasStore()) {
    try {
      const stored = await redis(['get', KEY]);
      if (typeof stored === 'string' && stored.length > 0) {
        return normalize(JSON.parse(stored));
      }
    } catch {
      /* le store est injoignable : on retombe sur l'environnement */
    }
  }

  const fromEnv = process.env.SETTINGS_JSON?.trim();
  if (fromEnv) {
    try {
      return normalize(JSON.parse(fromEnv));
    } catch {
      /* JSON invalide : on garde les valeurs par défaut */
    }
  }

  return DEFAULT_SETTINGS;
}

export async function writeSettings(settings: Settings): Promise<boolean> {
  if (!hasStore()) return false;
  await redis(['set', KEY, JSON.stringify(settings)]);
  return true;
}

/* ─────────────────────────── Extrapolation ─────────────────────────── */

export type Estimate = { orders: number; revenue: number };

const basketFor = (s: Settings, retailer: string) =>
  s.retailerOverrides[retailer]?.avgBasketEur ?? s.avgBasketEur;

const conversionFor = (s: Settings, retailer: string) =>
  s.retailerOverrides[retailer]?.conversionRatePct ?? s.conversionRatePct;

/**
 * Commandes et CA estimés à partir des redirections par enseigne.
 * Chaque enseigne utilise son propre taux quand il est renseigné, sinon le
 * taux global — c'est ce qui permet de traiter Amazon différemment d'une
 * animalerie de quartier.
 */
export function estimate(
  settings: Settings,
  redirectionsByRetailer: { label: string; value: number }[],
): Estimate {
  let orders = 0;
  let revenue = 0;
  for (const r of redirectionsByRetailer) {
    const converted = r.value * (conversionFor(settings, r.label) / 100);
    orders += converted;
    revenue += converted * basketFor(settings, r.label);
  }
  return { orders, revenue };
}

/**
 * Valeur des paniers envoyés chez les distributeurs. On prend les montants
 * réels de l'export quand il y en a ; sinon on extrapole depuis le panier
 * moyen, et l'affichage le signale.
 */
export function engagedRevenue(
  settings: Settings,
  realAmount: number,
  redirectionsByRetailer: { label: string; value: number }[],
): { value: number; estimated: boolean } {
  if (realAmount > 0) return { value: realAmount, estimated: false };
  const value = redirectionsByRetailer.reduce(
    (t, r) => t + r.value * basketFor(settings, r.label),
    0,
  );
  return { value, estimated: true };
}
