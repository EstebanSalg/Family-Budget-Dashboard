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
    <main className="flex min-h-screen items-center justify-center bg-panel-bg text-panel-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-panel-line bg-panel-surface p-8">
        <h1 className="text-xl font-semibold">Family Budget Dashboard</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Household password"
          className="w-full rounded border border-panel-line bg-panel-surface2 px-3 py-2 text-panel-ink"
        />
        {error && <p className="text-sm text-[#F43F5E]">{error}</p>}
        <button type="submit" className="w-full rounded bg-accent py-2 font-medium text-panel-bg">
          Sign in
        </button>
      </form>
    </main>
  );
}
