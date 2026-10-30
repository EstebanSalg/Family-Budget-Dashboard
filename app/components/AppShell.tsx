'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from './NavBar';

// Sidebar on desktop, bottom tab bar on phones. The login page stands alone.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/login')) return <>{children}</>;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <NavBar />
      <div className="min-w-0 pb-24 lg:pb-0">{children}</div>
    </div>
  );
}
