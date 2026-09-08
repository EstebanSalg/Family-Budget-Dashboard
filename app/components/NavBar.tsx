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
    <nav className="flex gap-4 border-b border-slate-800 bg-slate-950 px-6 py-3 text-sm text-slate-300">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-white">{l.label}</Link>
      ))}
    </nav>
  );
}
