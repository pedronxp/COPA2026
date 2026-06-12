import Link from 'next/link';
import type { HistoryData } from '@/lib/player-routes-data';
import { calculatePredictionPoints } from '@/lib/matches-service';
import { formatDateTimePtBr } from '@/lib/pt-br-format';
import { TeamMark } from './team-mark';

export function HistoryView({ data }: { data: HistoryData }) {
  const activeLeague = data.leagueContext.activeLeague;
  const matchById = new Map(data.matches.map((match) => [match.id, match]));
  const rows = data.predictions
    .map((prediction) => ({ prediction, match: matchById.get(prediction.matchId) }))
    .filter((row) => Boolean(row.match))
    .sort(
      (left, right) =>
        new Date(right.match!.kickOff).getTime() - new Date(left.match!.kickOff).getTime(),
    );
  const matchesHref =
    activeLeague.slug === 'global' ? '/matches' : `/matches?league=${activeLeague.slug}`;
  const finishedCount = rows.filter(
    ({ match }) => match?.status === 'finished' && match.homeScore !== null && match.awayScore !== null,
  ).length;

  return (
    <div className="player-page-stack">
      <section className="player-panel player-page-header-panel">
        <div>
          <span className="player-kicker">Sua jornada</span>
          <h2>Histórico de palpites</h2>
          <p>Revise seus palpites no {activeLeague.name} com resultado, status e pontuação em uma visão simples.</p>
        </div>
        <div className="player-results-summary history-summary">
          <span><strong>{rows.length}</strong> palpites</span>
          <span><strong>{finishedCount}</strong> finalizados</span>
          <span><strong>{rows.length - finishedCount}</strong> aguardando</span>
        </div>
      </section>

      <section className="player-panel player-history-list">
        {rows.map(({ prediction, match }) => {
          if (!match) return null;
          const isFinished =
            match.status === 'finished' &&
            match.homeScore !== null &&
            match.awayScore !== null;
          const points = isFinished
            ? calculatePredictionPoints(
                prediction.homeGuess,
                prediction.awayGuess,
                match.homeScore!,
                match.awayScore!,
                activeLeague,
              )
            : null;

          return (
            <article key={prediction.id}>
              <div className="player-history-date">
                <time>{formatDateTimePtBr(match.kickOff)}</time>
                <span>{isFinished ? 'Finalizada' : 'Aguardando jogo'}</span>
              </div>
              <div className="player-history-match">
                <TeamMark
                  name={match.homeTeam}
                  logo={match.homeTeamLogo}
                  flag={match.homeFlag}
                  align="end"
                />
                <strong>
                  <span>Seu palpite</span>
                  {prediction.homeGuess} x {prediction.awayGuess}
                </strong>
                <TeamMark
                  name={match.awayTeam}
                  logo={match.awayTeamLogo}
                  flag={match.awayFlag}
                  align="start"
                />
              </div>
              <div className="player-history-result">
                {isFinished ? (
                  <>
                    <span>Resultado da partida: {match.homeScore} x {match.awayScore}</span>
                    <strong className={points && points > 0 ? 'positive' : ''}>+{points} pts</strong>
                  </>
                ) : (
                  <span>Resultado da partida ainda não saiu</span>
                )}
              </div>
            </article>
          );
        })}
        {rows.length === 0 && (
          <div className="player-empty-state">
            <i className="bi bi-clock-history" aria-hidden="true" />
            <h3>Você ainda não enviou palpites</h3>
            <Link className="btn btn-neon-green" href={matchesHref}>Dar primeiro palpite</Link>
          </div>
        )}
      </section>
    </div>
  );
}
