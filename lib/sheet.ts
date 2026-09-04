import {
  ConfigError,
  SheetsError,
  isAuthFailure,
  isConfigured,
  listTabs,
  readValues,
  sheetTab,
  spreadsheetId,
} from './google';

/**
 * Lecture du Google Sheet natures_variety_event_aggregates.
 *
 * Source unique : l'API Google Sheets, via le compte de service configuré dans
 * GOOGLE_SERVICE_ACCOUNT_JSON. Le Sheet reste privé — il suffit de le partager
 * en lecture avec l'adresse du compte de service.
 *
 * Le résultat est gardé en mémoire pendant REVALIDATE_SECONDS : le dashboard
 * se met à jour tout seul, sans redéploiement et sans marteler l'API.
 */

export type EventRow = {
  date: string; // YYYY-MM-DD
  count: number;
  amount: number;
  action: string;
  medium: string;
  mediumId: string;
  productId: string;
  referrer: string;
  tab: string;
  retailerName: string;
  retailOutletName: string;
  retailOutletCity: string;
  retailOutletService: string;
  landingcategory: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
};

export type SheetResult =
  | { ok: true; rows: EventRow[]; fetchedAt: string }
  | { ok: false; error: string; hint: string };

/* ─────────────────────────── Normalisation ─────────────────────────── */

/** "utm_campaign", "UTM Campaign", "utm\_campaign" → "utmcampaign" */
const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

const NUM = (v: string | undefined): number => {
  if (!v) return 0;
  const n = Number(v.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const STR = (v: string | undefined): string => (v ?? '').trim();

function toDate(raw: string): string {
  const s = STR(raw);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/**
 * Les colonnes sont retrouvées par leur nom, pas par leur position : ajouter
 * ou déplacer une colonne dans l'export ne casse pas le dashboard.
 */
export function mapRows(raw: string[][]): EventRow[] {
  if (raw.length < 2) return [];

  let headerIndex = raw.findIndex((r) => {
    const set = new Set(r.map(normalizeHeader));
    return set.has('action') && set.has('count');
  });
  if (headerIndex === -1) headerIndex = 0;

  const headers = raw[headerIndex].map(normalizeHeader);
  const idx = (name: string) => headers.indexOf(name);

  const c = {
    timestamp: idx('timestamp'),
    count: idx('count'),
    amount: idx('amount'),
    action: idx('action'),
    medium: idx('medium'),
    mediumId: idx('mediumid'),
    productId: idx('productid'),
    referrer: idx('referrer'),
    tab: idx('tab'),
    retailerName: idx('retailername'),
    retailOutletName: idx('retailoutletname'),
    retailOutletCity: idx('retailoutletcity'),
    retailOutletService: idx('retailoutletservice'),
    landingcategory: idx('landingcategory'),
    utmSource: idx('utmsource'),
    utmMedium: idx('utmmedium'),
    utmCampaign: idx('utmcampaign'),
    utmContent: idx('utmcontent'),
    utmTerm: idx('utmterm'),
  };

  const at = (r: string[], i: number) => (i >= 0 ? r[i] : undefined);

  return raw
    .slice(headerIndex + 1)
    .map((r) => ({
      date: toDate(STR(at(r, c.timestamp))),
      count: c.count >= 0 ? NUM(at(r, c.count)) || 1 : 1,
      amount: NUM(at(r, c.amount)),
      action: STR(at(r, c.action)),
      medium: STR(at(r, c.medium)),
      mediumId: STR(at(r, c.mediumId)),
      productId: STR(at(r, c.productId)),
      referrer: STR(at(r, c.referrer)),
      tab: STR(at(r, c.tab)),
      retailerName: STR(at(r, c.retailerName)),
      retailOutletName: STR(at(r, c.retailOutletName)),
      retailOutletCity: STR(at(r, c.retailOutletCity)),
      retailOutletService: STR(at(r, c.retailOutletService)),
      landingcategory: STR(at(r, c.landingcategory)),
      utmSource: STR(at(r, c.utmSource)),
      utmMedium: STR(at(r, c.utmMedium)),
      utmCampaign: STR(at(r, c.utmCampaign)),
      utmContent: STR(at(r, c.utmContent)),
      utmTerm: STR(at(r, c.utmTerm)),
    }))
    .filter((r) => r.date !== '' && r.action !== '');
}

/* ─────────────────── Cache mémoire ───────────────────
   La page est rendue à la demande (elle dépend de la période choisie), donc
   sans ce cache on interrogerait l'API à chaque affichage. */
let cache: { rows: EventRow[]; fetchedAt: number } | null = null;

/** 0 est une valeur légitime : elle désactive le cache. */
const ttlSeconds = (): number => {
  const raw = process.env.REVALIDATE_SECONDS?.trim();
  if (!raw) return 900;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 900;
};

/* ─────────────────────────── Point d'entrée ─────────────────────────── */

export async function fetchEvents(): Promise<SheetResult> {
  if (cache && (Date.now() - cache.fetchedAt) / 1000 < ttlSeconds()) {
    return {
      ok: true,
      rows: cache.rows,
      fetchedAt: new Date(cache.fetchedAt).toISOString(),
    };
  }

  const result = await readSheet();
  if (result.ok) cache = { rows: result.rows, fetchedAt: Date.now() };
  return result;
}

async function readSheet(): Promise<SheetResult> {
  if (!isConfigured()) {
    return {
      ok: false,
      error: 'La connexion au Google Sheet n’est pas configurée.',
      hint:
        'Renseigner GOOGLE_SERVICE_ACCOUNT_JSON (la clé JSON du compte de service) ' +
        'et GOOGLE_SHEET_ID (l’identifiant du Sheet) dans les variables d’environnement.',
    };
  }

  const id = spreadsheetId() as string;

  let raw: string[][];
  try {
    raw = await readValues(id, sheetTab());
  } catch (e) {
    return failure(e);
  }

  const rows = mapRows(raw);

  if (rows.length === 0) {
    let tabs: string[] = [];
    try {
      tabs = await listTabs(id);
    } catch {
      /* Le diagnostic est optionnel : sans lui, le message reste utile. */
    }

    return {
      ok: false,
      error: 'Le Sheet a été lu, mais aucune ligne exploitable n’a été trouvée.',
      hint:
        'Vérifier que l’onglet lu est celui de l’export et qu’il contient les colonnes ' +
        'timestamp, count, action et medium. ' +
        (tabs.length > 0
          ? `Onglets du document : ${tabs.join(', ')} — préciser lequel via GOOGLE_SHEET_TAB.`
          : 'Préciser l’onglet via GOOGLE_SHEET_TAB.'),
    };
  }

  return { ok: true, rows, fetchedAt: new Date().toISOString() };
}

/** Traduit une erreur d'API en message actionnable pour l'écran d'erreur. */
function failure(e: unknown): SheetResult {
  /* Erreur de notre côté : variable absente ou mal formée. */
  if (e instanceof ConfigError) {
    return {
      ok: false,
      error: 'La clé du compte de service est inutilisable.',
      hint: e.message,
    };
  }

  const err = e instanceof SheetsError ? e : null;
  const status = err?.status;

  /* Google renvoie ces refus OAuth avec un statut 400 : c'est bien
     l'authentification qui échoue, pas la requête. */
  if (err && isAuthFailure(err.message)) {
    return {
      ok: false,
      error: 'Google a refusé la clé du compte de service.',
      hint:
        'Le compte de service a peut-être été supprimé, ou sa clé révoquée. ' +
        'Régénérer une clé JSON dans la console Google Cloud et remplacer ' +
        `GOOGLE_SERVICE_ACCOUNT_JSON. Détail : ${err.message}`,
    };
  }

  if (status === 401) {
    return {
      ok: false,
      error: 'Google a refusé l’authentification du compte de service.',
      hint:
        'La clé est peut-être révoquée ou tronquée. Régénérer une clé JSON dans la console ' +
        'Google Cloud et remplacer GOOGLE_SERVICE_ACCOUNT_JSON.',
    };
  }

  if (status === 403) {
    return {
      ok: false,
      error: 'Le compte de service n’a pas accès à ce Sheet.',
      hint:
        'Partager le Google Sheet en lecture avec l’adresse du compte de service ' +
        '(client_email de la clé JSON), et activer l’API Google Sheets sur le projet Google Cloud.',
    };
  }

  if (status === 404) {
    return {
      ok: false,
      error: 'Ce Sheet n’existe pas, ou l’identifiant est faux.',
      hint: 'GOOGLE_SHEET_ID est la chaîne entre /d/ et /edit dans l’URL du Sheet.',
    };
  }

  if (status === 400) {
    return {
      ok: false,
      error: 'La plage demandée est refusée par Google.',
      hint: 'Vérifier GOOGLE_SHEET_TAB : il doit reprendre le nom exact de l’onglet.',
    };
  }

  if (status === 429 || (status !== undefined && status >= 500)) {
    return {
      ok: false,
      error: 'L’API Google Sheets est momentanément indisponible.',
      hint: 'Réessayer dans quelques minutes. Aucune action n’est nécessaire.',
    };
  }

  return {
    ok: false,
    error: 'La lecture du Sheet a échoué.',
    hint: err?.message
      ? `Détail renvoyé par Google : ${err.message}`
      : 'Vérifier GOOGLE_SERVICE_ACCOUNT_JSON et GOOGLE_SHEET_ID.',
  };
}
