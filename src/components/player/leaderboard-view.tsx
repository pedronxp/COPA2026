import Link from 'next/link';
import type { LeaderboardData, PlayerMemberRow } from '@/lib/player-routes-data';
import { formatDateTimePtBr } from '@/lib/pt-br-format';

interface LeaderboardViewProps {
  data: LeaderboardData;
}

function memberInitial(member: PlayerMemberRow) {
  return member.image || member.name.slice(0, 1).toUpperCase();
}

function PodiumCard({
  member,
  tone,
}: {
  member: PlayerMemberRow;
  tone: 'gold' | 'silver' | 'bronze';
}) {
  return (
    <article className={`leaderboard-podium-card ${tone}`}>
      <span className="leaderboard-rank-badge">#{member.rank}</span>
      <div className="leaderboard-avatar">{memberInitial(member)}</div>
      <h3>{member.name}</h3>
      <strong>{member.points} pts</strong>
      {member.pendingPoints > 0 && <small>+{member.pendingPoints} pendentes</small>}
    </article>
  );
}

export function LeaderboardView({ data }: LeaderboardViewProps) {
  const { activeLeague } = data.leagueContext;
  const [leader, second, third] = data.podium;
  const isGlobal = activeLeague.id === 'global';

  return (
    <div className="player-page-stack leaderboard-page">
      <section className="leaderboard-hero">
        <div>
          <span className="player-kicker">{isGlobal ? 'Ranking global' : 'Ranking do bolão'}</span>
          <h2>{isGlobal ? 'Classificação geral dos jogadores' : `Disputa do ${activeLeague.name}`}</h2>
          <p>
            {isGlobal
              ? 'Acompanhe sua posição entre todos os jogadores da plataforma.'
              : 'Acompanhe o topo, sua posição atual e os pontos publicados neste bolão.'}
          </p>
        </div>
        <div className="leaderboard-hero-meta">
          <span>{activeLeague.memberCount} competidores</span>
          <strong>{activeLeague.userRank ? `#${activeLeague.userRank}` : '--'}</strong>
          <small>Sua posição</small>
        </div>
      </section>

      {!isGlobal && (
        <section className="leaderboard-current-card leaderboard-global-card">
          <div>
            <span className="player-kicker">Rank global</span>
            <h3>Desempenho em toda a plataforma</h3>
            <small>{data.globalMembers.length} participantes globais</small>
          </div>
          <div className="leaderboard-current-stats">
            <span>
              <strong>{data.currentGlobalMember?.rank ? `#${data.currentGlobalMember.rank}` : '--'}</strong>
              posição
            </span>
            <span><strong>{data.currentGlobalMember?.points ?? 0}</strong> pontos</span>
            <Link href="/leaderboard?league=global" className="btn btn-neon-outline">
              Ver ranking global
            </Link>
          </div>
        </section>
      )}

      {data.members.length === 0 ? (
        <section className="player-panel player-empty-state">
          <i className="bi bi-trophy" aria-hidden="true" />
          <h3>Ranking vazio</h3>
          <p>Este bolão ainda não tem participantes ativos para classificar.</p>
        </section>
      ) : (
        <>
          <section className="leaderboard-podium" aria-label="Podio do ranking">
            {second && <PodiumCard member={second} tone="silver" />}
            {leader && <PodiumCard member={leader} tone="gold" />}
            {third && <PodiumCard member={third} tone="bronze" />}
          </section>

          <section className="leaderboard-current-card">
            <div>
              <span className="player-kicker">Sua campanha</span>
              <h3>{data.currentMember?.name || 'Você ainda não aparece no ranking'}</h3>
            </div>
            <div className="leaderboard-current-stats">
              <span><strong>{data.currentMember?.rank ? `#${data.currentMember.rank}` : '--'}</strong> posição</span>
              <span><strong>{data.currentMember?.points ?? 0}</strong> pontos</span>
              <span><strong>{data.currentMember?.pendingPoints ?? 0}</strong> pendentes</span>
            </div>
          </section>

          <section className="player-panel leaderboard-list-panel">
            <div className="player-panel-heading">
              <div>
                <span className="player-kicker">Classificação geral</span>
                <h3>Todos os participantes</h3>
              </div>
              {activeLeague.lastPublishedAt && (
                <span className="leaderboard-updated">
                  <i className="bi bi-clock-history" aria-hidden="true" />
                  {formatDateTimePtBr(activeLeague.lastPublishedAt)}
                </span>
              )}
            </div>

            <div className="leaderboard-list" role="table" aria-label="Ranking completo">
              <div className="leaderboard-list-head" role="row">
                <span>Pos</span>
                <span>Jogador</span>
                <span>Pontos</span>
                <span>Pend.</span>
                <span>Seq.</span>
              </div>
              {data.members.map((member) => (
                <div
                  key={member.id}
                  className={`leaderboard-row ${member.id === data.currentMember?.id ? 'current' : ''}`}
                  role="row"
                >
                  <strong>#{member.rank}</strong>
                  <div className="leaderboard-player-cell">
                    <span className="leaderboard-avatar small">{memberInitial(member)}</span>
                    <div>
                      <b>{member.name}</b>
                      <small>{member.role}</small>
                    </div>
                  </div>
                  <span>{member.points}</span>
                  <span>{member.pendingPoints}</span>
                  <span>{member.streak}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="leaderboard-actions">
            <Link href={activeLeague.slug === 'global' ? '/matches' : `/matches?league=${activeLeague.slug}`} className="btn btn-neon-green">
              <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
              Dar palpites
            </Link>
            <Link href={activeLeague.slug === 'global' ? '/calendar' : `/calendar?league=${activeLeague.slug}`} className="btn btn-neon-outline">
              <i className="bi bi-calendar-event" aria-hidden="true" />
              Ver tabela
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
