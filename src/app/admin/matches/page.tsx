import { requireAdminPage } from '@/lib/admin-auth';
import { getMatchOperationsData } from '@/lib/admin-service';
import { correctMatchAction, triggerSyncAction } from '@/app/admin/actions';

function fmt(value: Date | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value);
}

export default async function AdminMatchesPage() {
  await requireAdminPage('matches:operate');
  const data = await getMatchOperationsData();

  return (
    <section className="admin-stack">
      <header className="admin-page-head">
        <div>
          <p>API e placares</p>
          <h1>Partidas</h1>
        </div>
        <form action={triggerSyncAction}>
          <button className="admin-button" type="submit">
            <i className="bi bi-arrow-repeat" aria-hidden="true" /> Sincronizar agora
          </button>
        </form>
      </header>

      <div className="admin-grid compact">
        {data.statusCounts.map((item) => (
          <div className="admin-metric" key={item.status}>
            <span>{item.status}</span>
            <strong>{item._count.status}</strong>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2>Ultimas sincronizacoes</h2>
        </div>
        <div className="admin-list">
          {data.syncLogs.map((log) => (
            <article className="admin-list-row" key={log.id}>
              <div>
                <strong>{log.source}</strong>
                <small>{log.matchesCreated} criadas · {log.matchesUpdated} atualizadas</small>
              </div>
              <time>{fmt(log.syncedAt)}</time>
            </article>
          ))}
          {data.syncLogs.length === 0 && <p className="admin-empty">Nenhuma sync registrada.</p>}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2>Correcoes de partidas</h2>
        </div>
        <div className="admin-table">
          {data.matches.map((match) => (
            <article className="admin-table-row match-row" key={match.id}>
              <div>
                <strong>{match.homeTeam} x {match.awayTeam}</strong>
                <small>{fmt(match.kickOff)} · {match._count.predictions} palpites</small>
              </div>
              <span className={`admin-badge ${match.status}`}>{match.status}</span>
              <form className="admin-inline-form" action={correctMatchAction}>
                <input type="hidden" name="matchId" value={match.id} />
                <input name="homeScore" type="number" min={0} max={99} defaultValue={match.homeScore ?? 0} aria-label="Placar mandante" />
                <input name="awayScore" type="number" min={0} max={99} defaultValue={match.awayScore ?? 0} aria-label="Placar visitante" />
                <select name="status" defaultValue={match.status} aria-label="Status da partida">
                  <option value="scheduled">Agendada</option>
                  <option value="live">Ao vivo</option>
                  <option value="finished">Finalizada</option>
                </select>
                <input name="reason" placeholder="Motivo" required minLength={3} />
                <button className="admin-icon-button" title="Corrigir">
                  <i className="bi bi-save" aria-hidden="true" />
                </button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
