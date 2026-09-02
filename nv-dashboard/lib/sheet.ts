/**
 * Lecture du Google Sheet natures_variety_event_aggregates.
 *
 * Le Sheet est lu en CSV, sans authentification : soit via l'URL de publication
 * web (SHEET_CSV_URL), soit via l'endpoint /export du Sheet (SHEET_ID + SHEET_GID).
 * Next.js met le résultat en cache pendant REVALIDATE_SECONDS, donc le dashboard
 * se met à jour tout seul, sans redéploiement.
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

/* ─────────────────────────── Parsing CSV ─────────────────────────── */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }

    if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }

  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

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

/* ─────────────────────────── Récupération ─────────────────────────── */

export function sheetCsvUrl(): string | null {
  const direct = process.env.SHEET_CSV_URL?.trim();
  if (direct) return direct;

  const id = process.env.SHEET_ID?.trim();
  if (!id) return null;
  const gid = process.env.SHEET_GID?.trim() || '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export async function fetchEvents(): Promise<SheetResult> {
  const url = sheetCsvUrl();
  if (!url) {
    return {
      ok: false,
      error: 'Aucune source de données configurée.',
      hint: 'Renseigner SHEET_CSV_URL (ou SHEET_ID) dans les variables d’environnement Vercel.',
    };
  }

  const revalidate = Number(process.env.REVALIDATE_SECONDS ?? 900) || 900;

  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate },
      headers: { 'user-agent': 'nv-wtb-dashboard' },
    });
  } catch {
    return {
      ok: false,
      error: 'Le Google Sheet n’a pas pu être contacté.',
      hint: 'Vérifier l’URL configurée et que le Sheet est accessible sans connexion.',
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `Le Google Sheet a répondu ${res.status}.`,
      hint:
        'Le Sheet doit être publié sur le web en CSV, ou partagé en lecture avec ' +
        '« Tous les utilisateurs disposant du lien ».',
    };
  }

  const text = await res.text();

  if (/^\s*<(!doctype|html)/i.test(text)) {
    return {
      ok: false,
      error: 'Le Google Sheet n’est pas lisible publiquement.',
      hint:
        'Google a renvoyé une page de connexion au lieu du CSV. Publier l’onglet ' +
        'sur le web (Fichier → Partager → Publier sur le web → CSV) et utiliser cette URL.',
    };
  }

  const rows = mapRows(parseCsv(text));

  if (rows.length === 0) {
    return {
      ok: false,
      error: 'Le Sheet a été lu, mais aucune ligne exploitable n’a été trouvée.',
      hint:
        'Vérifier que l’onglet lu (SHEET_GID) est celui de l’export et qu’il contient ' +
        'les colonnes timestamp, count, action et medium.',
    };
  }

  return { ok: true, rows, fetchedAt: new Date().toISOString() };
}
