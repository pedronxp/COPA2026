import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin-auth';
import { getAdminLeagueGovernance } from '@/lib/admin-pool-governance-service';
import {
  deleteOptionalScoringRulesAction,
  recomputeLeagueScoringAction,
  removeLeagueMemberAction,
  resetPoolScoreAction,
  updateLeagueRulesAction,
} from '@/app/admin/actions';
import { SCORING_PRESETS } from '@/lib/league-domain';
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

function fmt(value: Date | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

function pointStatusValue(
  rows: Awaited<ReturnType<typeof getAdminLeagueGovernance>>['pointStatus'],
  status: string,
) {
  const row = rows.find((item) => item.status === status);
  return {
    count: row?._count.status ?? 0,
    points: row?._sum.points ?? 0,
  };
}

function HiddenContext({ league }: { league: { id: string; slug: string | null } }) {
  return (
    <>
      <input type="hidden" name="leagueId" value={league.id} />
      <input type="hidden" name="slug" value={league.slug || ''} />
    </>
  );
}

export default async function AdminLeagueGovernancePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  await requireAdminPage('leagues:manage');
  const { reference } = await params;
  let league: Awaited<ReturnType<typeof getAdminLeagueGovernance>>;

  try {
    league = await getAdminLeagueGovernance(reference);
  } catch {
    notFound();
  }

  const published = pointStatusValue(league.pointStatus, 'published');
  const pending = pointStatusValue(league.pointStatus, 'pending');
  const slug = league.slug || league.id;
  const scoreRows = league.isGlobal
    ? league.globalUsers.map((user) => ({
        id: user.id,
        name: user.name || 'Usuario',
        email: user.email,
        points: user.points,
        pendingPoints: 0,
        streak: user.streak,
        best: user.misses,
        role: 'global',
      }))
    : league.members.map((member) => ({
        id: member.userId,
        name: member.user.name || 'Usuario',
        email: member.user.email,
        points: member.points,
        pendingPoints: member.pendingPoints,
        streak: member.exactScoreStreak,
        best: member.bestExactScoreStreak,
        role: member.role,
      }));

  return (
    <section className="admin-stack">
      <AdminPageHeader
        eyebrow={league.isGlobal ? 'Bolao principal' : 'Governanca de bolao'}
        title={league.name}
        description="Regras, pontuacao e membros com trilha de auditoria."
      >
        <Link className="admin-button secondary" href="/admin/leagues">
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Boloes
        </Link>
      </AdminPageHeader>

      <div className="admin-grid compact">
        <AdminMetric icon="bi-people" label="Membros" value={league._count.members} />
        <AdminMetric icon="bi-clipboard2-check" label="Palpites" value={league._count.predictions} />
        <AdminMetric icon="bi-check2-circle" label="Publicados" value={published.points} detail={`${published.count} lancamentos`} />
        <AdminMetric icon="bi-hourglass-split" label="Pendentes" value={pending.points} detail={`${pending.count} lancamentos`} />
      </div>

      <AdminPanel title="Identidade" description="Dados operacionais do bolao selecionado.">
        <div className="admin-meta-list">
          <div>
            <dt>Status</dt>
            <dd>
              <AdminStatusBadge status={league.status}>
                {statusLabels[league.status] || league.status}
              </AdminStatusBadge>
            </dd>
          </div>
          <div>
            <dt>Dono</dt>
            <dd>{league.owner.email}</dd>
          </div>
          <div>
            <dt>Slug</dt>
            <dd>{slug}</dd>
          </div>
          <div>
            <dt>Trava de regras</dt>
            <dd>{fmt(league.rulesLockedAt)}</dd>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Regras de pontuacao"
        description="Alteracoes exigem motivo e definem impacto sobre pontuacoes ja processadas."
      >
        <form className="admin-action-form admin-rules-form" action={updateLeagueRulesAction}>
          <HiddenContext league={league} />
          <label className="admin-field">
            <span>Preset</span>
            <select name="scoringPreset" defaultValue={league.scoringPreset}>
              {Object.keys(SCORING_PRESETS).map((preset) => (
                <option value={preset} key={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Inicio</span>
            <input name="scoringStartMatchday" type="number" min={1} max={99} defaultValue={league.scoringStartMatchday} />
          </label>
          <label className="admin-field">
            <span>Janela</span>
            <input name="windowHours" type="number" min={1} max={168} defaultValue={league.windowHours} />
          </label>
          <label className="admin-field">
            <span>Edicoes</span>
            <input name="maxEdits" type="number" min={0} max={999} defaultValue={league.maxEdits} />
          </label>
          <label className="admin-field">
            <span>Exato</span>
            <input name="pointsExact" type="number" min={0} max={100} defaultValue={league.pointsExact} />
          </label>
          <label className="admin-field">
            <span>Saldo</span>
            <input name="pointsDiff" type="number" min={0} max={100} defaultValue={league.pointsDiff} />
          </label>
          <label className="admin-field">
            <span>Vencedor</span>
            <input name="pointsWinner" type="number" min={0} max={100} defaultValue={league.pointsWinner} />
          </label>
          <label className="admin-field">
            <span>Casa</span>
            <input name="pointsWinnerHome" type="number" min={0} max={100} defaultValue={league.pointsWinnerHome} />
          </label>
          <label className="admin-field">
            <span>Fora</span>
            <input name="pointsWinnerAway" type="number" min={0} max={100} defaultValue={league.pointsWinnerAway} />
          </label>
          <label className="admin-field">
            <span>Empate</span>
            <input name="pointsDraw" type="number" min={0} max={100} defaultValue={league.pointsDraw} />
          </label>
          <label className="admin-field">
            <span>Ambos sim</span>
            <input name="pointsBothScoreYes" type="number" min={0} max={100} defaultValue={league.pointsBothScoreYes} />
          </label>
          <label className="admin-field">
            <span>Ambos nao</span>
            <input name="pointsBothScoreNo" type="number" min={0} max={100} defaultValue={league.pointsBothScoreNo} />
          </label>
          <label className="admin-field">
            <span>Grupos</span>
            <select name="groupPublicationMode" defaultValue={league.groupPublicationMode}>
              <option value="match">Partida</option>
              <option value="round">Rodada</option>
              <option value="every_2_rounds">2 rodadas</option>
              <option value="every_3_rounds">3 rodadas</option>
              <option value="phase">Fase</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Mata-mata</span>
            <select name="knockoutPublicationMode" defaultValue={league.knockoutPublicationMode}>
              <option value="match">Partida</option>
              <option value="stage">Etapa</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Impacto</span>
            <select name="impactMode" defaultValue="future_only">
              <option value="future_only">Futuro</option>
              <option value="recompute_scored">Recalcular</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Motivo</span>
            <input name="reason" required minLength={3} placeholder="Motivo auditavel" />
          </label>
          <div className="admin-form-footer">
            <button className="admin-button" type="submit">
              <i className="bi bi-save" aria-hidden="true" />
              Salvar regras
            </button>
          </div>
        </form>
      </AdminPanel>

      <div className="admin-two-column">
        <AdminPanel className="admin-danger-zone" title="Bonus opcionais">
          <form className="admin-action-form" action={deleteOptionalScoringRulesAction}>
            <HiddenContext league={league} />
            <select name="impactMode" defaultValue="future_only" aria-label="Impacto">
              <option value="future_only">Futuro</option>
              <option value="recompute_scored">Recalcular</option>
            </select>
            <input name="reason" required minLength={3} placeholder="Motivo" />
            <button className="admin-button danger" type="submit">
              <i className="bi bi-slash-circle" aria-hidden="true" />
              Desativar bonus
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title="Recalculo manual">
          <form className="admin-action-form" action={recomputeLeagueScoringAction}>
            <HiddenContext league={league} />
            <input name="reason" required minLength={3} placeholder="Motivo" />
            <button className="admin-button secondary" type="submit">
              <i className="bi bi-arrow-repeat" aria-hidden="true" />
              Recalcular
            </button>
          </form>
        </AdminPanel>
      </div>

      <AdminPanel
        title={league.isGlobal ? 'Pontuacao global' : 'Membros'}
        description={league.isGlobal ? 'Acoes afetam User.points, streak e misses.' : 'Acoes afetam somente a participacao neste bolao.'}
      >
        <div className="admin-table user-table">
          {scoreRows.map((row) => (
            <article className="admin-table-row user-row" key={row.id}>
              <div>
                <strong>{row.name}</strong>
                <small>{row.email}</small>
              </div>
              <div className="admin-row-meta">
                <span>Pontos</span>
                <small>{row.points} pts / {row.pendingPoints} pend.</small>
              </div>
              <div className="admin-row-meta">
                <span>Serie</span>
                <small>{row.streak} atual / {row.best} ref.</small>
              </div>
              <AdminStatusBadge status={row.role}>{row.role}</AdminStatusBadge>
              <div className="admin-action-group">
                <form className="admin-action-form" action={resetPoolScoreAction}>
                  <HiddenContext league={league} />
                  <input type="hidden" name="targetUserId" value={row.id} />
                  <input name="reason" required minLength={3} placeholder="Motivo" />
                  <button className="admin-icon-button danger" type="submit" title="Zerar pontos">
                    <i className="bi bi-eraser" aria-hidden="true" />
                  </button>
                </form>
                {!league.isGlobal && row.role !== 'owner' && (
                  <form className="admin-action-form" action={removeLeagueMemberAction}>
                    <HiddenContext league={league} />
                    <input type="hidden" name="targetUserId" value={row.id} />
                    <input name="reason" required minLength={3} placeholder="Motivo" />
                    <button className="admin-icon-button danger" type="submit" title="Remover do bolao">
                      <i className="bi bi-person-dash" aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
          {scoreRows.length === 0 && (
            <AdminEmptyState
              description="Nenhum usuario disponivel para esta visao."
              icon="bi-people"
              title="Sem participantes"
            />
          )}
        </div>
      </AdminPanel>

      <AdminPanel title="Auditoria recente">
        <div className="admin-table audit-table">
          {league.recentAudit.map((entry) => (
            <article className="admin-table-row audit-row" key={entry.id}>
              <div>
                <strong>{entry.action}</strong>
                <small>{entry.summary}</small>
              </div>
              <div className="admin-row-meta">
                <span>Autor</span>
                <small>{entry.actor?.email || 'Sistema'}</small>
              </div>
              <div className="admin-row-meta">
                <span>Quando</span>
                <small>{fmt(entry.createdAt)}</small>
              </div>
            </article>
          ))}
          {league.recentAudit.length === 0 && (
            <AdminEmptyState
              description="Este bolao ainda nao possui eventos de governanca."
              icon="bi-journal-text"
              title="Sem auditoria"
            />
          )}
        </div>
      </AdminPanel>
    </section>
  );
}
