import { requireAdminPage } from '@/lib/admin-auth';
import { searchAdminUsers } from '@/lib/admin-service';
import { moderateUserAction } from '@/app/admin/actions';

function fmt(value: Date | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value);
}

export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  await requireAdminPage('users:moderate');
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const users = await searchAdminUsers(q);

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
            </article>
          ))}
          {users.length === 0 && <p className="admin-empty">Nenhum usuario encontrado.</p>}
        </div>
      </div>
    </section>
  );
}
