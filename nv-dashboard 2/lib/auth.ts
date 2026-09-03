export const AUTH_COOKIE = 'c2b_dashboard_access';
export const ADMIN_COOKIE = 'c2b_dashboard_admin';

/** Jeton opaque dérivé du mot de passe : le cookie ne contient jamais le mot de passe. */
export async function accessToken(password: string, scope = 'access'): Promise<string> {
  const data = new TextEncoder().encode(`c2b-dashboard::${scope}::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Mot de passe d'accès au dashboard. null = accès libre. */
export function passwordRequired(): string | null {
  const pwd = process.env.DASHBOARD_PASSWORD?.trim();
  return pwd ? pwd : null;
}

/** Mot de passe de l'écran Admin. null = pas d'accès admin. */
export function adminPassword(): string | null {
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  return pwd ? pwd : null;
}
