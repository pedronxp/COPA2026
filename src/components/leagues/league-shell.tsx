'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/session';

const navigation = [
  { href: '/dashboard', icon: 'house-door-fill', label: 'Home', mobileLabel: 'Home' },
  { href: '/matches', icon: 'lightning-charge-fill', label: 'Dar Palpites', mobileLabel: 'Palpites' },
  { href: '/results', icon: 'clipboard-data-fill', label: 'Resultados', mobileLabel: 'Resultados' },
  { href: '/calendar', icon: 'calendar-event-fill', label: 'Tabela / Grupos', mobileLabel: 'Tabela' },
  { href: '/leaderboard', icon: 'trophy-fill', label: 'Ranking Geral', mobileLabel: 'Ranking' },
  { href: '/leagues', icon: 'people-fill', label: 'Bolões', mobileLabel: 'Bolões' },
  { href: '/history', icon: 'clock-history', label: 'Seus Palpites', mobileLabel: 'Histórico' },
];

export function LeagueShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('authenticatedUser');
    router.replace('/login');
  };

  return (
    <div className="d-flex flex-column h-100 min-vh-100 league-app-shell">
      {/* 1. Barra de Topo Geral */}
      <header className="premium-header sticky-top px-3 py-2 shadow-sm">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-1">
            <span className="fs-4 fw-extrabold text-white tracking-wide d-flex align-items-center gap-2 logo-glow" style={{ letterSpacing: '0.5px' }}>
              Copa 2026
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Usuário autenticado */}
            <div className="d-flex align-items-center bg-dark bg-opacity-40 border border-secondary border-opacity-30 rounded-pill p-1 shadow-sm">
              <span className="text-secondary d-none d-md-inline ps-2 me-2" style={{ fontSize: '0.65rem', fontWeight: '700' }}>
                <i className="bi bi-person-check-fill me-1"></i> LOGADO:
              </span>
              <span className="text-white fw-bold text-truncate pe-2" style={{ fontSize: '0.75rem', maxWidth: '140px' }}>
                {user.image} {user.name?.split(' ')[0]}
              </span>
            </div>

            {/* Pontos do Jogador Atual */}
            <div className="glass-card px-3 py-1 d-flex align-items-center gap-2 border-0 shadow-sm"
                 style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(8, 12, 20, 0.6) 100%)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '20px' }}>
              <span className="fs-5">{user.image || '👑'}</span>
              <div className="d-flex flex-column text-start">
                <span className="text-secondary" style={{ fontSize: '0.55rem', lineHeight: 1, fontWeight: '700' }}>SEUS PONTOS</span>
                <span className="text-info fw-bold font-monospace" style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>{user.points || 0} PTS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Layout Principal Responsivo */}
      <div className="desktop-layout flex-grow-1">
        {/* SIDEBAR DO DESKTOP (Apenas visível em telas >= 768px) */}
        <aside className="desktop-sidebar">
          <div className="desktop-sidebar-nav">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`desktop-sidebar-item ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <i className={`bi bi-${item.icon}`}></i>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Rodapé da Sidebar */}
          <div className="pt-3 border-top border-secondary border-opacity-25 text-start desktop-sidebar-footer d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.25rem' }}>{user.image || '⚽'}</span>
              <div className="min-w-0" style={{ maxWidth: '140px' }}>
                <div className="text-white fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>{user.name}</div>
                <div className="text-secondary text-truncate" style={{ fontSize: '0.65rem' }}>{user.email}</div>
              </div>
            </div>
            <button 
              className="btn btn-outline-danger btn-sm w-100 py-1"
              style={{ borderRadius: '6px', fontSize: '0.75rem' }}
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1"></i> Sair
            </button>
            <div className="text-secondary mt-1" style={{ fontSize: '0.65rem' }}>Copa de 2026 🌎</div>
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <main className="desktop-content pb-5 mb-5 flex-grow-1">
          {children}
        </main>
      </div>

      {/* 3. Navegação Inferior (Mobile-Only) */}
      <nav className="mobile-nav-bar d-flex justify-content-between align-items-center px-2">
        {navigation.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item border-0 bg-transparent ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <i className={`bi bi-${item.icon}`}></i>
              <span>{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

