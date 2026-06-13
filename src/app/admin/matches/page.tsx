import { requireAdminPage } from '@/lib/admin-auth';
import { getMatchOperationsData } from '@/lib/admin-service';
import {
  configureSyncAction,
  correctMatchAction,
  triggerSyncAction,
} from '@/app/admin/actions';
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
  scheduled: 'Agendada',
  live: 'Ao vivo',
  finished: 'Finalizada',
};

export default async function AdminMatchesPage() {
  await requireAdminPage('matches:operate');
  const data = await getMatchOperationsData();

  return (
    <section className="admin-stack">
      <AdminPageHeader
        eyebrow="API e placares"
        title="Partidas"
        description="Monitore sincronização, ajuste agenda automática e corrija placares com auditoria."
      >
        <form action={triggerSyncAction}>
          <button className="admin-button" type="submit">
            <i className="bi bi-arrow-repeat" aria-hidden="true" />
            Sincronizar agora
          </button>
        </form>
      </AdminPageHeader>

      <div className="admin-grid compact">
        {data.statusCounts.map((item) => (
          <AdminMetric
            icon={item.status === 'live' ? 'bi-broadcast' : 'bi-calendar-event'}
            key={item.status}
            label={statusLabels[item.status] || item.status}
            tone={item.status === 'live' ? 'warning' : 'default'}
            value={item._count.status}
          />
        ))}
      </div>

      <div className="admin-two-column">
        <AdminPanel
          action={
            <AdminStatusBadge status={data.apiHealth.tone}>
              {data.apiHealth.state}
            </AdminStatusBadge>
          }
          description={data.apiHealth.detail}
          title="Sincronização automática"
        >
          <form className="admin-schedule-form" action={configureSyncAction}>
            <label className="admin-toggle">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={data.syncSchedule.enabled}
              />
              <span>Agendamento ativo</span>
            </label>
            <label className="admin-field">
              <span>Intervalo</span>
              <select
                name="intervalMinutes"
                defaultValue={data.syncSchedule.intervalMinutes}
              >
                <option value={5}>5 minutos</option>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={180}>3 horas</option>
                <option value={360}>6 horas</option>
                <option value={720}>12 horas</option>
                <option value={1440}>24 horas</option>
              </select>
            </label>
            <div className="admin-schedule-meta">
              <small>Próxima: {fmt(data.syncSchedule.nextRunAt)}</small>
              <small>Último sucesso: {fmt(data.syncSchedule.lastSuccessAt)}</small>
            </div>
            <button className="admin-button secondary" type="submit">
              <i className="bi bi-calendar-check" aria-hidden="true" />
              Salvar
            </button>
          </form>
        </AdminPanel>

        <AdminPanel description="Últimos eventos da fonte externa e fallback." title="Histórico de sync">
          <div className="admin-list compact-list">
            {data.syncLogs.slice(0, 5).map((log) => (
              <article className="admin-list-row" key={log.id}>
                <div>
                  <strong>{log.source} / {log.status}</strong>
                  <small>{log.matchesCreated} criadas / {log.matchesUpdated} atualizadas</small>
                  <small>{log.trigger}{log.durationMs ? ` / ${log.durationMs} ms` : ''}</small>
                  {log.error && <small className="admin-error-text">{log.error}</small>}
                </div>
                <time>{fmt(log.syncedAt)}</time>
              </article>
            ))}
            {data.syncLogs.length === 0 && (
              <AdminEmptyState
                description="A próxima sincronização registrada aparecerá aqui."
                icon="bi-cloud-arrow-down"
                title="Nenhuma sync registrada"
              />
            )}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel
        description="Use correções manuais apenas quando a fonte estiver atrasada ou incorreta."
        title="Correções de partidas"
      >
        <div className="admin-table match-table">
          {data.matches.map((match) => (
            <article className="admin-table-row match-row" key={match.id}>
              <div>
                <strong>{match.homeTeam} x {match.awayTeam}</strong>
                <small>{fmt(match.kickOff)} / {match._count.predictions} palpites</small>
              </div>
              <AdminStatusBadge status={match.status}>{statusLabels[match.status] || match.status}</AdminStatusBadge>
              <form className="admin-action-form match-correction-form" action={correctMatchAction}>
                <input type="hidden" name="matchId" value={match.id} />
                <input
                  name="homeScore"
                  type="number"
                  min={0}
                  max={99}
                  defaultValue={match.homeScore ?? 0}
                  aria-label="Placar mandante"
                />
                <input
                  name="awayScore"
                  type="number"
                  min={0}
                  max={99}
                  defaultValue={match.awayScore ?? 0}
                  aria-label="Placar visitante"
                />
                <select name="status" defaultValue={match.status} aria-label="Status da partida">
                  <option value="scheduled">Agendada</option>
                  <option value="live">Ao vivo</option>
                  <option value="finished">Finalizada</option>
                </select>
                <input name="reason" placeholder="Motivo" required minLength={3} />
                <button className="admin-icon-button" aria-label="Corrigir partida" title="Corrigir" type="submit">
                  <i className="bi bi-save" aria-hidden="true" />
                </button>
              </form>
            </article>
          ))}
          {data.matches.length === 0 && (
            <AdminEmptyState
              description="Sincronize a API para carregar partidas operacionais."
              icon="bi-calendar-x"
              title="Nenhuma partida encontrada"
            />
          )}
        </div>
      </AdminPanel>
    </section>
  );
}
