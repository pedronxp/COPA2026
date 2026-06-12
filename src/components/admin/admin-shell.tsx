'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Carrega o estado de recolhimento inicial do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('admin_sidebar_collapsed', String(newVal));
  };

  // Fecha a sidebar ao clicar em um link no mobile
  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`admin-shell ${isCollapsed ? 'collapsed' : ''}`}>
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
          }}
        />
      )}

      <aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        aria-label="Navegação administrativa"
        style={
          sidebarOpen
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '292px',
                height: '100vh',
                zIndex: 9999,
                background: '#111418',
              }
            : undefined
        }
      >
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

        <div className="admin-sidebar-header">
          <Link className="admin-brand" href="/admin" onClick={handleLinkClick}>
            <span>CDC</span>
            <strong>
              Operações
              <small>Copa dos Crias</small>
            </strong>
          </Link>
          <button
            type="button"
            className="admin-collapse-toggle"
            onClick={handleToggleCollapse}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} aria-hidden="true" />
          </button>
        </div>

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
      <main
        className="admin-main"
        style={
          sidebarOpen
            ? {
                position: 'relative',
                zIndex: 1,
              }
            : undefined
        }
      >
        {children}
      </main>
    </div>
  );
}
