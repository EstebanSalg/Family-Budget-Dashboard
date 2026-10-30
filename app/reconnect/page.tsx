import { BTN_PRIMARY, PAGE, PANEL, PageHeader } from '../components/ui';

export default function ReconnectPage() {
  return (
    <main className={`${PAGE} space-y-5`}>
      <PageHeader title="Reconnect Google Sheets" />
      <section className={`${PANEL} max-w-[68ch] space-y-5`}>
        <p className="text-panel-inkMuted">
          Use this if the dashboard stops updating because the Google connection
          expired (this happens roughly every 7 days while the app is in
          Google&apos;s &quot;Testing&quot; publishing status). Clicking through
          asks you to sign in with Google and shows a new value to paste into
          your hosting provider&apos;s environment variables (Vercel or Fly.io).
        </p>
        <a href="/api/auth/google/start" className={`${BTN_PRIMARY} inline-block`}>
          Connect Google Sheets
        </a>
      </section>
    </main>
  );
}
