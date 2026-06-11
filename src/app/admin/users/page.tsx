import { requireAdminPage } from '@/lib/admin-auth';
import { searchAdminUsers } from '@/lib/admin-service';
import { deleteUsersBatchAction, moderateUserAction } from '@/app/admin/actions';
import { DeleteUserForm } from '@/components/admin/delete-user-form';

function fmt(value: Date | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value);
}

export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const actor = await requireAdminPage('users:moderate');
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const users = await searchAdminUsers(q);
  const deletableUsers = users.filter(
    (user) =>
      user.id !== actor.id &&
      user.id !== 'system' &&
      user.adminRole === 'none',
  );

  return (
    <section className="admin-stack">
      <header className="admin-page-head">
        <div>
          <p>Moderacao</p>
          <h1>Usuarios</h1>
        </div>
        <form className="admin-filter" action="/admin/users">
          <input name="q" defaultValue={q} placeholder="Buscar nome ou e-mail" />
          <button className="admin-button secondary" type="submit">Buscar</button>
        </form>
      </header>

      <form className="admin-panel admin-batch-form" action={deleteUsersBatchAction}>
        <div className="admin-panel-head">
          <div>
            <h2>Excluir usuarios em lote</h2>
            <p>Selecione contas sem permissao administrativa e sem boloes proprios.</p>
          </div>
          <button className="admin-button danger" type="submit">
            <i className="bi bi-trash3" aria-hidden="true" /> Excluir selecionados
          </button>
        </div>
        <div className="admin-selection-list">
          {deletableUsers.map((user) => (
            <label key={user.id}>
              <input type="checkbox" name="userIds" value={user.id} />
              <span>
                <strong>{user.name || 'Usuario'}</strong>
                <small>{user.email}</small>
              </span>
            </label>
          ))}
          {deletableUsers.length === 0 && (
            <p className="admin-empty">Nenhum usuario elegivel nesta busca.</p>
          )}
        </div>
        <label className="admin-field">
          <span>Motivo da exclusao</span>
          <input name="reason" required minLength={3} placeholder="Motivo unico para todo o lote" />
        </label>
      </form>

      <div className="admin-panel">
        <div className="admin-table">
          {users.map((user) => (
            <article className="admin-table-row user-row" key={user.id}>
              <div>
                <strong>{user.name || 'Usuario'}</strong>
                <small>{user.email}</small>
              </div>
              <span className={`admin-badge ${user.accountStatus}`}>{user.accountStatus}</span>
              <small>{user.adminRole}</small>
              <small>{user._count.predictions} palpites · {user._count.leaguesJoined} boloes</small>
              <small>{fmt(user.suspendedUntil)}</small>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <form className="admin-inline-form" action={moderateUserAction}>
                  <input type="hidden" name="targetUserId" value={user.id} />
                  <select name="accountStatus" defaultValue={user.accountStatus} aria-label="Status da conta">
                    <option value="active">Ativo</option>
                    <option value="blocked">Bloqueado</option>
                    <option value="suspended">Suspenso</option>
                    <option value="banned">Banido</option>
                  </select>
                  <input name="suspendedDays" type="number" min={1} defaultValue={7} aria-label="Dias suspenso" />
                  <input name="reason" placeholder="Motivo" required minLength={3} />
                  <button className="admin-icon-button" title="Aplicar">
                    <i className="bi bi-save" aria-hidden="true" />
                  </button>
                </form>
                {user.id !== actor.id && user.id !== 'system' && user.adminRole === 'none' && (
                  <DeleteUserForm userId={user.id} userName={user.name || ''} userEmail={user.email} />
                )}
              </div>
            </article>
          ))}
          {users.length === 0 && <p className="admin-empty">Nenhum usuario encontrado.</p>}
        </div>
      </div>
    </section>
  );
}
