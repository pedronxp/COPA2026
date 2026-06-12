import { requireAdminPage } from '@/lib/admin-auth';
import { listAdminLeagues } from '@/lib/admin-service';
import { updateLeagueAction } from '@/app/admin/actions';
import { DeleteLeagueForm } from '@/components/admin/delete-league-form';
import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/admin-ui';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  closed: 'Encerrado',
  archived: 'Arquivado',
};

export default async function AdminLeaguesPage({ searchParams }: PageProps<'/admin/leagues'>) {
  await requireAdminPage('leagues:manage');
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const leagues = await listAdminLeagues(q);
  const activeLeagues = leagues.filter((league) => league.status === 'active').length;
  const totalMembers = leagues.reduce((sum, league) => sum + league._count.members, 0);
  const totalPredictions = leagues.reduce((sum, league) => sum + league._count.predictions, 0);

  return (
    <section className="admin-stack">
      <AdminPageHeader
        eyebrow="Operacao global"
        title="Boloes"
        description="Controle status, nomes e riscos operacionais dos boloes da plataforma."
      >
        <form className="admin-filter" action="/admin/leagues">
          <input name="q" defaultValue={q} placeholder="Buscar bolao, slug ou convite" />
          <button className="admin-button secondary" type="submit">
            <i className="bi bi-search" aria-hidden="true" />
            Buscar
          </button>
        </form>
      </AdminPageHeader>

      <div className="admin-grid compact">
        <AdminMetric icon="bi-trophy" label="Resultado" value={leagues.length} />
        <AdminMetric icon="bi-play-circle" label="Ativos" tone={activeLeagues > 0 ? 'ok' : 'neutral'} value={activeLeagues} />
        <AdminMetric icon="bi-people" label="Membros" value={totalMembers} />
        <AdminMetric icon="bi-clipboard2-check" label="Palpites" value={totalPredictions} />
      </div>

      <AdminPanel
        description="Alteracoes aqui afetam a experiencia publica do bolao e sao auditadas."
        title="Gestao de boloes"
      >
        <div className="admin-table league-table">
          {leagues.map((league) => (
            <article className="admin-table-row league-row" key={league.id}>
              <div>
                <strong>{league.name}</strong>
                <small>{league.slug || league.inviteCode} / dono: {league.owner.email}</small>
              </div>
              <AdminStatusBadge status={league.status}>{statusLabels[league.status] || league.status}</AdminStatusBadge>
              <div className="admin-row-meta">
                <span>Volume</span>
                <small>{league._count.members} membros / {league._count.predictions} palpites</small>
              </div>
              <div className="admin-row-meta">
                <span>Pontuacao</span>
                <small>
                  {league.scoringPreset}: {league.pointsExact}/{league.pointsDiff}/
                  {league.pointsWinner}/{league.pointsDraw}
                </small>
              </div>
              <div className="admin-action-group">
                <form className="admin-action-form league-edit-form" action={updateLeagueAction}>
                  <input type="hidden" name="leagueId" value={league.id} />
                  <input
                    name="name"
                    defaultValue={league.name}
                    className="admin-input-name"
                    aria-label="Nome do bolao"
                  />
                  <select name="status" defaultValue={league.status} aria-label="Status do bolao">
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativo</option>
                    <option value="closed">Encerrado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                  <input name="reason" placeholder="Motivo opcional" />
                  <button className="admin-icon-button" type="submit" title="Salvar">
                    <i className="bi bi-save" aria-hidden="true" />
                  </button>
                </form>
                {league.id !== 'global' && (
                  <DeleteLeagueForm leagueId={league.id} leagueName={league.name} />
                )}
              </div>
            </article>
          ))}
          {leagues.length === 0 && (
            <AdminEmptyState
              description="Tente buscar pelo nome, slug ou codigo de convite."
              icon="bi-search"
              title="Nenhum bolao encontrado"
            />
          )}
        </div>
      </AdminPanel>
    </section>
  );
}
