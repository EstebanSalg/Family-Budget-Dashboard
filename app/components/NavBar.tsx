import Link from 'next/link';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/categories', label: 'Categories' },
  { href: '/debts', label: 'Debt Tracker' },
  { href: '/recurring', label: 'Recurring' },
  { href: '/annual', label: 'Annual' },
  { href: '/reconnect', label: 'Reconnect' },
];

export function NavBar() {
  return (
    <nav className="flex gap-5 border-b border-panel-line bg-panel-surface px-6 py-3 font-mono text-[13px] uppercase tracking-wide text-panel-inkMuted">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="transition-colors hover:text-accent">{l.label}</Link>
      ))}
    </nav>
  );
}
