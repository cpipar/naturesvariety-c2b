import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, accessToken, passwordRequired } from '@/lib/auth';

/**
 * Si DASHBOARD_PASSWORD est défini, le dashboard n'est visible qu'après saisie
 * du mot de passe. Sans cette variable, l'accès est libre.
 */
export async function middleware(request: NextRequest) {
  const password = passwordRequired();
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = await accessToken(password);

  if (cookie === expected) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Tout sauf l'écran de connexion, ses routes API et les fichiers statiques.
  matcher: ['/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico).*)'],
};
