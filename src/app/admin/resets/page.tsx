import { requireAdminPage } from '@/lib/admin-auth';
import { listPasswordResetRequests } from '@/lib/admin-service';
import { decideResetAction } from '@/app/admin/actions';
import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/admin-ui';

function fmt(value: Date | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value);
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  all: 'Todas',
};

export default async function AdminResetsPage({ searchParams }: PageProps<'/admin/resets'>) {
  await requireAdminPage('resets:manage');
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : 'pending';
  const requests = await listPasswordResetRequests(status);
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  return (
    <section className="admin-stack">
      <AdminPageHeader
        eyebrow="Suporte"
        title="Redefinicao de senha"
        description="Analise pedidos, registre motivo e mantenha rastro de aprovacao."
      >
        <form className="admin-filter" action="/admin/resets">
          <select name="status" defaultValue={status} aria-label="Filtrar status">
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="all">Todas</option>
          </select>
          <button className="admin-button secondary" type="submit">
            <i className="bi bi-funnel" aria-hidden="true" />
            Filtrar
          </button>
        </form>
      </AdminPageHeader>

      <div className="admin-grid compact">
        <AdminMetric
          icon="bi-hourglass-split"
          label="Pendentes na visao"
          tone={pendingCount > 0 ? 'warning' : 'ok'}
          value={pendingCount}
        />
        <AdminMetric
          detail={statusLabels[status] || status}
          icon="bi-list-check"
          label="Itens carregados"
          value={requests.length}
        />
      </div>

      <AdminPanel
        description="A aprovacao troca a senha proposta; a rejeicao preserva o acesso atual."
        title="Fila de revisao"
      >
        <div className="admin-table reset-table">
          {requests.map((request) => (
            <article className="admin-table-row reset-row" key={request.id}>
              <div>
                <strong>{request.user.name || 'Usuario'}</strong>
                <small>{request.user.email}</small>
              </div>
              <AdminStatusBadge status={request.status}>{statusLabels[request.status] || request.status}</AdminStatusBadge>
              <div className="admin-row-meta">
                <span>Criado</span>
                <time>{fmt(request.createdAt)}</time>
              </div>
              <div className="admin-row-meta">
                <span>Revisor</span>
                <small>{request.reviewedBy?.email || '-'}</small>
              </div>
              {request.status === 'pending' ? (
                <form className="admin-action-form reset-action-form" action={decideResetAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input name="reason" placeholder="Motivo da decisao" required minLength={3} />
                  <div className="admin-action-buttons">
                    <button className="admin-icon-button ok" name="action" value="approve" title="Aprovar" type="submit">
                      <i className="bi bi-check-lg" aria-hidden="true" />
                    </button>
                    <button className="admin-icon-button danger" name="action" value="reject" title="Rejeitar" type="submit">
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="admin-review-note">
                  <span>Nota</span>
                  <small>{request.reviewNote || '-'}</small>
                </div>
              )}
            </article>
          ))}
          {requests.length === 0 && (
            <AdminEmptyState
              description="Ajuste o filtro ou aguarde novas solicitacoes de usuarios."
              icon="bi-inbox"
              title="Nenhuma solicitacao encontrada"
            />
          )}
        </div>
      </AdminPanel>
    </section>
  );
}
