import { requireAdminPage } from '@/lib/admin-auth';
import { listAdminLeagues } from '@/lib/admin-service';
import { updateLeagueAction } from '@/app/admin/actions';

export default async function AdminLeaguesPage({ searchParams }: PageProps<'/admin/leagues'>) {
  await requireAdminPage('leagues:manage');
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const leagues = await listAdminLeagues(q);

  return (
    <section className="admin-stack">
      <header className="admin-page-head">
        <div>
          <p>Operacao global</p>
          <h1>Boloes</h1>
        </div>
        <form className="admin-filter" action="/admin/leagues">
          <input name="q" defaultValue={q} placeholder="Buscar bolao, slug ou convite" />
          <button className="admin-button secondary" type="submit">Buscar</button>
        </form>
      </header>

      <div className="admin-panel">
        <div className="admin-table">
          {leagues.map((league) => (
            <article className="admin-table-row league-row" key={league.id}>
              <div>
                <strong>{league.name}</strong>
                <small>{league.slug || league.inviteCode} · dono: {league.owner.email}</small>
              </div>
              <span className={`admin-badge ${league.status}`}>{league.status}</span>
              <small>{league._count.members} membros · {league._count.predictions} palpites</small>
              <small>
                {league.scoringPreset}: {league.pointsExact}/{league.pointsDiff}/{league.pointsWinner}/{league.pointsDraw}
              </small>
              <form className="admin-inline-form" action={updateLeagueAction}>
                <input type="hidden" name="leagueId" value={league.id} />
                <input name="name" defaultValue={league.name} aria-label="Nome do bolao" />
                <select name="status" defaultValue={league.status} aria-label="Status do bolao">
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="closed">Encerrado</option>
                  <option value="archived">Arquivado</option>
                </select>
                <input name="reason" placeholder="Motivo" required minLength={3} />
                <button className="admin-icon-button" title="Salvar">
                  <i className="bi bi-save" aria-hidden="true" />
                </button>
              </form>
            </article>
          ))}
          {leagues.length === 0 && <p className="admin-empty">Nenhum bolao encontrado.</p>}
        </div>
      </div>
    </section>
  );
}
