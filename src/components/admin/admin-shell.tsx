'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminShellUser {
  name: string | null;
  email: string;
  adminRole: string;
}

const navItems = [
  {
    href: '/admin',
    label: 'Visao geral',
    detail: 'Saude e filas',
    icon: 'bi-speedometer2',
  },
  {
    href: '/admin/resets',
    label: 'Solicitacoes',
    detail: 'Redefinicao de senha',
    icon: 'bi-key',
  },
  {
    href: '/admin/users',
    label: 'Usuarios',
    detail: 'Moderacao e acesso',
    icon: 'bi-people',
  },
  {
    href: '/admin/leagues',
    label: 'Boloes',
    detail: 'Status e operacao',
    icon: 'bi-trophy',
  },
  {
    href: '/admin/matches',
    label: 'API e partidas',
    detail: 'Sync e placares',
    icon: 'bi-broadcast',
  },
  {
    href: '/admin/audit',
    label: 'Auditoria',
    detail: 'Rastro operacional',
    icon: 'bi-shield-check',
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navegacao administrativa">
        <Link className="admin-brand" href="/admin">
          <span>CDC</span>
          <strong>
            Operacoes
            <small>Copa dos Crias</small>
          </strong>
        </Link>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              className={isActive(pathname, item.href) ? 'active' : undefined}
              href={item.href}
              key={item.href}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span>
                {item.label}
                <small>{item.detail}</small>
              </span>
            </Link>
          ))}
        </nav>

        <div className="admin-identity">
          <small>{user.adminRole}</small>
          <strong>{user.name || user.email}</strong>
          <span>{user.email}</span>
          <Link href="/dashboard">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Voltar ao app
          </Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
