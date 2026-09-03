import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, accessToken, adminPassword } from '@/lib/auth';
import { hasStore, normalize, readSettings, writeSettings } from '@/lib/settings';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) return false;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  return cookie === (await accessToken(expected, 'admin'));
}

export async function GET() {
  return NextResponse.json({
    settings: await readSettings(),
    hasStore: hasStore(),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ ok: false, error: 'not_admin' }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const settings = normalize(payload);

  if (!hasStore()) {
    /* Pas de stockage branché : on ne peut rien persister, mais on renvoie le
       JSON prêt à coller dans la variable SETTINGS_JSON. */
    return NextResponse.json({
      ok: false,
      error: 'no_store',
      settings,
      json: JSON.stringify(settings),
    });
  }

  try {
    await writeSettings(settings);
  } catch {
    return NextResponse.json({ ok: false, error: 'store_failed', settings }, { status: 502 });
  }

  return NextResponse.json({ ok: true, settings });
}
