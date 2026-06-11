import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin-auth';
import { getAdminDashboardData } from '@/lib/admin-service';

function formatDate(value: Date | null | undefined) {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

export default async function AdminDashboardPage() {
  await requireAdminPage('dashboard:view');
  const data = await getAdminDashboardData();

  return (
    <section className="admin-stack">
      <header className="admin-page-head">
        <div>
          <p>Centro de operacoes</p>
          <h1>Painel administrativo</h1>
        </div>
        <Link className="admin-button secondary" href="/dashboard">
          Abrir app
        </Link>
      </header>

      <div className="admin-grid metrics">
        <Link className="admin-metric" href="/admin/users">
          <span>Usuarios</span>
          <strong>{data.users.total}</strong>
          <small>{data.users.restricted} restritos</small>
        </Link>
        <Link className="admin-metric" href="/admin/leagues">
          <span>Boloes</span>
          <strong>{data.leagues.total}</strong>
          <small>{data.leagues.active} ativos</small>
        </Link>
        <Link className="admin-metric" href="/admin/matches">
          <span>Partidas</span>
          <strong>{data.matches.total}</strong>
          <small>{data.matches.live} ao vivo</small>
        </Link>
        <Link className="admin-metric urgent" href="/admin/resets">
          <span>Redefinicoes</span>
          <strong>{data.pendingResets}</strong>
          <small>pendentes</small>
        </Link>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2>Saude da API</h2>
          <Link href="/admin/matches">Ver partidas</Link>
        </div>
        <div className="admin-health">
          <span className={`admin-status-dot ${data.staleSync ? 'danger' : 'ok'}`} />
          <div>
            <strong>{data.staleSync ? 'Sincronizacao ausente ou antiga' : 'Sincronizacao recente'}</strong>
            <p>
              Ultima sync: {formatDate(data.latestSync?.syncedAt)}. Criadas:{' '}
              {data.latestSync?.matchesCreated ?? 0}, atualizadas:{' '}
              {data.latestSync?.matchesUpdated ?? 0}.
            </p>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2>Auditoria recente</h2>
          <Link href="/admin/audit">Ver tudo</Link>
        </div>
        <div className="admin-list">
          {data.recentAudit.length === 0 ? (
            <p className="admin-empty">Nenhuma acao administrativa registrada.</p>
          ) : (
            data.recentAudit.map((entry) => (
              <article className="admin-list-row" key={entry.id}>
                <div>
                  <strong>{entry.summary}</strong>
                  <small>{entry.actor?.email || 'Sistema'} · {entry.action}</small>
                </div>
                <time>{formatDate(entry.createdAt)}</time>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
