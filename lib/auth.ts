export const AUTH_COOKIE = 'c2b_dashboard_access';

/** Jeton opaque dérivé du mot de passe : le cookie ne contient jamais le mot de passe. */
export async function accessToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`c2b-dashboard::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function passwordRequired(): string | null {
  const pwd = process.env.DASHBOARD_PASSWORD?.trim();
  return pwd ? pwd : null;
}
