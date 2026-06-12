import { requireAdminPage } from '@/lib/admin-auth';
import { listAdminAuditLogs } from '@/lib/admin-service';
import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/admin-ui';

function fmt(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value);
}

const entityLabels: Record<string, string> = {
  user: 'Usuário',
  league: 'Bolão',
  match: 'Partida',
  sync: 'Sync',
  password_reset_request: 'Senha',
};

export default async function AdminAuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requireAdminPage('audit:view');
  const params = await searchParams;
  const action = typeof params.action === 'string' ? params.action : '';
  const entityType = typeof params.entityType === 'string' ? params.entityType : '';
  const logs = await listAdminAuditLogs({ action, entityType });
  const uniqueActors = new Set(logs.map((log) => log.actor?.email || 'Sistema')).size;

  return (
    <section className="admin-stack">
      <AdminPageHeader
        eyebrow="Trilha operacional"
        title="Auditoria"
        description="Revise ações privilegiadas por tipo, ator e momento."
      >
        <form className="admin-filter" action="/admin/audit">
          <input name="action" defaultValue={action} placeholder="Ação" />
          <select name="entityType" defaultValue={entityType} aria-label="Tipo de entidade">
            <option value="">Todas</option>
            <option value="user">Usuário</option>
            <option value="league">Bolão</option>
            <option value="match">Partida</option>
            <option value="sync">Sync</option>
            <option value="password_reset_request">Senha</option>
          </select>
          <button className="admin-button secondary" type="submit">
            <i className="bi bi-funnel" aria-hidden="true" />
            Filtrar
          </button>
        </form>
      </AdminPageHeader>

      <div className="admin-grid compact">
        <AdminMetric icon="bi-activity" label="Eventos" value={logs.length} />
        <AdminMetric icon="bi-person-badge" label="Atores" value={uniqueActors} />
        <AdminMetric
          detail={entityType ? entityLabels[entityType] || entityType : 'Todos os tipos'}
          icon="bi-diagram-3"
          label="Entidade"
          value={entityType ? 1 : Object.keys(entityLabels).length}
        />
      </div>

      <AdminPanel description="Últimos 100 eventos que correspondem aos filtros atuais." title="Eventos">
        <div className="admin-table audit-table">
          {logs.map((log) => (
            <article className="admin-table-row audit-row" key={log.id}>
              <div>
                <strong>{log.summary}</strong>
                <small>{log.actor?.email || 'Sistema'}</small>
              </div>
              <AdminStatusBadge>{log.action}</AdminStatusBadge>
              <div className="admin-row-meta">
                <span>Entidade</span>
                <small>{entityLabels[log.entityType] || log.entityType}</small>
              </div>
              <time>{fmt(log.createdAt)}</time>
            </article>
          ))}
          {logs.length === 0 && (
            <AdminEmptyState
              description="Ajuste os filtros para localizar outros registros."
              icon="bi-shield-x"
              title="Nenhum evento encontrado"
            />
          )}
        </div>
      </AdminPanel>
    </section>
  );
}
