import type { ResultsData } from '@/lib/player-routes-data';
import { calculatePredictionScore } from '@/lib/scoring-domain';
import { formatDateTimePtBr, formatStagePtBr } from '@/lib/pt-br-format';
import { TeamMark } from './team-mark';

function renderScoreBadges(scoreDetails: any) {
  if (!scoreDetails) return null;
  const badges = [];

  if (scoreDetails.exactScore > 0) {
    badges.push(
      <span 
        key="exact"
        style={{
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-bullseye" style={{ fontSize: '0.72rem' }} /> Placar Exato
      </span>
    );
  }

  if (scoreDetails.result > 0) {
    let label = 'Resultado';
    if (scoreDetails.resultKind === 'home') label = 'Vencedor Casa';
    if (scoreDetails.resultKind === 'away') label = 'Vencedor Fora';
    if (scoreDetails.resultKind === 'draw') label = 'Empate';
    
    badges.push(
      <span 
        key="result"
        style={{
          background: 'rgba(139, 92, 246, 0.12)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-trophy" style={{ fontSize: '0.72rem' }} /> {label}
      </span>
    );
  }

  if (scoreDetails.totalGoals > 0) {
    badges.push(
      <span 
        key="goals"
        style={{
          background: 'rgba(6, 182, 212, 0.12)',
          color: '#22d3ee',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-hash" style={{ fontSize: '0.72rem' }} /> Total de Gols
      </span>
    );
  }

  if (scoreDetails.bothTeamsScore > 0) {
    badges.push(
      <span 
        key="both"
        style={{
          background: 'rgba(20, 184, 166, 0.12)',
          color: '#2dd4bf',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-arrow-left-right" style={{ fontSize: '0.72rem' }} /> Ambas Marcam
      </span>
    );
  }

  if (badges.length === 0) {
    badges.push(
      <span 
        key="none"
        style={{
          background: 'rgba(100, 116, 139, 0.1)',
          color: '#94a3b8',
          border: '1px solid rgba(100, 116, 139, 0.2)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-x-circle" style={{ fontSize: '0.72rem' }} /> Sem Pontos
      </span>
    );
  }

  return (
    <div className="d-flex flex-wrap gap-1 mt-2 justify-content-start align-items-center">
      {badges}
    </div>
  );
}

export function ResultsView({ data }: { data: ResultsData }) {
  const activeLeague = data.leagueContext.activeLeague;
  const predictionByMatch = new Map(
    data.predictions.map((prediction) => [prediction.matchId, prediction]),
  );
  const finishedMatches = data.matches
    .filter((match) => match.status === 'finished')
    .sort(
      (left, right) =>
        new Date(right.kickOff).getTime() - new Date(left.kickOff).getTime(),
    );

  return (
    <div className="player-page-stack">
      <section className="player-panel player-page-header-panel">
        <div>
          <span className="player-kicker">Placar oficial</span>
          <h2>Resultados</h2>
          <p>
            Partidas encerradas, seu palpite e os pontos obtidos no {activeLeague.name}.
          </p>
        </div>
        <div className="player-results-summary">
          <strong>{finishedMatches.length}</strong>
          <span>jogos finalizados</span>
        </div>
      </section>

      <section className="player-results-grid">
        {finishedMatches.map((match) => {
          const prediction = predictionByMatch.get(match.id);
          const scoreDetails =
            prediction && match.homeScore !== null && match.awayScore !== null
              ? calculatePredictionScore(
                  prediction.homeGuess,
                  prediction.awayGuess,
                  match.homeScore,
                  match.awayScore,
                  activeLeague,
                  {
                    resultPick: prediction.resultPick as any,
                    totalGoalsPick: prediction.totalGoalsPick as any,
                    bothTeamsScorePick: prediction.bothTeamsScorePick as any,
                  }
                )
              : null;
          const points = scoreDetails?.total ?? 0;

          return (
            <article className="player-panel player-result-card" key={match.id}>
              <header>
                <span>{match.group ? `Grupo ${match.group}` : formatStagePtBr(match.stage)}</span>
                <time>{formatDateTimePtBr(match.kickOff)}</time>
              </header>
              <div className="player-result-score">
                <TeamMark
                  name={match.homeTeam}
                  logo={match.homeTeamLogo}
                  flag={match.homeFlag}
                  align="end"
                />
                <strong>{match.homeScore ?? 0} x {match.awayScore ?? 0}</strong>
                <TeamMark
                  name={match.awayTeam}
                  logo={match.awayTeamLogo}
                  flag={match.awayFlag}
                  align="start"
                />
              </div>
              <footer style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                {prediction ? (
                  <>
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <span className="text-secondary">Seu palpite: <strong className="text-white">{prediction.homeGuess} x {prediction.awayGuess}</strong></span>
                      <strong className={points > 0 ? 'text-success fw-bold fs-5' : 'text-secondary fw-semibold'}>
                        {points > 0 ? `+${points}` : '0'} pts
                      </strong>
                    </div>
                    {renderScoreBadges(scoreDetails)}
                  </>
                ) : (
                  <span className="text-muted italic">Sem palpite nesta partida</span>
                )}
              </footer>
            </article>
          );
        })}
        {finishedMatches.length === 0 && (
          <section className="player-panel player-empty-state">
            <i className="bi bi-clipboard-data" aria-hidden="true" />
            <h3>Nenhum resultado disponível</h3>
            <p>As partidas encerradas aparecerão aqui.</p>
          </section>
        )}
      </section>
    </div>
  );
}
