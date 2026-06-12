'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfileData } from '@/lib/profile-service';
import { PROFILE_AVATARS } from '@/lib/profile-domain';
import { getFlagIsoCode, isEmoji } from '@/lib/emoji-flags';
import {
  formatBothTeamsScorePick,
  formatResultPick,
  formatTotalGoalsPick,
} from '@/lib/prediction-markets';
import { formatDateTimePtBr, formatOrdinalPtBr } from '@/lib/pt-br-format';

interface ProfileViewProps {
  initialData: ProfileData;
}

function adminRoleLabel(role: string) {
  if (role === 'super_admin') return 'Administrador geral';
  if (role === 'operator') return 'Operador';
  if (role === 'moderator') return 'Moderador';
  if (role === 'support') return 'Suporte';
  return 'Admin';
}

function leagueRoleLabel(role: string) {
  if (role === 'owner') return 'Criador';
  if (role === 'subadmin') return 'Subadministrador';
  return 'Participante';
}

function leagueStatusLabel(status: string) {
  if (status === 'closed') return 'Encerrado';
  if (status === 'archived') return 'Arquivado';
  if (status === 'draft') return 'Rascunho';
  return 'Ativo';
}

export function ProfileView({ initialData }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialData);
  const [name, setName] = useState(initialData.user.name);
  const [image, setImage] = useState(initialData.user.image);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível atualizar o perfil.');
      }

      setProfile((current) => ({
        ...current,
        user: {
          ...current.user,
          name: data.user.name,
          image: data.user.image,
        },
      }));
      setNotice({ tone: 'success', text: 'Perfil atualizado.' });
      router.refresh();
    } catch (error) {
      setNotice({
        tone: 'danger',
        text: error instanceof Error ? error.message : 'Erro ao atualizar perfil.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="player-page-stack profile-page">
      <section className="profile-hero player-panel">
        {(() => {
          const imageValue = profile.user.image || 'CDC';
          const flagIso = getFlagIsoCode(imageValue);
          const emojiOnly = isEmoji(imageValue);
          if (flagIso) {
            return (
              <div className="profile-avatar-large has-flag" aria-hidden="true">
                <img
                  src={`https://flagcdn.com/w80/${flagIso}.png`}
                  alt={imageValue}
                  className="avatar-flag-image"
                />
              </div>
            );
          }
          return (
            <div className={`profile-avatar-large ${emojiOnly ? 'is-emoji' : ''}`} aria-hidden="true">
              {imageValue}
            </div>
          );
        })()}
        <div className="profile-hero-copy">
          <span className="player-kicker">Conta do jogador</span>
          <h2>{profile.user.name}</h2>
          <p>{profile.user.email}</p>
          {profile.user.adminRole !== 'none' && (
            <Link className="profile-admin-badge" href="/admin">
              <i className="bi bi-shield-lock-fill" aria-hidden="true" />
              {adminRoleLabel(profile.user.adminRole)}
            </Link>
          )}
        </div>
        <div className="profile-global-rank">
          <span>Rank global</span>
          <strong>{formatOrdinalPtBr(profile.globalRanking.rank)}</strong>
          <small>
            {profile.globalRanking.memberCount}{' '}
            {profile.globalRanking.memberCount === 1 ? 'participante' : 'participantes'}
          </small>
        </div>
      </section>

      <section className="profile-stat-grid">
        <article>
          <i className="bi bi-stars" aria-hidden="true" />
          <span>Pontos globais</span>
          <strong>{profile.user.points}</strong>
        </article>
        <article>
          <i className="bi bi-send-check" aria-hidden="true" />
          <span>Palpites feitos</span>
          <strong>{profile.stats.totalPredictions}</strong>
        </article>
        <article>
          <i className="bi bi-bullseye" aria-hidden="true" />
          <span>Placares exatos</span>
          <strong>{profile.stats.exactScores}</strong>
        </article>
        <article>
          <i className="bi bi-lightning-charge" aria-hidden="true" />
          <span>Sequência atual</span>
          <strong>{profile.user.streak}</strong>
        </article>
      </section>

      <section className="player-panel profile-edit-panel">
        <div className="player-panel-heading">
          <div>
            <span className="player-kicker">Personalização</span>
            <h3>Nome e avatar</h3>
          </div>
        </div>
        {notice && <div className={`player-alert ${notice.tone}`}>{notice.text}</div>}
        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            <span>Nome exibido</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </label>
          <fieldset>
            <legend>Avatar</legend>
            <div className="profile-avatar-options">
              {PROFILE_AVATARS.map((avatar) => {
                const flagIso = getFlagIsoCode(avatar.value);
                const emojiOnly = isEmoji(avatar.value);
                const classes = [
                  image === avatar.value ? 'active' : '',
                  flagIso ? 'has-flag' : '',
                  emojiOnly && !flagIso ? 'is-emoji' : '',
                ].filter(Boolean).join(' ');

                return (
                  <button
                    key={avatar.value}
                    type="button"
                    className={classes}
                    onClick={() => setImage(avatar.value)}
                    aria-pressed={image === avatar.value}
                    title={avatar.label}
                  >
                    {flagIso ? (
                      <img
                        src={`https://flagcdn.com/w80/${flagIso}.png`}
                        alt={avatar.label}
                        className="avatar-flag-image"
                      />
                    ) : (
                      avatar.value
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="profile-form-actions">
            <button className="btn btn-neon-green" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
            <span>O e-mail e as permissões não podem ser alterados aqui.</span>
          </div>
        </form>
      </section>

      <section className="player-panel profile-ranking-panel">
        <div className="player-panel-heading">
          <div>
            <span className="player-kicker">Classificação geral</span>
            <h3>Top 5 global</h3>
          </div>
          <Link href="/leaderboard?league=global" className="leaderboard-updated">Ver ranking</Link>
        </div>
        <div className="profile-ranking-list">
          {profile.globalRanking.topFive.map((member) => {
            const avatarVal = member.image || member.name.slice(0, 1);
            const flagIso = member.image ? getFlagIsoCode(member.image) : null;
            const emojiOnly = member.image ? isEmoji(member.image) : false;

            return (
              <div key={member.id} className={member.id === profile.user.id ? 'current' : ''}>
                <strong>#{member.rank}</strong>
                {flagIso ? (
                  <span className="has-flag">
                    <img
                      src={`https://flagcdn.com/w80/${flagIso}.png`}
                      alt={member.name}
                      className="avatar-flag-image"
                    />
                  </span>
                ) : (
                  <span className={emojiOnly ? 'is-emoji' : ''}>
                    {avatarVal}
                  </span>
                )}
                <b>{member.name}</b>
                <small>{member.points} pts</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="player-panel profile-leagues-panel">
        <div className="player-panel-heading">
          <div>
            <span className="player-kicker">Comunidades</span>
            <h3>Seus bolões</h3>
          </div>
          <Link href="/leagues" className="leaderboard-updated">Gerenciar</Link>
        </div>
        <div className="profile-league-list">
          {profile.leagues.map((league) => (
            <Link
              key={league.id}
              href={league.id === 'global' ? '/dashboard?league=global' : `/dashboard?league=${league.slug}`}
            >
              <div>
                <strong>{league.name}</strong>
                <small>{leagueRoleLabel(league.role)} - {leagueStatusLabel(league.status)}</small>
              </div>
              <span>{league.points} pts</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="player-panel profile-history-panel">
        <div className="player-panel-heading">
          <div>
            <span className="player-kicker">Atividade recente</span>
            <h3>Histórico de palpites</h3>
          </div>
          <Link href="/history" className="leaderboard-updated">Ver histórico completo</Link>
        </div>
        {profile.recentPredictions.length > 0 ? (
          <div className="profile-history-list">
            {profile.recentPredictions.map((prediction) => {
              const isFinished =
                prediction.matchStatus === 'finished' &&
                prediction.homeScore !== null &&
                prediction.awayScore !== null;

              return (
                <article key={prediction.id}>
                  <div className="profile-history-main">
                    <span className="profile-history-ball" aria-hidden="true">
                      <i className="bi bi-dribbble" />
                    </span>
                    <div>
                      <strong>{prediction.homeTeam} x {prediction.awayTeam}</strong>
                      <small>
                        Seu palpite: {prediction.homeGuess} x {prediction.awayGuess} -{' '}
                        {formatResultPick(prediction.resultPick)} -{' '}
                        {formatTotalGoalsPick(prediction.totalGoalsPick)} - Ambas:{' '}
                        {formatBothTeamsScorePick(prediction.bothTeamsScorePick)} -{' '}
                        {prediction.leagueName}
                      </small>
                    </div>
                  </div>
                  <div className="profile-history-status">
                    <span className={isFinished ? 'finished' : 'waiting'}>
                      {isFinished ? `Resultado: ${prediction.homeScore} x ${prediction.awayScore}` : 'Aguardando resultado'}
                    </span>
                    <small>{formatDateTimePtBr(prediction.kickOff)}</small>
                  </div>
                  <b className={prediction.points && prediction.points > 0 ? 'positive' : ''}>
                    {prediction.points === null ? 'Pendente' : `+${prediction.points} pts`}
                  </b>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="player-empty-state">
            <i className="bi bi-clock-history" aria-hidden="true" />
            <h3>Nenhum palpite registrado</h3>
            <Link href="/matches" className="btn btn-neon-green">Dar primeiro palpite</Link>
          </div>
        )}
      </section>
    </div>
  );
}
