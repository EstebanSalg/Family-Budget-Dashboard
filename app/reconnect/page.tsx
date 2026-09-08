export default function ReconnectPage() {
  return (
    <main className="min-h-screen space-y-4 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Reconnect Google Sheets</h1>
      <p className="text-slate-400">
        Use this if the dashboard stops updating because the Google connection
        expired (this happens roughly every 7 days while the app is in Google's
        &quot;Testing&quot; publishing status). Clicking through asks you to sign
        in with Google and shows a new value to paste into Vercel.
      </p>
      <a
        href="/api/auth/google/start"
        className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium"
      >
        Connect Google Sheets
      </a>
    </main>
  );
}
