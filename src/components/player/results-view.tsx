import type { ResultsData } from '@/lib/player-routes-data';
import { calculatePredictionPoints } from '@/lib/matches-service';
import { formatDateTimePtBr, formatStagePtBr } from '@/lib/pt-br-format';
import { TeamMark } from './team-mark';

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
          const points =
            prediction && match.homeScore !== null && match.awayScore !== null
              ? calculatePredictionPoints(
                  prediction.homeGuess,
                  prediction.awayGuess,
                  match.homeScore,
                  match.awayScore,
                  activeLeague,
                )
              : 0;

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
              <footer>
                {prediction ? (
                  <>
                    <span>Seu palpite: {prediction.homeGuess} x {prediction.awayGuess}</span>
                    <strong className={points > 0 ? 'positive' : ''}>+{points} pts</strong>
                  </>
                ) : (
                  <span>Sem palpite nesta partida</span>
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
