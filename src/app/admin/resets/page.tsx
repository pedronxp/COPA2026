import { requireAdminPage } from '@/lib/admin-auth';
import { listPasswordResetRequests } from '@/lib/admin-service';
import { decideResetAction } from '@/app/admin/actions';

function fmt(value: Date | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value);
}

export default async function AdminResetsPage({ searchParams }: PageProps<'/admin/resets'>) {
  await requireAdminPage('resets:manage');
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : 'pending';
  const requests = await listPasswordResetRequests(status);

  return (
    <section className="admin-stack">
      <header className="admin-page-head">
        <div>
          <p>Suporte</p>
          <h1>Redefinicao de senha</h1>
        </div>
        <form className="admin-filter" action="/admin/resets">
          <select name="status" defaultValue={status} aria-label="Filtrar status">
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="all">Todas</option>
          </select>
          <button className="admin-button secondary" type="submit">Filtrar</button>
        </form>
      </header>

      <div className="admin-panel">
        <div className="admin-table">
          {requests.map((request) => (
            <article className="admin-table-row reset-row" key={request.id}>
              <div>
                <strong>{request.user.name || 'Usuario'}</strong>
                <small>{request.user.email}</small>
              </div>
              <span className={`admin-badge ${request.status}`}>{request.status}</span>
              <time>{fmt(request.createdAt)}</time>
              <small>{request.reviewedBy?.email || '-'}</small>
              {request.status === 'pending' ? (
                <form className="admin-inline-form" action={decideResetAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input name="reason" placeholder="Motivo" required minLength={3} />
                  <button className="admin-icon-button ok" name="action" value="approve" title="Aprovar">
                    <i className="bi bi-check-lg" aria-hidden="true" />
                  </button>
                  <button className="admin-icon-button danger" name="action" value="reject" title="Rejeitar">
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <small>{request.reviewNote || '-'}</small>
              )}
            </article>
          ))}
          {requests.length === 0 && <p className="admin-empty">Nenhuma solicitacao encontrada.</p>}
        </div>
      </div>
    </section>
  );
}
