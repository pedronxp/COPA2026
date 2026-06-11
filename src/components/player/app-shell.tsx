'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { SessionUser } from '@/lib/session';
import type { ActiveLeagueContext } from '@/lib/active-league';
import {
  playerNavigationItems,
  playerNavHref,
  type PlayerRoute,
} from '@/lib/player-navigation';
import { isAdminRole } from '@/lib/admin-domain';
import { ActiveLeagueSwitcher } from './active-league-switcher';

interface PlayerAppShellProps {
  activeRoute: PlayerRoute;
  user: SessionUser;
  leagueContext: ActiveLeagueContext;
  children: ReactNode;
}

export function PlayerAppShell({
  activeRoute,
  user,
  leagueContext,
  children,
}: PlayerAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isCreatingLeague = pathname === '/leagues/create';
  const { activeLeague, options, fallbackReason } = leagueContext;
  const primaryMobileItems = playerNavigationItems.filter((item) => item.mobilePrimary);
  const secondaryMobileItems = playerNavigationItems.filter((item) => !item.mobilePrimary);
  const hasActiveSecondaryItem = secondaryMobileItems.some((item) => item.route === activeRoute);
  const canAccessAdmin = isAdminRole(user.adminRole);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('authenticatedUser');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="player-app-shell">
      <aside className="player-sidebar">
        <Link href="/dashboard" className="player-brand" aria-label="Copa dos Crias">
          <div className="player-brand-logo">
            <i className="bi bi-trophy-fill" aria-hidden="true" />
          </div>
          <div className="player-brand-text">
            <span>Copa dos Crias</span>
            <small>Bolão 2026</small>
          </div>
        </Link>

        <nav className="player-nav" aria-label="Navegação principal">
          {playerNavigationItems.map((item) => (
            <Link
              key={item.route}
              href={playerNavHref(item, activeLeague.slug)}
              className={item.route === activeRoute ? 'active' : ''}
              title={item.label}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="player-sidebar-user">
          <span className="user-avatar">{user.image || user.name?.slice(0, 1) || 'U'}</span>
          <div className="user-meta">
            <strong>{user.name || 'Torcedor'}</strong>
            <small>{user.email}</small>
          </div>
          <button
            onClick={handleLogout}
            className="player-logout-btn"
            title="Sair"
            aria-label="Sair da conta"
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
          </button>
        </div>
        {canAccessAdmin && (
          <Link className="player-admin-link" href="/admin" title="Painel administrativo">
            <i className="bi bi-shield-lock-fill" aria-hidden="true" />
            <span>Admin</span>
          </Link>
        )}
      </aside>

      <div className="player-main">
        <header className="player-topbar">
          <div>
            {activeRoute !== 'leagues' && (
              <>
                <span className="player-kicker">Copa do Mundo 2026</span>
                <h1>{activeLeague.name}</h1>
              </>
            )}
          </div>
          {!isCreatingLeague && (
            <ActiveLeagueSwitcher options={options} activeLeagueId={activeLeague.id} />
          )}
        </header>

        {fallbackReason && (
          <div className="player-alert" role="status">
            <i className="bi bi-info-circle" aria-hidden="true" />
            {fallbackReason} Usando o Bolão Global.
          </div>
        )}

        <main>{children}</main>
      </div>

      <nav className="player-mobile-nav" aria-label="Navegação mobile">
        {primaryMobileItems.map((item) => (
          <Link
            key={item.route}
            href={playerNavHref(item, activeLeague.slug)}
            className={item.route === activeRoute ? 'active' : ''}
            title={item.label}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.mobileLabel}</span>
          </Link>
        ))}
        <details className={`player-mobile-more ${hasActiveSecondaryItem ? 'active' : ''}`}>
          <summary aria-label="Mais opções">
            <i className="bi bi-three-dots" aria-hidden="true" />
            <span>Mais</span>
          </summary>
          <div className="player-mobile-more-menu">
            {canAccessAdmin && (
              <Link href="/admin">
                <i className="bi bi-shield-lock-fill" aria-hidden="true" />
                <span>Admin</span>
              </Link>
            )}
            {secondaryMobileItems.map((item) => (
              <Link
                key={item.route}
                href={playerNavHref(item, activeLeague.slug)}
                className={item.route === activeRoute ? 'active' : ''}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </details>
      </nav>
    </div>
  );
}
