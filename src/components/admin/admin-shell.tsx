'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AdminShellUser {
  name: string | null;
  email: string;
  adminRole: string;
}

const navItems = [
  {
    href: '/admin',
    label: 'Visão geral',
    detail: 'Saúde e filas',
    icon: 'bi-speedometer2',
  },
  {
    href: '/admin/resets',
    label: 'Solicitações',
    detail: 'Redefinição de senha',
    icon: 'bi-key',
  },
  {
    href: '/admin/users',
    label: 'Usuários',
    detail: 'Moderação e acesso',
    icon: 'bi-people',
  },
  {
    href: '/admin/leagues',
    label: 'Bolões',
    detail: 'Status e operação',
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fecha a sidebar ao clicar em um link no mobile
  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-shell">
      {/* Header fixo no celular */}
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-hamburger"
          aria-label="Abrir menu"
          onClick={() => setSidebarOpen(true)}
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>
        <span className="admin-mobile-title">Copa dos Crias Admin</span>
      </header>

      {/* Overlay transparente/desfocado para fechar a sidebar no mobile */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Navegação administrativa">
        {/* Botão de fechar no mobile */}
        <button
          type="button"
          className="admin-sidebar-close"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
          style={{ display: sidebarOpen ? 'block' : 'none' }}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>

        <Link className="admin-brand" href="/admin" onClick={handleLinkClick}>
          <span>CDC</span>
          <strong>
            Operações
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
              onClick={handleLinkClick}
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
