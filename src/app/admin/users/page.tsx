import { requireAdminPage } from '@/lib/admin-auth';
import { searchAdminUsers } from '@/lib/admin-service';
import { deleteUsersBatchAction, moderateUserAction } from '@/app/admin/actions';
import { DeleteUserForm } from '@/components/admin/delete-user-form';
import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/admin-ui';

function fmt(value: Date | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value);
}

const accountStatusLabels: Record<string, string> = {
  active: 'Ativo',
  blocked: 'Bloqueado',
  suspended: 'Suspenso',
  banned: 'Banido',
};

function adminRoleLabel(role: string) {
  if (role === 'none') return 'Sem admin';
  if (role === 'super_admin') return 'Super admin';
  return role;
}

export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const actor = await requireAdminPage('users:moderate');
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const users = await searchAdminUsers(q);
  const restrictedUsers = users.filter((user) => user.accountStatus !== 'active').length;
  const adminUsers = users.filter((user) => user.adminRole !== 'none').length;
  const deletableUsers = users.filter(
    (user) =>
      user.id !== actor.id &&
      user.id !== 'system' &&
      user.adminRole === 'none',
  );

  return (
    <section className="admin-stack">
      <AdminPageHeader
        eyebrow="Moderação"
        title="Usuários"
        description="Busque contas, aplique restrições e remova usuários comuns com motivo auditável."
      >
        <form className="admin-filter" action="/admin/users">
          <input name="q" defaultValue={q} placeholder="Buscar nome ou e-mail" />
          <button className="admin-button secondary" type="submit">
            <i className="bi bi-search" aria-hidden="true" />
            Buscar
          </button>
        </form>
      </AdminPageHeader>

      <div className="admin-grid compact">
        <AdminMetric icon="bi-people" label="Resultado" value={users.length} />
        <AdminMetric
          icon="bi-person-lock"
          label="Restritos"
          tone={restrictedUsers > 0 ? 'warning' : 'ok'}
          value={restrictedUsers}
        />
        <AdminMetric icon="bi-shield-lock" label="Admins" value={adminUsers} />
        <AdminMetric icon="bi-trash3" label="Elegíveis para exclusão" tone="danger" value={deletableUsers.length} />
      </div>

      <AdminPanel
        className="admin-danger-zone"
        description="Disponível apenas para contas sem permissão administrativa e sem proteções especiais."
        title="Exclusão em lote"
      >
        <form className="admin-batch-form" action={deleteUsersBatchAction}>
          <div className="admin-selection-list">
            {deletableUsers.map((user) => (
              <label key={user.id}>
                <input type="checkbox" name="userIds" value={user.id} />
                <span>
                  <strong>{user.name || 'Usuário'}</strong>
                  <small>{user.email}</small>
                </span>
              </label>
            ))}
            {deletableUsers.length === 0 && (
              <AdminEmptyState
                description="A busca atual não possui contas comuns elegíveis."
                icon="bi-shield-lock"
                title="Nada para excluir"
              />
            )}
          </div>
          <div className="admin-form-footer">
            <label className="admin-field">
              <span>Motivo da exclusão</span>
              <input name="reason" required minLength={3} placeholder="Motivo único para todo o lote" />
            </label>
            <button className="admin-button danger" type="submit">
              <i className="bi bi-trash3" aria-hidden="true" />
              Excluir selecionados
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel description="Ações de moderação revogam sessões ativas quando aplicável." title="Contas">
        <div className="admin-table user-table">
          {users.map((user) => (
            <article className="admin-table-row user-row" key={user.id}>
              <div>
                <strong>{user.name || 'Usuário'}</strong>
                <small>{user.email}</small>
              </div>
              <AdminStatusBadge status={user.accountStatus}>
                {accountStatusLabels[user.accountStatus] || user.accountStatus}
              </AdminStatusBadge>
              <div className="admin-row-meta">
                <span>Acesso</span>
                <small>{adminRoleLabel(user.adminRole)}</small>
              </div>
              <div className="admin-row-meta">
                <span>Atividade</span>
                <small>{user._count.predictions} palpites / {user._count.leaguesJoined} bolões</small>
              </div>
              <div className="admin-row-meta">
                <span>Suspenso até</span>
                <small>{fmt(user.suspendedUntil)}</small>
              </div>
              <div className="admin-action-group">
                <form className="admin-action-form user-moderation-form" action={moderateUserAction}>
                  <input type="hidden" name="targetUserId" value={user.id} />
                  <select name="accountStatus" defaultValue={user.accountStatus} aria-label="Status da conta">
                    <option value="active">Ativo</option>
                    <option value="blocked">Bloqueado</option>
                    <option value="suspended">Suspenso</option>
                    <option value="banned">Banido</option>
                  </select>
                  <input name="suspendedDays" type="number" min={1} defaultValue={7} aria-label="Dias suspenso" />
                  <input name="reason" placeholder="Motivo" required minLength={3} />
                  <button className="admin-icon-button" aria-label="Aplicar moderação" title="Aplicar" type="submit">
                    <i className="bi bi-save" aria-hidden="true" />
                  </button>
                </form>
                {user.id !== actor.id && user.id !== 'system' && user.adminRole === 'none' && (
                  <DeleteUserForm userId={user.id} userName={user.name || ''} userEmail={user.email} />
                )}
              </div>
            </article>
          ))}
          {users.length === 0 && (
            <AdminEmptyState
              description="Tente outro nome, e-mail ou limpe o filtro."
              icon="bi-person-x"
              title="Nenhum usuário encontrado"
            />
          )}
        </div>
      </AdminPanel>
    </section>
  );
}
