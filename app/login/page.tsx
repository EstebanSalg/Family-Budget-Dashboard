'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-panel-ink">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm space-y-4 rounded-2xl p-8">
        <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-accent-line bg-accent-soft shadow-[0_0_14px_-2px_var(--accent-glow)]">
          <svg viewBox="0 0 26 26" aria-hidden="true" className="h-[22px] w-[22px]">
            <path d="M6 18V13m7 5V8m7 10v-7" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </svg>
        </span>
        <h1 className="text-xl font-bold tracking-tight">Family Budget Dashboard</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Household password"
          aria-label="Household password"
          className="w-full rounded-xl border border-panel-line bg-panel-surface2 px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-faint focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent-soft"
        />
        {error && <p role="alert" className="text-sm text-status-over-ink">{error}</p>}
        <button type="submit" className="btn-glow w-full rounded-xl py-2.5 font-semibold transition-[filter] hover:brightness-110">
          Sign in
        </button>
      </form>
    </main>
  );
}
