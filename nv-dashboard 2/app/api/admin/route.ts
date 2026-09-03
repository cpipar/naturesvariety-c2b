import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, accessToken, adminPassword } from '@/lib/auth';

/** Ouvre l'accès admin : pose un cookie si le mot de passe est le bon. */
export async function POST(request: NextRequest) {
  const expected = adminPassword();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'no_admin_password' },
      { status: 404 },
    );
  }

  let submitted = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    submitted = typeof body.password === 'string' ? body.password : '';
  } catch {
    submitted = '';
  }

  if (submitted !== expected) {
    return NextResponse.json({ ok: false, error: 'wrong_password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: await accessToken(expected, 'admin'),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

/** Ferme l'accès admin. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: ADMIN_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
