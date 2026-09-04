import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';

/* ═══════════════════════════════════════════════════════════════════════════
   Accès au Google Sheet via l'API officielle (google-api-nodejs-client).

   Le dashboard s'authentifie avec un compte de service : le Sheet reste privé,
   rien n'est publié sur le web. Deux variables d'environnement suffisent :

     GOOGLE_SERVICE_ACCOUNT_JSON  la clé du compte de service, JSON complet
                                  (accepte aussi le même JSON encodé en base64)
     GOOGLE_SHEET_ID              l'identifiant du Sheet, entre /d/ et /edit

   La clé ne doit jamais être commitée : .env.local en local, variable
   d'environnement chiffrée sur Vercel.
   ═══════════════════════════════════════════════════════════════════════════ */

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

/** Plage lue dans l'onglet. Large à dessein : l'export peut gagner des colonnes. */
const RANGE = 'A:AZ';

export type ServiceAccountKey = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

/** Erreur portant le statut HTTP renvoyé par Google, pour un message précis. */
export class SheetsError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'SheetsError';
  }
}

/**
 * Erreur de configuration locale — variable absente, mal formée, incomplète.
 * Distinguée de SheetsError pour ne jamais présenter au lecteur une erreur de
 * notre côté comme une réponse de Google.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Motifs OAuth renvoyés par Google avec un statut 400 alors qu'il s'agit d'un
 * refus d'authentification, pas d'une requête mal formée.
 */
export const isAuthFailure = (message: string) =>
  /invalid_grant|unauthorized_client|invalid_client|invalid_scope|Invalid JWT/i.test(message);

/* ─────────────────────────── Configuration ─────────────────────────── */

/**
 * Lit GOOGLE_SERVICE_ACCOUNT_JSON. La valeur est acceptée en JSON brut ou en
 * base64 — pratique quand l'interface d'hébergement mange les retours à la
 * ligne. Renvoie null si la variable est absente, throw si elle est invalide.
 */
export function serviceAccountKey(): ServiceAccountKey | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  const text = raw.startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf8').trim();

  let parsed: Partial<ServiceAccountKey>;
  try {
    parsed = JSON.parse(text) as Partial<ServiceAccountKey>;
  } catch {
    throw new ConfigError(
      'GOOGLE_SERVICE_ACCOUNT_JSON ne contient pas un JSON valide. ' +
        'Coller le fichier de clé entier, accolades comprises.',
    );
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new ConfigError(
      'GOOGLE_SERVICE_ACCOUNT_JSON est incomplet : client_email et private_key sont requis.',
    );
  }

  return {
    client_email: parsed.client_email,
    // Une clé saisie sur une seule ligne garde ses \n littéraux.
    private_key: parsed.private_key.replace(/\\n/g, '\n'),
    project_id: parsed.project_id,
  };
}

export function spreadsheetId(): string | null {
  return process.env.GOOGLE_SHEET_ID?.trim() || null;
}

/** Onglet à lire. Vide = premier onglet du document. */
export function sheetTab(): string {
  return process.env.GOOGLE_SHEET_TAB?.trim() || '';
}

export const isConfigured = () =>
  Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() && spreadsheetId());

/* ─────────────────────────── Client Sheets ─────────────────────────── */

let client: sheets_v4.Sheets | null = null;

/**
 * Le client est mis en cache pour tout le process : GoogleAuth gère seul le
 * cycle de vie du jeton d'accès (obtention, mise en cache, rafraîchissement).
 */
export function sheetsClient(): sheets_v4.Sheets {
  if (client) return client;

  const key = serviceAccountKey();
  if (!key) {
    throw new ConfigError(
      'Aucun compte de service configuré (GOOGLE_SERVICE_ACCOUNT_JSON).',
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: key.client_email, private_key: key.private_key },
    scopes: SCOPES,
  });

  client = google.sheets({ version: 'v4', auth });
  return client;
}

/* ─────────────────────────── Lectures ─────────────────────────── */

/** Noms des onglets du document, dans l'ordre. */
export async function listTabs(id: string): Promise<string[]> {
  try {
    const res = await sheetsClient().spreadsheets.get({
      spreadsheetId: id,
      fields: 'sheets.properties.title',
    });
    return (res.data.sheets ?? [])
      .map((s) => s.properties?.title ?? '')
      .filter((t) => t !== '');
  } catch (e) {
    throw asSheetsError(e);
  }
}

/**
 * Renvoie les lignes de la feuille, toutes les cellules en chaîne. Un onglet
 * non précisé cible le premier onglet du document.
 */
export async function readValues(id: string, tab: string): Promise<string[][]> {
  // Les noms d'onglets contenant un espace ou une apostrophe doivent être quotés.
  const target = tab ? `'${tab.replace(/'/g, "''")}'!${RANGE}` : RANGE;

  let data: sheets_v4.Schema$ValueRange;
  try {
    const res = await sheetsClient().spreadsheets.values.get({
      spreadsheetId: id,
      range: target,
      majorDimension: 'ROWS',
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });
    data = res.data;
  } catch (e) {
    throw asSheetsError(e);
  }

  const values = Array.isArray(data.values) ? data.values : [];

  return values.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) =>
      cell === null || cell === undefined ? '' : String(cell),
    ),
  );
}

/** Normalise les erreurs de googleapis en SheetsError avec le statut HTTP. */
function asSheetsError(e: unknown): Error {
  if (e instanceof SheetsError || e instanceof ConfigError) return e;

  const err = e as { code?: number | string; status?: number; message?: string };
  const status =
    typeof err.status === 'number'
      ? err.status
      : typeof err.code === 'number'
        ? err.code
        : Number(err.code) || undefined;

  return new SheetsError(err.message ?? 'Lecture du Sheet impossible.', status);
}
