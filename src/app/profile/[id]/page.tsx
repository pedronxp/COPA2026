import { notFound, redirect } from 'next/navigation';
import { PlayerAppShell } from '@/components/player/app-shell';
import { requireUser } from '@/lib/session';
import { getActiveLeagueContext } from '@/lib/active-league';
import { getUserPublicProfile } from '@/lib/profile-service';
import Link from 'next/link';
import { getFlagIsoCode, isEmoji } from '@/lib/emoji-flags';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireUser();
  const { id } = await params;

  if (id === currentUser.id) {
    redirect('/profile');
  }

  let profile;
  try {
    profile = await getUserPublicProfile(id, currentUser.id);
  } catch (error) {
    notFound();
  }

  const leagueContext = await getActiveLeagueContext(currentUser.id);

  const avatarValue = profile.user.image || '⚽';
  const flagIso = avatarValue ? getFlagIsoCode(avatarValue) : null;
  const emojiOnly = avatarValue ? isEmoji(avatarValue) : false;

  return (
    <PlayerAppShell activeRoute="leaderboard" user={currentUser} leagueContext={leagueContext}>
      <div className="player-page-stack profile-page">
        <section className="profile-hero player-panel">
          {flagIso ? (
            <div className="profile-avatar-large has-flag" aria-hidden="true">
              <img
                src={`https://flagcdn.com/w80/${flagIso}.png`}
                alt={avatarValue}
                className="avatar-flag-image"
              />
            </div>
          ) : (
            <div className={`profile-avatar-large ${emojiOnly ? 'is-emoji' : ''}`} aria-hidden="true">
              {avatarValue}
            </div>
          )}
          <div className="profile-hero-copy">
            <span className="player-kicker">Perfil Público</span>
            <h2>{profile.user.name}</h2>
            <p>Membro participante do Bolão</p>
          </div>
          <div className="profile-global-rank">
            <span>Pontos Globais</span>
            <strong>{profile.user.points} pts</strong>
          </div>
        </section>

        <section className="profile-stat-grid">
          <article>
            <i className="bi bi-send-check" aria-hidden="true" />
            <span>Palpites Feitos</span>
            <strong>{profile.stats.totalPredictions}</strong>
          </article>
          <article>
            <i className="bi bi-bullseye" aria-hidden="true" />
            <span>Placares Exatos</span>
            <strong>{profile.stats.exactScores}</strong>
          </article>
          <article>
            <i className="bi bi-percent" aria-hidden="true" />
            <span>Aproveitamento</span>
            <strong>{profile.stats.accuracyPercentage}%</strong>
          </article>
          <article>
            <i className="bi bi-lightning-charge" aria-hidden="true" />
            <span>Série de Acertos</span>
            <strong>{profile.user.streak} atual</strong>
          </article>
        </section>

        <div className="profile-two-column">
          <section className="player-panel leagues-panel">
            <div className="player-panel-heading">
              <div>
                <span className="player-kicker">Competição</span>
                <h3>Bolões em comum ou públicos</h3>
              </div>
            </div>
            <div className="profile-leagues-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
              {profile.leagues.map((league) => (
                <article className="profile-league-item" key={league.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', color: '#fff' }}>{league.name}</strong>
                    <small style={{ textTransform: 'capitalize', color: 'rgba(255,255,255,0.5)' }}>Cargo: {league.role === 'owner' ? 'Criador' : 'Participante'}</small>
                  </div>
                  <div className="league-item-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <strong style={{ color: 'var(--neon-green)' }}>{league.points} pts</strong>
                    <Link href={`/leaderboard?league=${league.slug}`} className="player-button secondary small" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                      Ver Classificação
                    </Link>
                  </div>
                </article>
              ))}
              {profile.leagues.length === 0 && (
                <p className="text-secondary p-3 text-center">Nenhum bolão compartilhado ou público encontrado.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </PlayerAppShell>
  );
}
