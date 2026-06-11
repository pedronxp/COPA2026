import { requireAdminPage } from '@/lib/admin-auth';
import { listAdminAuditLogs } from '@/lib/admin-service';

function fmt(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value);
}

export default async function AdminAuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requireAdminPage('audit:view');
  const params = await searchParams;
  const action = typeof params.action === 'string' ? params.action : '';
  const entityType = typeof params.entityType === 'string' ? params.entityType : '';
  const logs = await listAdminAuditLogs({ action, entityType });

  return (
    <section className="admin-stack">
      <header className="admin-page-head">
        <div>
          <p>Trilha operacional</p>
          <h1>Auditoria</h1>
        </div>
        <form className="admin-filter" action="/admin/audit">
          <input name="action" defaultValue={action} placeholder="Acao" />
          <select name="entityType" defaultValue={entityType} aria-label="Tipo de entidade">
            <option value="">Todas</option>
            <option value="user">Usuario</option>
            <option value="league">Bolao</option>
            <option value="match">Partida</option>
            <option value="sync">Sync</option>
            <option value="password_reset_request">Senha</option>
          </select>
          <button className="admin-button secondary" type="submit">Filtrar</button>
        </form>
      </header>

      <div className="admin-panel">
        <div className="admin-table">
          {logs.map((log) => (
            <article className="admin-table-row audit-row" key={log.id}>
              <div>
                <strong>{log.summary}</strong>
                <small>{log.actor?.email || 'Sistema'}</small>
              </div>
              <span className="admin-badge">{log.action}</span>
              <small>{log.entityType}</small>
              <time>{fmt(log.createdAt)}</time>
            </article>
          ))}
          {logs.length === 0 && <p className="admin-empty">Nenhum evento encontrado.</p>}
        </div>
      </div>
    </section>
  );
}
