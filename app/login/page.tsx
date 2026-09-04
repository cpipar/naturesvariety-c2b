export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const clientName = process.env.CLIENT_NAME?.trim() || 'Nature’s Variety';

  return (
    <main className="login">
      <div className="login__card">
        <h1>{clientName}</h1>
        <p>
          This Where-to-Buy dashboard is private. Enter the password you were given to
          see the campaign figures.
        </p>
        {e ? <p className="login__error">That password is not right.</p> : null}
        <form method="post" action="/api/login">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            aria-label="Password"
            required
          />
          <button className="linkbtn" type="submit" style={{ width: '100%' }}>
            Open the dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
