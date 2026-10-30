'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Stroke paths for 24x24 icons, drawn in one 1.8px round-capped style.
const links = [
  {
    href: '/',
    label: 'Overview',
    icon: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: '<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12"/><circle cx="4.5" cy="6.5" r=".6"/><circle cx="4.5" cy="12" r=".6"/><circle cx="4.5" cy="17.5" r=".6"/>',
  },
  { href: '/annual', label: 'Annual', icon: '<path d="M5 20V11M12 20V5M19 20v-6"/>' },
  {
    href: '/recurring',
    label: 'Recurring',
    icon: '<path d="M4 11a8 8 0 0 1 14-4.5L20 9M20 4v5h-5M20 13a8 8 0 0 1-14 4.5L4 15M4 20v-5h5"/>',
  },
  {
    href: '/debts',
    label: 'Debts',
    icon: '<path d="M3.5 10 12 4.5 20.5 10M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3.5 20h17"/>',
  },
];

function Icon({ paths }: { paths: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[22px] w-[22px] shrink-0"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}

export function NavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-[rgba(30,41,59,0.8)] bg-[var(--glass-bar)] px-3.5 py-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-2 text-base font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-accent-line bg-accent-soft shadow-[0_0_14px_-2px_var(--accent-glow)]">
            <svg viewBox="0 0 26 26" aria-hidden="true" className="h-[18px] w-[18px]">
              <path d="M6 18V13m7 5V8m7 10v-7" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            </svg>
          </span>
          Household
        </div>
        <nav aria-label="Sections" className="flex flex-col gap-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-panel-inkMuted transition-colors hover:bg-panel-tint hover:text-panel-ink aria-[current=page]:btn-glow aria-[current=page]:text-white"
            >
              <Icon paths={l.icon} />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 px-2.5 text-[13px] text-panel-inkMuted">
          <p>Shared by two. One household pool.</p>
          <Link href="/reconnect" className="underline decoration-panel-line underline-offset-2 hover:text-accent">
            Reconnect Google
          </Link>
        </div>
      </aside>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[rgba(30,41,59,0.8)] bg-[var(--glass-bar)] px-1 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? 'page' : undefined}
            className="flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[11px] font-semibold text-panel-inkMuted aria-[current=page]:text-accent aria-[current=page]:[&>svg]:drop-shadow-[0_0_6px_var(--accent-glow)]"
          >
            <Icon paths={l.icon} />
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
