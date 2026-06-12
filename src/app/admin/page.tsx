import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin-auth';
import { getAdminDashboardData } from '@/lib/admin-service';
import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/admin-ui';

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

  const syncDetail = [
    `Ultima sync: ${formatDate(data.latestSync?.syncedAt)}`,
    `${data.latestSync?.matchesCreated ?? 0} criadas`,
    `${data.latestSync?.matchesUpdated ?? 0} atualizadas`,
  ].join(' / ');

  return (
    <section className="admin-stack">
      <AdminPageHeader
        eyebrow="Centro de operacoes"
        title="Painel administrativo"
        description="Visao consolidada de suporte, moderacao, competicao e integridade."
      >
        <Link className="admin-button secondary" href="/dashboard">
          <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
          Abrir app
        </Link>
      </AdminPageHeader>

      <div className="admin-grid metrics">
        <AdminMetric
          detail={`${data.users.restricted} restritos`}
          href="/admin/users"
          icon="bi-people"
          label="Usuarios"
          value={data.users.total}
        />
        <AdminMetric
          detail={`${data.leagues.active} ativos`}
          href="/admin/leagues"
          icon="bi-trophy"
          label="Boloes"
          value={data.leagues.total}
        />
        <AdminMetric
          detail={`${data.matches.live} ao vivo / ${data.matches.finished} finalizadas`}
          href="/admin/matches"
          icon="bi-broadcast"
          label="Partidas"
          value={data.matches.total}
        />
        <AdminMetric
          detail="pedidos pendentes"
          href="/admin/resets"
          icon="bi-key"
          label="Redefinicoes"
          tone={data.pendingResets > 0 ? 'danger' : 'ok'}
          value={data.pendingResets}
        />
      </div>

      <div className="admin-two-column">
        <AdminPanel
          action={
            <AdminStatusBadge status={data.apiHealth.tone}>
              {data.apiHealth.state}
            </AdminStatusBadge>
          }
          description={data.apiHealth.detail}
          title="Saude da API"
        >
          <div className="admin-health admin-health-card">
            <span className={`admin-status-dot ${data.apiHealth.tone}`} />
            <div>
              <strong>{data.apiHealth.title}</strong>
              <p>{syncDetail}</p>
              <p>
                Agendamento {data.syncSchedule.enabled ? 'ativo' : 'desativado'} a cada{' '}
                {data.syncSchedule.intervalMinutes} minutos. Proxima:{' '}
                {formatDate(data.syncSchedule.nextRunAt)}.
              </p>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          action={<Link href="/admin/audit">Ver tudo</Link>}
          description={`${data.predictions} palpites registrados na plataforma`}
          title="Atividade operacional"
        >
          <div className="admin-quick-actions">
            <Link href="/admin/resets">
              <i className="bi bi-key" aria-hidden="true" />
              <span>Revisar solicitacoes</span>
            </Link>
            <Link href="/admin/users">
              <i className="bi bi-person-lock" aria-hidden="true" />
              <span>Moderacao de usuarios</span>
            </Link>
            <Link href="/admin/matches">
              <i className="bi bi-arrow-repeat" aria-hidden="true" />
              <span>Sincronizacao e placares</span>
            </Link>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel action={<Link href="/admin/audit">Ver tudo</Link>} title="Auditoria recente">
        <div className="admin-list">
          {data.recentAudit.length === 0 ? (
            <AdminEmptyState
              description="As acoes privilegiadas aparecerao aqui assim que forem executadas."
              icon="bi-shield-check"
              title="Nenhum evento registrado"
            />
          ) : (
            data.recentAudit.map((entry) => (
              <article className="admin-list-row" key={entry.id}>
                <div>
                  <strong>{entry.summary}</strong>
                  <small>{entry.actor?.email || 'Sistema'} / {entry.action}</small>
                </div>
                <time>{formatDate(entry.createdAt)}</time>
              </article>
            ))
          )}
        </div>
      </AdminPanel>
    </section>
  );
}
