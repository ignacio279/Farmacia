'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/clientes', label: 'Clientes' },
  { href: '/conversaciones', label: 'Conversaciones' },
  { href: '/campanas', label: 'Campañas' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-teal-700 text-white flex flex-col">
      <div className="p-4 border-b border-teal-600">
        <h1 className="font-semibold text-lg">Panel Farmacia</h1>
      </div>
      <nav className="p-2 flex-1">
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-teal-600 text-white'
                : 'text-teal-100 hover:bg-teal-600/70 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
