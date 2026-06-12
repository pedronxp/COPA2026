'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LeagueDetailData, LeagueRankingEntry } from './league-types';
import { JoinLeagueButton } from './join-league-button';

type DetailTab = 'overview' | 'ranking' | 'rules' | 'members' | 'publication';

const tabs: Array<{ id: DetailTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Visão geral', icon: 'grid' },
  { id: 'ranking', label: 'Ranking', icon: 'trophy' },
  { id: 'rules', label: 'Regras', icon: 'sliders' },
  { id: 'members', label: 'Membros', icon: 'people' },
  { id: 'publication', label: 'Publicação', icon: 'broadcast' },
];

const groupModeLabels: Record<string, string> = {
  match: 'A cada partida',
  round: 'Ao fim de cada rodada',
  every_2_rounds: 'A cada duas rodadas',
  every_3_rounds: 'A cada tres rodadas',
  phase: 'Ao fim da fase de grupos',
  manual: 'Publicação manual',
};

const knockoutModeLabels: Record<string, string> = {
  match: 'A cada partida',
  stage: 'Ao fim de cada fase',
  manual: 'Publicação manual',
};

function formatDate(value: string | null, withTime = false) {
  if (!value) return 'Ainda não publicado';
  return new Intl.DateTimeFormat('pt-BR', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(new Date(value));
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Criador';
  if (role === 'subadmin') return 'Subadmin';
  return 'Membro';
}

function statusLabel(status: string) {
  if (status === 'published') return 'Publicado';
  if (status === 'ready') return 'Pronto';
  return 'Em andamento';
}

function RankingTable({ members, currentUserId }: { members: LeagueRankingEntry[]; currentUserId: string }) {
  return (
    <div className="league-table-wrap">
      <table className="league-ranking-table">
        <thead><tr><th>Pos.</th><th>Competidor</th><th>Pontos</th></tr></thead>
        <tbody>
          {members.map((member, index) => (
            <tr key={member.id} className={member.id === currentUserId ? 'current' : ''}>
              <td><span className={`league-rank-number rank-${index + 1}`}>{index + 1}</span></td>
              <td>
                <span className="league-member-cell">
                  <span className="league-avatar" aria-hidden="true">{member.image || member.name.charAt(0)}</span>
                  <span><strong>{member.name}</strong><small>{roleLabel(member.role)}{member.id === currentUserId ? ' / Você' : ''}</small></span>
                  {member.exactScoreStreak >= 3 && (
                    <span className="league-hot-streak" title={`${member.exactScoreStreak} placares exatos seguidos`}>
                      <i className="bi bi-fire" aria-hidden="true"></i>
                      Em alta
                    </span>
                  )}
                </span>
              </td>
              <td><strong>{member.points}</strong><span> pts</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemberActions({
  league,
  member,
}: {
  league: LeagueDetailData;
  member: LeagueRankingEntry;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!league.canManage || member.id === league.currentUserId || member.role === 'owner') return null;

  async function mutate(action: 'promote' | 'demote' | 'remove') {
    if (action === 'remove' && !window.confirm(`Remover ${member.name} deste bolão?`)) return;
    setPending(true);
    setError(null);

    try {
      // Member actions retain the compatibility PUT contract while the redesigned API is introduced.
      const response = await fetch('/api/leagues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: league.id, targetMemberId: member.id, action }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
        throw new Error(typeof record.error === 'string' ? record.error : 'Não foi possível atualizar o membro.');
      }
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível atualizar o membro.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="league-member-actions">
      {member.role === 'member' ? (
        <button type="button" title="Promover a subadmin" onClick={() => mutate('promote')} disabled={pending}>
          <i className="bi bi-shield-plus" aria-hidden="true"></i>
        </button>
      ) : (
        <button type="button" title="Rebaixar para membro" onClick={() => mutate('demote')} disabled={pending}>
          <i className="bi bi-shield-minus" aria-hidden="true"></i>
        </button>
      )}
      <button type="button" className="danger" title="Remover membro" onClick={() => mutate('remove')} disabled={pending}>
        <i className="bi bi-person-x" aria-hidden="true"></i>
      </button>
      {error && <span>{error}</span>}
    </div>
  );
}

export function LeagueDetail({ league }: { league: LeagueDetailData }) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    if (!league.inviteCode) return;
    await navigator.clipboard.writeText(league.inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function shareWhatsApp() {
    const invitation = league.inviteCode ? ` Codigo: ${league.inviteCode}.` : '';
    const text = `Vem participar do bolão ${league.name}!${invitation} ${window.location.href}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <div className={`league-detail-theme theme-${league.visualTheme}`}>
      <div className="league-detail-back">
        <Link href="/leagues"><i className="bi bi-arrow-left" aria-hidden="true"></i> Todos os bolões</Link>
      </div>

      <header className="league-detail-header">
        <div className="league-detail-identity">
          <span className="league-detail-emblem">{league.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <div className="league-card-badges">
              <span className={`league-status ${league.status}`}>{league.status === 'active' ? 'Ativo' : league.status}</span>
              <span className="league-muted-badge"><i className={`bi bi-${league.visibility === 'public' ? 'globe-americas' : 'lock-fill'}`} aria-hidden="true"></i>{league.visibility === 'public' ? 'Público' : 'Privado'}</span>
            </div>
            <h1>{league.name}</h1>
            <p>{league.description || `Bolão criado por ${league.ownerName}`}</p>
          </div>
        </div>
        <div className="league-detail-actions">
          <button type="button" className="btn league-whatsapp-button" onClick={shareWhatsApp}>
            <i className="bi bi-whatsapp" aria-hidden="true"></i>
            Compartilhar
          </button>
          {league.inviteCode && (
            <button type="button" className="btn league-secondary-button" onClick={copyInvite}>
              <i className={`bi bi-${copied ? 'check2' : 'copy'}`} aria-hidden="true"></i>
              {copied ? 'Copiado' : league.inviteCode}
            </button>
          )}
          {!league.isMember && league.status === 'active' && (
            <JoinLeagueButton leagueId={league.id} leagueSlug={league.slug} joinPolicy={league.joinPolicy} />
          )}
        </div>
      </header>

      <nav className="league-detail-tabs" aria-label="Seções do bolão">
        {tabs.map((item) => (
          <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            <i className={`bi bi-${item.icon}`} aria-hidden="true"></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <section className="league-detail-grid">
          <div className="league-detail-primary">
            <div className="league-panel">
              <div className="league-panel-heading"><div><span className="league-eyebrow">Classificação</span><h2>Primeiras posições</h2></div><button type="button" onClick={() => setTab('ranking')}>Ver ranking <i className="bi bi-arrow-right" aria-hidden="true"></i></button></div>
              <RankingTable members={league.members.slice(0, 5)} currentUserId={league.currentUserId} />
            </div>
          </div>
          <aside className="league-detail-aside">
            <div className="league-metric-grid">
              <div><i className="bi bi-people" aria-hidden="true"></i><span>Participantes</span><strong>{league.memberCount}<small> / {league.maxMembers}</small></strong></div>
              <div><i className="bi bi-trophy" aria-hidden="true"></i><span>Líder</span><strong>{league.leader?.name || '-'}</strong></div>
              <div><i className="bi bi-person-check" aria-hidden="true"></i><span>Sua posição</span><strong>{league.userRank ? `${league.userRank}o` : '-'}</strong></div>
              <div><i className="bi bi-stars" aria-hidden="true"></i><span>Seus pontos</span><strong>{league.userPoints ?? '-'}</strong></div>
            </div>
            <div className="league-panel league-publication-summary">
              <span className="league-eyebrow">Atualização do ranking</span>
              <h2>{league.pendingEntryCount ? 'Pontos em processamento' : 'Ranking atualizado'}</h2>
              <p>{league.pendingEntryCount ? `${league.pendingEntryCount} resultados aguardam o próximo ciclo.` : `Última publicação: ${formatDate(league.lastPublishedAt, true)}.`}</p>
              <button type="button" onClick={() => setTab('publication')}>Ver ciclos <i className="bi bi-arrow-right" aria-hidden="true"></i></button>
            </div>
          </aside>
        </section>
      )}

      {tab === 'ranking' && (
        <section className="league-panel league-tab-panel">
          <div className="league-panel-heading"><div><span className="league-eyebrow">Ranking publicado</span><h2>Classificação geral</h2></div><span className="league-update-label"><i className="bi bi-clock-history" aria-hidden="true"></i>{formatDate(league.lastPublishedAt, true)}</span></div>
          <RankingTable members={league.members} currentUserId={league.currentUserId} />
          {!league.isMember && <p className="league-public-note"><i className="bi bi-info-circle" aria-hidden="true"></i>Visitantes veem apenas as cinco primeiras posições.</p>}
        </section>
      )}

      {tab === 'rules' && (
        <section className="league-rules-layout">
          <div className="league-panel">
            <div className="league-panel-heading"><div><span className="league-eyebrow">Pontuação</span><h2>Como os acertos valem pontos</h2></div>{league.rulesLockedAt && <span className="league-lock-label"><i className="bi bi-lock-fill" aria-hidden="true"></i>Regras travadas</span>}</div>
            <div className="league-rules-score-grid">
              <div><span className="exact"><i className="bi bi-bullseye" aria-hidden="true"></i></span><p>Placar exato</p><strong>+{league.pointsExact}</strong></div>
              <div><span><i className="bi bi-arrows-expand" aria-hidden="true"></i></span><p>Saldo correto</p><strong>+{league.pointsDiff}</strong></div>
              <div><span><i className="bi bi-house-door" aria-hidden="true"></i></span><p>Vitória Casa</p><strong>+{league.pointsWinnerHome}</strong></div>
              <div><span><i className="bi bi-dash-circle" aria-hidden="true"></i></span><p>Empate correto</p><strong>+{league.pointsDraw}</strong></div>
              <div><span><i className="bi bi-airplane" aria-hidden="true"></i></span><p>Vitória Fora</p><strong>+{league.pointsWinnerAway}</strong></div>
              <div><span><i className="bi bi-check2-circle" aria-hidden="true"></i></span><p>Ambas marcam: sim</p><strong>+{league.pointsBothScoreYes}</strong></div>
              <div><span><i className="bi bi-x-circle" aria-hidden="true"></i></span><p>Ambas marcam: não</p><strong>+{league.pointsBothScoreNo}</strong></div>
            </div>
            <p className="league-rules-note">O bonus de ambas marcam soma ao nivel mais preciso obtido: placar exato, saldo ou resultado.</p>
          </div>
          <div className="league-panel">
            <span className="league-eyebrow">Limites</span>
            <dl className="league-rule-list">
              <div><dt><i className="bi bi-clock" aria-hidden="true"></i>Janela de palpite</dt><dd>{league.windowHours}h antes do jogo</dd></div>
              <div><dt><i className="bi bi-pencil-square" aria-hidden="true"></i>Edições</dt><dd>{league.maxEdits === 999 ? 'Sem limite' : league.maxEdits}</dd></div>
              <div><dt><i className="bi bi-calendar-check" aria-hidden="true"></i>Início da pontuação</dt><dd>Rodada {league.scoringStartMatchday}</dd></div>
              <div><dt><i className="bi bi-calendar-x" aria-hidden="true"></i>Encerramento</dt><dd>{formatDate(league.expiresAt)}</dd></div>
            </dl>
          </div>
        </section>
      )}

      {tab === 'members' && (
        <section className="league-panel league-tab-panel">
          <div className="league-panel-heading"><div><span className="league-eyebrow">Participantes</span><h2>{league.memberCount} membros ativos</h2></div></div>
          <div className="league-member-list">
            {league.members.map((member, index) => (
              <div className="league-member-row" key={member.id}>
                <span className="league-rank-number">{index + 1}</span>
                <span className="league-avatar" aria-hidden="true">{member.image || member.name.charAt(0)}</span>
                <span className="league-member-name"><strong>{member.name}</strong><small>Entrou em {formatDate(member.joinedAt)}</small></span>
                <span className={`league-role-badge ${member.role}`}>{roleLabel(member.role)}</span>
                <strong className="league-member-points">{member.points} pts</strong>
                <MemberActions league={league} member={member} />
              </div>
            ))}
          </div>
          {!league.isMember && <p className="league-public-note"><i className="bi bi-lock" aria-hidden="true"></i>A lista completa e reservada aos membros.</p>}
        </section>
      )}

      {tab === 'publication' && (
        <section className="league-publication-layout">
          <div className="league-panel">
            <span className="league-eyebrow">Política de publicação</span>
            <div className="league-publication-policy">
              <div><span><i className="bi bi-diagram-3" aria-hidden="true"></i></span><div><small>Fase de grupos</small><strong>{groupModeLabels[league.groupPublicationMode] || league.groupPublicationMode}</strong></div></div>
              <div><span><i className="bi bi-trophy" aria-hidden="true"></i></span><div><small>Mata-mata</small><strong>{knockoutModeLabels[league.knockoutPublicationMode] || league.knockoutPublicationMode}</strong></div></div>
            </div>
          </div>
          <div className="league-panel">
            <div className="league-panel-heading"><div><span className="league-eyebrow">Histórico</span><h2>Ciclos recentes</h2></div>{league.pendingEntryCount > 0 && <span className="league-pending-label">{league.pendingEntryCount} pendentes</span>}</div>
            {league.cycles.length ? (
              <ol className="league-cycle-list">
                {league.cycles.map((cycle) => (
                  <li key={cycle.id}>
                    <span className={`league-cycle-dot ${cycle.status}`}></span>
                    <div><strong>{cycle.key.replaceAll(':', ' / ')}</strong><small>{cycle.publishedAt ? formatDate(cycle.publishedAt, true) : `Criado em ${formatDate(cycle.createdAt)}`}</small></div>
                    <span className={`league-status ${cycle.status}`}>{statusLabel(cycle.status)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="league-compact-empty"><i className="bi bi-hourglass-split" aria-hidden="true"></i><p>O primeiro ciclo aparecerá quando houver resultados.</p></div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
