import crypto from 'node:crypto';

/* ═══════════════════════════════════════════════════════════════════════════
   Lecture du Google Sheet via un compte de service.

   C'est la voie propre : aucune publication du Sheet, aucune donnée exposée.
   Le dashboard s'authentifie auprès de Google avec la clé du compte de service
   et lit la feuille comme le ferait un utilisateur autorisé.

   Configuration : une seule variable d'environnement,
   GOOGLE_SERVICE_ACCOUNT_JSON, qui contient le fichier JSON complet de la clé.
   Elle ne doit jamais être commitée — uniquement saisie dans Vercel.

   Volontairement sans dépendance : le JWT est signé avec le module crypto de
   Node. Rien à mettre à jour, rien à auditer en plus.
   ═══════════════════════════════════════════════════════════════════════════ */

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';

export function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
          token_uri: parsed.token_uri ?? DEFAULT_TOKEN_URI,
        };
      }
    } catch {
      /* JSON invalide — on tombe sur les variables séparées ci-dessous */
    }
  }

  /* Variante : email et clé dans deux variables distinctes. */
  const email = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (email && key) {
    return {
      client_email: email,
      // Vercel garde les \n littéraux quand la clé est saisie sur une ligne.
      private_key: key.replace(/\\n/g, '\n'),
      token_uri: DEFAULT_TOKEN_URI,
    };
  }

  return null;
}

export const hasServiceAccount = () => serviceAccount() !== null;

/* ─────────────────────────── Jeton d'accès ─────────────────────────── */

const base64url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // On garde le jeton jusqu'à une minute avant son expiration.
  if (tokenCache && tokenCache.expiresAt - 60 > now) return tokenCache.token;

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signature = base64url(
    crypto.createSign('RSA-SHA256').update(`${header}.${claims}`).sign(sa.private_key),
  );

  const res = await fetch(sa.token_uri ?? DEFAULT_TOKEN_URI, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`token ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('token: réponse sans access_token');

  tokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600),
  };
  return tokenCache.token;
}

/* ─────────────────────────── Lecture des valeurs ─────────────────────────── */

export type SheetsError = { status: number; message: string };

/**
 * Renvoie les lignes brutes de la feuille. `range` sans nom d'onglet cible le
 * premier onglet du document.
 */
export async function readValues(
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const sa = serviceAccount();
  if (!sa) throw new Error('Aucun compte de service configuré.');

  const token = await accessToken(sa);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}` +
    `?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err: SheetsError = { status: res.status, message: detail.slice(0, 300) };
    throw Object.assign(new Error(`sheets ${res.status}`), err);
  }

  const json = (await res.json()) as { values?: unknown[][] };
  const values = Array.isArray(json.values) ? json.values : [];

  return values.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) =>
      cell === null || cell === undefined ? '' : String(cell),
    ),
  );
}
