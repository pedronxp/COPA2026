import Link from 'next/link';
import type { LeaderboardData, PlayerMemberRow } from '@/lib/player-routes-data';
import { formatDateTimePtBr } from '@/lib/pt-br-format';

interface LeaderboardViewProps {
  data: LeaderboardData;
}

function memberInitial(member: PlayerMemberRow) {
  return member.image || member.name.slice(0, 1).toUpperCase();
}

function getAvatarStyle(name: string) {
  const charCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = charCode % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 45) % 360}, 75%, 35%))`,
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };
}

function PodiumCard({
  member,
  tone,
}: {
  member: PlayerMemberRow;
  tone: 'gold' | 'silver' | 'bronze';
}) {
  const avatarStyle = getAvatarStyle(member.name);
  const isGold = tone === 'gold';

  return (
    <article 
      className={`leaderboard-podium-card ${tone}`}
      role="group" 
      aria-label={`Pódio ${member.rank}º lugar: ${member.name}`}
    >
      <span className="leaderboard-rank-badge" aria-hidden="true">
        {isGold ? <i className="bi bi-crown-fill" /> : `#${member.rank}`}
      </span>
      <div className="leaderboard-avatar" style={avatarStyle}>
        {memberInitial(member)}
      </div>
      <h3>{member.name}</h3>
      <strong>{member.points} pts</strong>
      
      <div className="leaderboard-podium-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
        {member.streak > 0 && (
          <span className="leaderboard-streak-badge" title={`Sequência de ${member.streak} acertos`}>
            <i className="bi bi-fire" aria-hidden="true" /> {member.streak}
          </span>
        )}
        {member.pendingPoints > 0 && <small>+{member.pendingPoints} pendentes</small>}
      </div>
    </article>
  );
}

export function LeaderboardView({ data }: LeaderboardViewProps) {
  const { activeLeague } = data.leagueContext;
  const [leader, second, third] = data.podium;
  const isGlobal = activeLeague.id === 'global';  return (
    <div className="player-page-stack leaderboard-page">
      <header className="leaderboard-header">
        <div>
          <span className="player-kicker">{isGlobal ? 'Plataforma' : 'Competição'}</span>
          <h1>{isGlobal ? 'Classificação Geral' : 'Classificação do Bolão'}</h1>
        </div>
      </header>

      <section className="leaderboard-compact-stats" aria-label="Resumo do desempenho">
        <div className="stat-chip" title="Total de competidores neste bolão">
          <i className="bi bi-people-fill" aria-hidden="true" />
          <div className="stat-chip-content">
            <small>Competidores</small>
            <strong>{activeLeague.memberCount}</strong>
          </div>
        </div>

        <div className="stat-chip highlighted" title="Sua posição atual">
          <i className="bi bi-hash" aria-hidden="true" />
          <div className="stat-chip-content">
            <small>Sua Posição</small>
            <strong>{data.currentMember?.rank ? `#${data.currentMember.rank}` : '--'}</strong>
          </div>
        </div>

        <div className="stat-chip" title="Seus pontos acumulados">
          <i className="bi bi-star-fill" style={{ color: '#fbbf24' }} aria-hidden="true" />
          <div className="stat-chip-content">
            <small>Pontos</small>
            <strong>{data.currentMember?.points ?? 0} <span className="stat-unit">pts</span></strong>
          </div>
        </div>

        {data.currentMember?.pendingPoints && data.currentMember.pendingPoints > 0 ? (
          <div className="stat-chip" title="Pontos pendentes de validação">
            <i className="bi bi-clock-history" style={{ color: 'var(--neon-green)' }} aria-hidden="true" />
            <div className="stat-chip-content">
              <small>Pendentes</small>
              <strong>+{data.currentMember.pendingPoints} <span className="stat-unit">pts</span></strong>
            </div>
          </div>
        ) : !isGlobal && data.currentGlobalMember ? (
          <Link href="/leaderboard?league=global" className="stat-chip interactive" title="Ver classificação global">
            <i className="bi bi-globe" style={{ color: '#0ea5e9' }} aria-hidden="true" />
            <div className="stat-chip-content">
              <small>Rank Global</small>
              <strong>{data.currentGlobalMember.rank ? `#${data.currentGlobalMember.rank}` : '--'}</strong>
            </div>
          </Link>
        ) : null}
      </section>

      {data.members.length === 0 ? (
        <section className="player-panel player-empty-state">
          <i className="bi bi-trophy" aria-hidden="true" />
          <h3>Ranking vazio</h3>
          <p>Este bolão ainda não tem participantes ativos para classificar.</p>
        </section>
      ) : (
        <>
          <section className="leaderboard-podium" aria-label="Pódio dos líderes">
            {second && <PodiumCard member={second} tone="silver" />}
            {leader && <PodiumCard member={leader} tone="gold" />}
            {third && <PodiumCard member={third} tone="bronze" />}
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
              {data.members.map((member) => {
                const isCurrent = member.id === data.currentMember?.id;
                const avatarStyle = getAvatarStyle(member.name);
                const rankClass = member.rank <= 3 ? `rank-${member.rank}` : '';

                return (
                  <div
                    key={member.id}
                    className={`leaderboard-row ${isCurrent ? 'current' : ''} ${rankClass}`}
                    role="row"
                  >
                    <strong>
                      {member.rank === 1 ? (
                        <i className="bi bi-trophy-fill" title="1º Lugar" style={{ color: '#fbbf24' }} aria-hidden="true" />
                      ) : member.rank === 2 ? (
                        <i className="bi bi-award-fill" title="2º Lugar" style={{ color: '#cbd5e1' }} aria-hidden="true" />
                      ) : member.rank === 3 ? (
                        <i className="bi bi-award-fill" title="3º Lugar" style={{ color: '#d97706' }} aria-hidden="true" />
                      ) : (
                        `#${member.rank}`
                      )}
                    </strong>

                    <div className="leaderboard-player-cell">
                      <span 
                        className="leaderboard-avatar small" 
                        style={avatarStyle}
                        aria-hidden="true"
                      >
                        {memberInitial(member)}
                      </span>
                      <div>
                        <div className="leaderboard-player-name-wrapper">
                          <b>
                            {member.name}
                            {isCurrent && <span style={{ color: 'var(--neon-green)', fontWeight: 600, fontSize: '0.75rem', marginLeft: '4px' }}>(Você)</span>}
                          </b>
                          {member.streak > 0 && (
                            <span className="leaderboard-streak-inline-mobile" title={`Sequência de ${member.streak} acertos`}>
                              <i className="bi bi-fire" aria-hidden="true" /> {member.streak}
                            </span>
                          )}
                        </div>
                        <small>{member.role === 'admin' ? 'Organizador' : 'Competidor'}</small>
                      </div>
                    </div>

                    <div className="leaderboard-points-cell">
                      <span>
                        {member.points}
                        <span className="pts-label"> pts</span>
                      </span>
                      {member.pendingPoints > 0 && (
                        <span className="leaderboard-pending-inline-mobile" title={`${member.pendingPoints} pontos pendentes`}>
                          +{member.pendingPoints} pend.
                        </span>
                      )}
                    </div>

                    <span>{member.pendingPoints}</span>

                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {member.streak > 0 ? (
                        <span className="leaderboard-streak-badge" title={`Sequência de ${member.streak} acertos`}>
                          <i className="bi bi-fire" aria-hidden="true" /> {member.streak}
                        </span>
                      ) : (
                        '--'
                      )}
                    </span>
                  </div>
                );
              })}
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
