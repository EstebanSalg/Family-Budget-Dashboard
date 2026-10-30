export default function ReconnectPage() {
  return (
    <main className="min-h-screen space-y-4 bg-panel-bg p-6 text-panel-ink">
      <h1 className="text-2xl font-semibold">Reconnect Google Sheets</h1>
      <p className="text-panel-inkMuted">
        Use this if the dashboard stops updating because the Google connection
        expired (this happens roughly every 7 days while the app is in
        Google&apos;s &quot;Testing&quot; publishing status). Clicking through
        asks you to sign in with Google and shows a new value to paste into
        your hosting provider&apos;s environment variables (Vercel or Fly.io).
      </p>
      <a
        href="/api/auth/google/start"
        className="inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-panel-bg"
      >
        Connect Google Sheets
      </a>
    </main>
  );
}
