import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin-auth';

const navItems = [
  { href: '/admin', label: 'Visao geral', icon: 'bi-speedometer2' },
  { href: '/admin/resets', label: 'Solicitacoes', icon: 'bi-key' },
  { href: '/admin/users', label: 'Usuarios', icon: 'bi-people' },
  { href: '/admin/leagues', label: 'Boloes', icon: 'bi-trophy' },
  { href: '/admin/matches', label: 'API e partidas', icon: 'bi-broadcast' },
  { href: '/admin/audit', label: 'Auditoria', icon: 'bi-shield-check' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage('dashboard:view');

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navegacao administrativa">
        <Link className="admin-brand" href="/admin">
          <span>CDC</span>
          <strong>Operacoes</strong>
        </Link>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-identity">
          <small>{user.adminRole}</small>
          <strong>{user.name || user.email}</strong>
          <Link href="/dashboard">Voltar ao app</Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
