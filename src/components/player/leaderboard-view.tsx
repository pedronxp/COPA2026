import Link from 'next/link';
import type { LeaderboardData, PlayerMemberRow } from '@/lib/player-routes-data';
import { formatDateTimePtBr } from '@/lib/pt-br-format';
import { getFlagIsoCode, isEmoji } from '@/lib/emoji-flags';

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
  const isSuperCombo = member.streak >= 3;

  const avatarVal = memberInitial(member);
  const flagIso = member.image ? getFlagIsoCode(member.image) : null;
  const emojiOnly = member.image ? isEmoji(member.image) : false;

  return (
    <article 
      className={`leaderboard-podium-card ${tone} ${isSuperCombo ? 'super-combo' : ''}`}
      role="group" 
      aria-label={`Pódio ${member.rank}º lugar: ${member.name}`}
    >
      <span className="leaderboard-rank-badge" aria-hidden="true">
        {isGold ? <i className="bi bi-crown-fill" /> : `#${member.rank}`}
      </span>
      {flagIso ? (
        <div className="leaderboard-avatar has-flag" aria-hidden="true">
          <img
            src={`https://flagcdn.com/w80/${flagIso}.png`}
            alt={member.name}
            className="avatar-flag-image"
          />
        </div>
      ) : (
        <div 
          className={`leaderboard-avatar ${emojiOnly ? 'is-emoji' : ''}`} 
          style={emojiOnly ? undefined : avatarStyle}
          aria-hidden="true"
        >
          {avatarVal}
        </div>
      )}
      <h3>
        <Link href={`/profile/${member.id}`} className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
          {member.name}
        </Link>
      </h3>
      <strong>{member.points} pts</strong>
      
      <div className="leaderboard-podium-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
        {member.streak >= 2 && (
          <span className={`leaderboard-streak-badge ${isSuperCombo ? 'super-combo' : ''}`} title={`Sequência de ${member.streak} acertos`}>
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

      <div 
        className="p-3 mb-4 rounded border text-start animate__animated animate__fadeIn"
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          borderColor: isGlobal ? 'rgba(14, 165, 233, 0.25)' : 'rgba(16, 185, 129, 0.25)',
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <span className={`badge ${isGlobal ? 'bg-info' : 'bg-success'} text-dark`} style={{ fontSize: '0.75rem', fontWeight: '700' }}>
            {isGlobal ? '🌐 RANKING GLOBAL' : '🏆 RANKING DO BOLÃO'}
          </span>
          <span className="text-white fw-bold" style={{ fontSize: '0.9rem' }}>
            {isGlobal ? 'Exibindo classificação geral de todos os torcedores' : `Exibindo classificação do bolão "${activeLeague.name}"`}
          </span>
        </div>
        <div className="d-flex flex-wrap gap-x-4 gap-y-2 text-secondary align-items-center" style={{ fontSize: '0.78rem' }}>
          <div className="d-flex align-items-center gap-1">
            <i className="bi bi-fire text-danger" style={{ fontSize: '0.9rem' }} />
            <span><strong>Foguinho (Seq.):</strong> Sequência de acertos seguidos de Placar Exato (mínimo de 2).</span>
          </div>
          {!isGlobal && (
            <div className="d-flex align-items-center gap-1 ms-md-auto">
              <Link href="/leaderboard?league=global" className="text-info text-decoration-none d-flex align-items-center gap-1 hover-underline">
                <i className="bi bi-globe" />
                <span>Ver ranking global da copa</span>
              </Link>
            </div>
          )}
          {isGlobal && (
            <div className="d-flex align-items-center gap-1 ms-md-auto">
              <Link href="/leagues" className="text-success text-decoration-none d-flex align-items-center gap-1 hover-underline">
                <i className="bi bi-arrow-left" />
                <span>Voltar para meus bolões</span>
              </Link>
            </div>
          )}
        </div>
      </div>

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
              </div>
              {data.members.map((member) => {
                const isCurrent = member.id === data.currentMember?.id;
                const avatarStyle = getAvatarStyle(member.name);
                const rankClass = member.rank <= 3 ? `rank-${member.rank}` : '';
                const isSuperCombo = member.streak >= 3;

                return (
                  <div
                    key={member.id}
                    className={`leaderboard-row ${isCurrent ? 'current' : ''} ${rankClass} ${isSuperCombo ? 'combo-active' : ''}`}
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
                      {(() => {
                        const avatarVal = memberInitial(member);
                        const flagIso = member.image ? getFlagIsoCode(member.image) : null;
                        const emojiOnly = member.image ? isEmoji(member.image) : false;

                        if (flagIso) {
                          return (
                            <span 
                              className="leaderboard-avatar small has-flag" 
                              aria-hidden="true"
                            >
                              <img
                                src={`https://flagcdn.com/w80/${flagIso}.png`}
                                alt={member.name}
                                className="avatar-flag-image"
                              />
                            </span>
                          );
                        }
                        return (
                          <span 
                            className={`leaderboard-avatar small ${emojiOnly ? 'is-emoji' : ''}`} 
                            style={emojiOnly ? undefined : avatarStyle}
                            aria-hidden="true"
                          >
                            {avatarVal}
                          </span>
                        );
                      })()}
                      <div>
                        <div className="leaderboard-player-name-wrapper">
                          <b>
                            <Link href={`/profile/${member.id}`} className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                              {member.name}
                            </Link>
                            {isCurrent && <span style={{ color: 'var(--neon-green)', fontWeight: 600, fontSize: '0.75rem', marginLeft: '4px' }}>(Você)</span>}
                          </b>
                          {member.streak >= 2 && (
                            <span 
                              className={`leaderboard-streak-badge inline ${isSuperCombo ? 'super-combo animate__animated animate__pulse animate__infinite' : ''}`} 
                              title={`Sequência de ${member.streak} acertos de placar exato`}
                              style={{
                                marginLeft: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                background: isSuperCombo ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                                color: isSuperCombo ? '#ef4444' : '#f97316',
                                border: isSuperCombo ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(249, 115, 22, 0.3)',
                                boxShadow: isSuperCombo ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none'
                              }}
                            >
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
