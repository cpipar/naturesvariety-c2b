import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, accessToken, passwordRequired } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const expectedPassword = passwordRequired();
  const form = await request.formData();
  const submitted = String(form.get('password') ?? '');

  if (!expectedPassword || submitted !== expectedPassword) {
    return NextResponse.redirect(new URL('/login?e=1', request.url), 303);
  }

  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.set({
    name: AUTH_COOKIE,
    value: await accessToken(expectedPassword),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
  return response;
}
