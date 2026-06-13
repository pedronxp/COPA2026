'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import type { LeagueDetailData, LeagueRankingEntry } from './league-types';
import { JoinLeagueButton } from './join-league-button';
import { SCORING_PRESETS } from '@/lib/league-domain';
import { formatStagePtBr } from '@/lib/pt-br-format';
import { getFlagIsoCode, isEmoji } from '@/lib/emoji-flags';

type DetailTab = 'overview' | 'ranking' | 'rules' | 'members' | 'publication' | 'settings';

const tabs: Array<{ id: DetailTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Visão geral', icon: 'grid' },
  { id: 'ranking', label: 'Ranking', icon: 'trophy' },
  { id: 'rules', label: 'Regras', icon: 'sliders' },
  { id: 'members', label: 'Membros', icon: 'people' },
  { id: 'publication', label: 'Histórico', icon: 'clock-history' },
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

function getAvatarStyle(name: string) {
  const charCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = charCode % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 45) % 360}, 75%, 35%))`,
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };
}

function RankingTable({ 
  members, 
  currentUserId,
  onMemberClick
}: { 
  members: LeagueRankingEntry[]; 
  currentUserId: string;
  onMemberClick?: (member: LeagueRankingEntry) => void;
}) {
  if (!members.length) {
    return (
      <div className="league-compact-empty">
        <i className="bi bi-trophy" aria-hidden="true"></i>
        <p>Este bolão ainda não tem participantes ativos para classificar.</p>
      </div>
    );
  }

  const leader = members[0];
  const second = members[1];
  const third = members[2];
  const tableMembers = members.slice(3);

  function PodiumCard({
    member,
    tone,
    rank,
  }: {
    member: LeagueRankingEntry;
    tone: 'gold' | 'silver' | 'bronze';
    rank: number;
  }) {
    const avatarStyle = getAvatarStyle(member.name);
    const isGold = tone === 'gold';
    const isSuperCombo = member.exactScoreStreak >= 3;
    const flagIso = member.image ? getFlagIsoCode(member.image) : null;
    const emojiOnly = member.image ? isEmoji(member.image) : false;

    return (
      <article 
        className={`leaderboard-podium-card ${tone} ${isSuperCombo ? 'super-combo' : ''}`}
        style={{ cursor: onMemberClick ? 'pointer' : 'default' }}
        onClick={onMemberClick ? () => onMemberClick(member) : undefined}
        role="group" 
        aria-label={`Pódio ${rank}º lugar: ${member.name}`}
      >
        <span className="leaderboard-rank-badge" aria-hidden="true">
          {isGold ? <i className="bi bi-crown-fill" /> : `#${rank}`}
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
            {member.image || member.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h3>{member.name}</h3>
        <strong>{member.points} pts</strong>
        
        <div className="leaderboard-podium-meta animate__animated animate__pulse animate__infinite animate__slower" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
          {member.exactScoreStreak >= 3 && (
            <span className="league-hot-streak py-0.5 px-2" title={`${member.exactScoreStreak} placares exatos seguidos`} style={{ fontSize: '0.65rem' }}>
              <i className="bi bi-fire" aria-hidden="true" /> Em alta
            </span>
          )}
          {member.pendingPoints > 0 && <small className="text-neon-green" style={{ fontSize: '0.65rem' }}>+{member.pendingPoints} pendentes</small>}
        </div>
      </article>
    );
  }

  return (
    <div className="league-ranking-container animate__animated animate__fadeIn">
      {/* Pódio Visual de Líderes */}
      <section className="leaderboard-podium mb-4 py-2" aria-label="Pódio dos líderes">
        {second && <PodiumCard member={second} tone="silver" rank={2} />}
        {leader && <PodiumCard member={leader} tone="gold" rank={1} />}
        {third && <PodiumCard member={third} tone="bronze" rank={3} />}
      </section>

      {/* Tabela de Posições a partir da 4ª colocação */}
      {tableMembers.length > 0 && (
        <div className="league-table-wrap mt-3">
          <table className="league-ranking-table">
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Competidor</th>
                <th>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {tableMembers.map((member, index) => {
                const realRank = index + 4;
                return (
                  <tr 
                    key={member.id} 
                    className={member.id === currentUserId ? 'current' : ''}
                    style={onMemberClick ? { cursor: 'pointer' } : undefined}
                    onClick={onMemberClick ? () => onMemberClick(member) : undefined}
                    title={onMemberClick ? `Ver perfil e palpites de ${member.name}` : undefined}
                  >
                    <td>
                      <span className={`league-rank-number rank-${realRank}`}>
                        {realRank}
                      </span>
                    </td>
                    <td>
                      <span className="league-member-cell">
                        <span className="league-avatar" aria-hidden="true">
                          {member.image || member.name.charAt(0)}
                        </span>
                        <span>
                          <strong>{member.name}</strong>
                          <small>
                            {roleLabel(member.role)}
                            {member.id === currentUserId ? ' / Você' : ''}
                          </small>
                        </span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
    </div>
  );
}

export function LeagueDetail({ league }: { league: LeagueDetailData }) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [copied, setCopied] = useState(false);

  // Estados para aba Settings
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);
  const [showOwnerEditConfirm, setShowOwnerEditConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LeagueRankingEntry | null>(null);
  const [memberPreds, setMemberPreds] = useState<any[]>([]);
  const [loadingPreds, setLoadingPreds] = useState(false);
  const [predsError, setPredsError] = useState<string | null>(null);

  // Perfil Público do Competidor
  const [selectedMemberTab, setSelectedMemberTab] = useState<'profile' | 'preds'>('profile');
  const [publicProfile, setPublicProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Histórico da Liga
  const [historyData, setHistoryData] = useState<any[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Fetch Perfil Público do Competidor
  useEffect(() => {
    if (!selectedMember) {
      setPublicProfile(null);
      setSelectedMemberTab('profile');
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);
    fetch(`/api/profile?userId=${selectedMember.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível carregar o perfil do competidor.');
        return res.json();
      })
      .then(data => {
        setPublicProfile(data.profile);
      })
      .catch(err => {
        setProfileError(err.message);
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, [selectedMember]);

  // Fetch Palpites do Competidor neste Bolão
  useEffect(() => {
    if (!selectedMember) {
      setMemberPreds([]);
      return;
    }
    setLoadingPreds(true);
    setPredsError(null);
    fetch(`/api/predictions?leagueId=${league.id}&targetUserId=${selectedMember.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível carregar o histórico de palpites.');
        return res.json();
      })
      .then(data => {
        setMemberPreds(data);
      })
      .catch(err => {
        setPredsError(err.message);
      })
      .finally(() => {
        setLoadingPreds(false);
      });
  }, [selectedMember, league.id]);

  // Fetch Histórico da Liga (jogos concluídos e acertos)
  useEffect(() => {
    if (tab !== 'publication') return;
    setLoadingHistory(true);
    setHistoryError(null);
    fetch(`/api/leagues/${league.slug || league.id}/history`)
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível carregar o histórico do bolão.');
        return res.json();
      })
      .then(data => {
        setHistoryData(data);
      })
      .catch(err => {
        setHistoryError(err.message);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [tab, league.slug, league.id]);
  const [formData, setFormData] = useState({
    name: league.name,
    description: league.description || '',
    visualTheme: league.visualTheme,
    visibility: league.visibility,
    joinPolicy: league.joinPolicy,
    maxMembers: league.maxMembers,
    scoringPreset: league.scoringPreset,
    pointsExact: league.pointsExact,
    pointsDiff: league.pointsDiff,
    pointsWinnerHome: league.pointsWinnerHome,
    pointsWinnerAway: league.pointsWinnerAway,
    pointsDraw: league.pointsDraw,
    pointsBothScoreYes: league.pointsBothScoreYes,
    pointsBothScoreNo: league.pointsBothScoreNo,
    windowHours: league.windowHours,
    maxEdits: league.maxEdits,
    scoringStartMatchday: league.scoringStartMatchday,
    groupPublicationMode: league.groupPublicationMode,
    knockoutPublicationMode: league.knockoutPublicationMode,
    expiresAt: league.expiresAt ? new Date(league.expiresAt).toISOString().split('T')[0] : '',
  });
  const ownerEditLocked = false;
  const competitiveFieldsDisabled = false;

  const activeTabs = league.userRole === 'owner'
    ? [...tabs, { id: 'settings' as DetailTab, label: 'Configurações', icon: 'gear' }]
    : tabs;

  function handlePresetChange(preset: string) {
    if (preset === 'custom') {
      setFormData(prev => ({ ...prev, scoringPreset: 'custom' }));
      return;
    }
    const rules = SCORING_PRESETS[preset as keyof typeof SCORING_PRESETS]?.rules;
    if (rules) {
      setFormData(prev => ({
        ...prev,
        scoringPreset: preset,
        ...rules,
      }));
    }
  }

  function updateRuleValue(key: string, val: number) {
    setFormData(prev => ({
      ...prev,
      [key]: val,
      scoringPreset: 'custom',
    }));
  }

  function handleInputChange(key: string, value: string | number) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ownerEditLocked || !league.ownerEdit.available) return;
    setShowOwnerEditConfirm(true);
  }

  function submitOwnerEdit() {
    if (ownerEditLocked || !league.ownerEdit.available) return;
    setShowOwnerEditConfirm(false);
    setSettingsError(null);
    setSettingsSuccess(false);

    startTransition(async () => {
      try {
        const response = await fetch('/api/leagues', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leagueId: league.id,
            ...formData,
          }),
        });

        const payload: unknown = await response.json();
        if (!response.ok) {
          const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
          throw new Error(typeof record.error === 'string' ? record.error : 'Não foi possível salvar as configurações.');
        }

        setSettingsSuccess(true);
        router.refresh();
        setTab('overview');
      } catch (err) {
        setSettingsError(err instanceof Error ? err.message : 'Não foi possível salvar as configurações.');
      }
    });
  }

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
        {activeTabs.map((item) => (
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
              <RankingTable members={league.members.slice(0, 5)} currentUserId={league.currentUserId} onMemberClick={setSelectedMember} />
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
          <RankingTable members={league.members} currentUserId={league.currentUserId} onMemberClick={setSelectedMember} />
          {!league.isMember && <p className="league-public-note"><i className="bi bi-info-circle" aria-hidden="true"></i>Visitantes veem apenas as cinco primeiras posições.</p>}
        </section>
      )}

      {tab === 'rules' && (
        <section className="league-rules-layout">
          <div className="league-panel">
            <div className="league-panel-heading"><div><span className="league-eyebrow">Pontuação</span><h2>Como os acertos valem pontos</h2></div>{league.rulesLockedAt && <span className="league-lock-label"><i className="bi bi-lock-fill" aria-hidden="true"></i>Regras travadas</span>}</div>
            <div className="league-rules-score-grid">
              <div><span className="exact"><i className="bi bi-bullseye" aria-hidden="true"></i></span><p>Placar exato</p><strong>+{league.pointsExact}</strong></div>
              <div><span><i className="bi bi-arrows-expand" aria-hidden="true"></i></span><p>Total de gols</p><strong>+{league.pointsDiff}</strong></div>
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
        <section className="league-history-section animate__animated animate__fadeIn">
          <div className="league-panel p-4 mb-4" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '8px' }}>
            <h5 className="text-info fw-bold mb-2.5 d-flex align-items-center gap-2" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
              <i className="bi bi-clock-history text-info" style={{ fontSize: '1.1rem' }}></i> Histórico de Palpites do Grupo
            </h5>
            <p className="text-secondary mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.45' }}>
              Abaixo são listados os jogos finalizados e consolidados neste bolão, mostrando detalhadamente onde cada participante pontuou.
            </p>
          </div>

          {loadingHistory ? (
            <div className="text-center py-5 text-secondary">
              <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <span>Carregando histórico do bolão...</span>
            </div>
          ) : historyError ? (
            <div className="p-4 rounded bg-danger bg-opacity-10 border border-danger border-opacity-20 text-danger text-center">
              <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
              {historyError}
            </div>
          ) : historyData && historyData.length > 0 ? (
            <div className="d-flex flex-column gap-4">
              {historyData.map((item: any) => {
                const matchDate = new Date(item.match.kickOff);
                const formattedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(matchDate);

                return (
                  <div key={item.match.id} className="league-panel p-3 border border-secondary border-opacity-10 rounded">
                    {/* Cabeçalho do jogo */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom border-secondary border-opacity-10 pb-2.5 mb-3">
                      <span className="badge bg-dark border border-secondary border-opacity-20 text-secondary px-2.5 py-1" style={{ fontSize: '0.7rem' }}>
                        {formatStagePtBr(item.match.stage)}
                        {item.match.group ? ` • Grupo ${item.match.group}` : ''}
                      </span>
                      <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-calendar-event me-1"></i> {formattedDate}
                      </small>
                    </div>

                    {/* Placar e times */}
                    <div className="d-flex align-items-center justify-content-center gap-3 py-2 text-white">
                      <div className="d-flex align-items-center gap-2 w-40 justify-content-end text-end font-display fw-semibold" style={{ fontSize: '0.9rem' }}>
                        <span>{item.match.homeTeam}</span>
                        <span style={{ fontSize: '1.25rem' }}>{item.match.homeFlag || '⚽'}</span>
                      </div>
                      <div className="px-3 py-1 bg-dark bg-opacity-40 border border-secondary border-opacity-10 rounded text-info font-display fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                        {item.match.homeScore} x {item.match.awayScore}
                      </div>
                      <div className="d-flex align-items-center gap-2 w-40 justify-content-start text-start font-display fw-semibold" style={{ fontSize: '0.9rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{item.match.awayFlag || '⚽'}</span>
                        <span>{item.match.awayTeam}</span>
                      </div>
                    </div>

                    {/* Palpites corretos dos membros */}
                    <div className="mt-3">
                      <div className="text-secondary fw-semibold mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                        <i className="bi bi-award-fill text-warning"></i>
                        <span>Acertos do grupo nesta partida:</span>
                      </div>

                      {item.winners.length > 0 ? (
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                          {item.winners.map((winner: any) => {
                            const charCode = winner.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                            const hue = charCode % 360;
                            const avatarStyle = {
                              background: `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 45) % 360}, 75%, 35%))`,
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              flexShrink: 0
                            };

                            return (
                              <div key={winner.userId} className="d-flex flex-wrap align-items-center justify-content-between p-2 rounded bg-dark bg-opacity-30 border border-secondary border-opacity-5 gap-2">
                                <div 
                                  className="d-flex align-items-center gap-2"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setSelectedMember({ id: winner.userId, name: winner.name, image: winner.image } as any)}
                                  title={`Ver perfil de ${winner.name}`}
                                >
                                  {winner.image ? (
                                    <span style={{ fontSize: '1.15rem' }}>{winner.image}</span>
                                  ) : (
                                    <div style={avatarStyle}>
                                      {winner.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="d-flex flex-column">
                                    <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>{winner.name}</span>
                                    <span className="text-secondary" style={{ fontSize: '0.68rem' }}>
                                      Palpitou: <strong>{winner.prediction.homeGuess} x {winner.prediction.awayGuess}</strong>
                                    </span>
                                  </div>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <span className="text-neon-green fw-bold me-1" style={{ fontSize: '0.82rem' }}>
                                    +{winner.totalPoints} pts
                                  </span>
                                  <div className="d-flex flex-wrap gap-1">
                                    {winner.hits.map((hit: any, hIdx: number) => {
                                      let bg = 'rgba(100, 116, 139, 0.12)';
                                      let color = '#94a3b8';
                                      let border = '1px solid rgba(100, 116, 139, 0.25)';
                                      let icon = '🤝';

                                      if (hit.type === 'exact') {
                                        bg = 'rgba(16, 185, 129, 0.12)';
                                        color = '#10b981';
                                        border = '1px solid rgba(16, 185, 129, 0.25)';
                                        icon = '🎯';
                                      } else if (hit.type === 'result') {
                                        bg = 'rgba(139, 92, 246, 0.12)';
                                        color = '#a78bfa';
                                        border = '1px solid rgba(139, 92, 246, 0.25)';
                                        icon = '🏆';
                                      } else if (hit.type === 'totalGoals') {
                                        bg = 'rgba(6, 182, 212, 0.12)';
                                        color = '#22d3ee';
                                        border = '1px solid rgba(6, 182, 212, 0.25)';
                                        icon = '⚽';
                                      } else if (hit.type === 'bothTeamsScore') {
                                        bg = 'rgba(20, 184, 166, 0.12)';
                                        color = '#2dd4bf';
                                        border = '1px solid rgba(20, 184, 166, 0.25)';
                                        icon = '🤝';
                                      }

                                      return (
                                        <span 
                                          key={hIdx} 
                                          style={{
                                            background: bg,
                                            color: color,
                                            border: border,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.62rem',
                                            fontWeight: '600',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            whiteSpace: 'nowrap'
                                          }}
                                          title={hit.label}
                                        >
                                          <span>{icon}</span>
                                          <span>{hit.label} (+{hit.points})</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-dark bg-opacity-25 rounded border border-secondary border-opacity-5 text-center text-secondary" style={{ fontSize: '0.78rem' }}>
                          Ninguém pontuou nesta partida.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="league-compact-empty">
              <i className="bi bi-hourglass-split" aria-hidden="true"></i>
              <p>Nenhuma partida finalizada e publicada neste bolão ainda.</p>
            </div>
          )}
        </section>
      )}

      {tab === 'settings' && (
        <section className="league-panel league-tab-panel">
          <div className="league-panel-heading">
            <div>
              <span className="league-eyebrow">Configurações</span>
              <h2>Ajustes do seu bolão</h2>
            </div>
          </div>

          {ownerEditLocked ? (
            <div className="league-edited-blocked">
              <i className="bi bi-lock-fill" aria-hidden="true"></i>
              <h3>Edição do dono bloqueada</h3>
              <p>{league.ownerEdit.lockMessage || 'A edição única deste bolão já foi usada e novas alterações do dono estão bloqueadas.'}</p>
              {league.ownerEdit.usedAt && <small>Usada em {formatDate(league.ownerEdit.usedAt, true)}.</small>}
            </div>
          ) : (
            <form onSubmit={handleSettingsSubmit} className="league-settings-form">
              <div className="league-owner-edit-callout" style={{ background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                <i className="bi bi-info-circle text-info" aria-hidden="true"></i>
                <div>
                  <strong>Edição de Configurações Liberada</strong>
                  <p>Você pode alterar o nome, presets de pontos e regras competitivas a qualquer momento. Modificações na pontuação das regras acionam um recálculo automático e retroativo dos palpites finalizados.</p>
                </div>
              </div>
              {settingsError && (
                <div className="league-form-feedback error" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', fontSize: '0.82rem' }}>
                  <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" style={{ marginRight: '8px' }}></i>
                  {settingsError}
                </div>
              )}
              {settingsSuccess && (
                <div className="league-form-feedback success" style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', color: '#10b981', fontSize: '0.82rem' }}>
                  <i className="bi bi-check-circle-fill" aria-hidden="true" style={{ marginRight: '8px' }}></i>
                  Configurações salvas com sucesso!
                </div>
              )}

              <div className="league-settings-grid">
                {/* Seção 1: Geral */}
                <div className="league-settings-section">
                  <h3>Geral</h3>
                  <div className="league-settings-field">
                    <label htmlFor="settings-name">Nome do bolão</label>
                    <input
                      id="settings-name"
                      type="text"
                      required
                      minLength={3}
                      maxLength={80}
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-description">Descrição</label>
                    <textarea
                      id="settings-description"
                      rows={3}
                      value={formData.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                    />
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-theme">Tema visual</label>
                    <select
                      id="settings-theme"
                      value={formData.visualTheme}
                      onChange={e => handleInputChange('visualTheme', e.target.value)}
                    >
                      <option value="pulse">Pulse (Verde/Neon)</option>
                      <option value="stadium">Stadium (Azul)</option>
                      <option value="classic">Classic (Tradicional)</option>
                    </select>
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-visibility">Visibilidade</label>
                    <select
                      id="settings-visibility"
                      value={formData.visibility}
                      onChange={e => handleInputChange('visibility', e.target.value)}
                    >
                      <option value="public">Público</option>
                      <option value="private">Privado</option>
                    </select>
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-join">Política de entrada</label>
                    <select
                      id="settings-join"
                      value={formData.joinPolicy}
                      onChange={e => handleInputChange('joinPolicy', e.target.value)}
                    >
                      <option value="open">Aberto (Qualquer um com link entra)</option>
                      <option value="approval">Aprovação requerida</option>
                      <option value="invite">Apenas convite</option>
                    </select>
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-max-members">Máximo de participantes</label>
                    <input
                      id="settings-max-members"
                      type="number"
                      min={2}
                      max={10000}
                      value={formData.maxMembers}
                      onChange={e => handleInputChange('maxMembers', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Seção 2: Pontuação & Regras */}
                <div className="league-settings-section">
                  <h3>Preset & Regras</h3>
                  <div className="league-settings-field">
                    <label htmlFor="settings-preset">Preset de pontuação</label>
                    <select
                      id="settings-preset"
                      value={formData.scoringPreset}
                      onChange={e => handlePresetChange(e.target.value)}
                      disabled={competitiveFieldsDisabled || isPending}
                    >
                      <option value="standard">Padrão Copa dos Crias</option>
                      <option value="casual">Casual (Amigável)</option>
                      <option value="exact">Foco no placar exato</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div className="league-settings-rules-grid">
                    <div className="league-settings-field">
                      <label htmlFor="rule-exact">Placar exato</label>
                      <input
                        id="rule-exact"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.pointsExact}
                        onChange={e => updateRuleValue('pointsExact', Number(e.target.value))}
                        disabled={competitiveFieldsDisabled || isPending}
                      />
                    </div>
                    <div className="league-settings-field">
                      <label htmlFor="rule-diff">Total de Gols (Over/Under)</label>
                      <input
                        id="rule-diff"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.pointsDiff}
                        onChange={e => updateRuleValue('pointsDiff', Number(e.target.value))}
                        disabled={competitiveFieldsDisabled || isPending}
                      />
                    </div>
                    <div className="league-settings-field">
                      <label htmlFor="rule-winner-home">Vitória Casa</label>
                      <input
                        id="rule-winner-home"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.pointsWinnerHome}
                        onChange={e => updateRuleValue('pointsWinnerHome', Number(e.target.value))}
                        disabled={competitiveFieldsDisabled || isPending}
                      />
                    </div>
                    <div className="league-settings-field">
                      <label htmlFor="rule-winner-away">Vitória Fora</label>
                      <input
                        id="rule-winner-away"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.pointsWinnerAway}
                        onChange={e => updateRuleValue('pointsWinnerAway', Number(e.target.value))}
                        disabled={competitiveFieldsDisabled || isPending}
                      />
                    </div>
                    <div className="league-settings-field">
                      <label htmlFor="rule-draw">Empate correto</label>
                      <input
                        id="rule-draw"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.pointsDraw}
                        onChange={e => updateRuleValue('pointsDraw', Number(e.target.value))}
                        disabled={competitiveFieldsDisabled || isPending}
                      />
                    </div>
                    <div className="league-settings-field">
                      <label htmlFor="rule-both-yes">Ambas marcam (Sim)</label>
                      <input
                        id="rule-both-yes"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.pointsBothScoreYes}
                        onChange={e => updateRuleValue('pointsBothScoreYes', Number(e.target.value))}
                        disabled={competitiveFieldsDisabled || isPending}
                      />
                    </div>
                    <div className="league-settings-field">
                      <label htmlFor="rule-both-no">Ambas marcam (Não)</label>
                      <input
                        id="rule-both-no"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.pointsBothScoreNo}
                        onChange={e => updateRuleValue('pointsBothScoreNo', Number(e.target.value))}
                        disabled={competitiveFieldsDisabled || isPending}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 3: Funcionamento */}
                <div className="league-settings-section">
                  <h3>Funcionamento</h3>
                  <div className="league-settings-field">
                    <label htmlFor="settings-window">Janela de palpites (horas)</label>
                    <input
                      id="settings-window"
                      type="number"
                      min={1}
                      max={168}
                      value={formData.windowHours}
                      onChange={e => handleInputChange('windowHours', Number(e.target.value))}
                      disabled={competitiveFieldsDisabled || isPending}
                    />
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-max-edits">Limite de edições por palpite</label>
                    <select
                      id="settings-max-edits"
                      value={formData.maxEdits}
                      onChange={e => handleInputChange('maxEdits', Number(e.target.value))}
                      disabled={competitiveFieldsDisabled || isPending}
                    >
                      <option value={1}>1 edição</option>
                      <option value={3}>3 edições</option>
                      <option value={5}>5 edições</option>
                      <option value={999}>Sem limite</option>
                    </select>
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-start-matchday">Rodada de início</label>
                    <input
                      id="settings-start-matchday"
                      type="number"
                      min={1}
                      max={38}
                      value={formData.scoringStartMatchday}
                      onChange={e => handleInputChange('scoringStartMatchday', Number(e.target.value))}
                      disabled={competitiveFieldsDisabled || isPending}
                    />
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-expires-at">Encerramento</label>
                    <input
                      id="settings-expires-at"
                      type="date"
                      value={formData.expiresAt}
                      onChange={e => handleInputChange('expiresAt', e.target.value)}
                      disabled={competitiveFieldsDisabled || isPending}
                    />
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-group-mode">Publicação na Fase de Grupos</label>
                    <select
                      id="settings-group-mode"
                      value={formData.groupPublicationMode}
                      onChange={e => handleInputChange('groupPublicationMode', e.target.value)}
                      disabled={competitiveFieldsDisabled || isPending}
                    >
                      <option value="match">A cada partida</option>
                      <option value="round">Ao fim de cada rodada</option>
                      <option value="every_2_rounds">A cada duas rodadas</option>
                      <option value="every_3_rounds">A cada três rodadas</option>
                      <option value="phase">Ao fim da fase de grupos</option>
                      <option value="manual">Publicação manual</option>
                    </select>
                  </div>
                  <div className="league-settings-field">
                    <label htmlFor="settings-knockout-mode">Publicação no Mata-mata</label>
                    <select
                      id="settings-knockout-mode"
                      value={formData.knockoutPublicationMode}
                      onChange={e => handleInputChange('knockoutPublicationMode', e.target.value)}
                      disabled={competitiveFieldsDisabled || isPending}
                    >
                      <option value="match">A cada partida</option>
                      <option value="stage">Ao fim de cada fase</option>
                      <option value="manual">Publicação manual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="league-settings-submit-wrap">
                <button type="submit" className="btn league-primary-button" disabled={isPending}>
                  {isPending ? 'Salvando...' : 'Revisar e Salvar Configurações'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
      {showOwnerEditConfirm && (
        <div className="league-modal-backdrop" role="presentation">
          <div
            className="league-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-edit-confirm-title"
          >
            <div className="league-confirm-modal-icon">
              <i className="bi bi-exclamation-diamond" aria-hidden="true"></i>
            </div>
            <div>
              <span className="league-eyebrow">Confirmação obrigatória</span>
              <h2 id="owner-edit-confirm-title">Salvar alterações do bolão?</h2>
              <p>
                Esta ação salvará as configurações atuais do bolão. Se você alterar valores de pontuação competitiva,
                o sistema recalculará retroativamente os pontos e saldos de todos os palpites finalizados no bolão.
              </p>
            </div>
            <div className="league-confirm-modal-actions">
              <button
                type="button"
                className="btn league-secondary-button"
                onClick={() => setShowOwnerEditConfirm(false)}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn league-primary-button"
                onClick={submitOwnerEdit}
                disabled={isPending}
              >
                {isPending ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedMember && (
        <div 
          className="league-modal-backdrop animate__animated animate__fadeIn animate__fast" 
          role="presentation"
          onClick={() => setSelectedMember(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="league-confirm-modal animate__animated animate__zoomIn animate__fast"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              padding: '24px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <span className="league-avatar" aria-hidden="true" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                  {selectedMember.image || selectedMember.name.charAt(0)}
                </span>
                <h3 className="text-white fw-bold m-0" style={{ fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
                  Perfil de {selectedMember.name}
                </h3>
              </div>
              <button 
                type="button" 
                className="border-0 bg-transparent text-secondary hover-text-white d-flex align-items-center justify-content-center" 
                onClick={() => setSelectedMember(null)}
                aria-label="Fechar"
                style={{ cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            {/* Header Tabs */}
            <div className="d-flex border-bottom border-secondary border-opacity-10 mb-3 text-center" style={{ fontSize: '0.8rem' }}>
              <button
                type="button"
                className={`flex-fill border-0 bg-transparent py-2 fw-semibold ${selectedMemberTab === 'profile' ? 'text-info border-bottom border-2 border-info' : 'text-secondary'}`}
                onClick={() => setSelectedMemberTab('profile')}
                style={{ cursor: 'pointer' }}
              >
                <i className="bi bi-person-fill me-1"></i> Perfil
              </button>
              <button
                type="button"
                className={`flex-fill border-0 bg-transparent py-2 fw-semibold ${selectedMemberTab === 'preds' ? 'text-info border-bottom border-2 border-info' : 'text-secondary'}`}
                onClick={() => setSelectedMemberTab('preds')}
                style={{ cursor: 'pointer' }}
              >
                <i className="bi bi-clock-history me-1"></i> Palpites no Bolão
              </button>
            </div>

            {/* Content area */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {selectedMemberTab === 'profile' && (
                <div>
                  {loadingProfile ? (
                    <div className="text-center py-5 text-secondary">
                      <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                        <span className="visually-hidden">Carregando...</span>
                      </div>
                      <span>Carregando perfil público...</span>
                    </div>
                  ) : profileError ? (
                    <div className="p-3 rounded bg-danger bg-opacity-10 border border-danger border-opacity-20 text-danger text-center" style={{ fontSize: '0.8rem' }}>
                      {profileError}
                    </div>
                  ) : publicProfile ? (
                    <div className="animate__animated animate__fadeIn">
                      {/* Estatísticas */}
                      <div className="d-flex justify-content-around bg-dark bg-opacity-40 p-3 rounded border border-secondary border-opacity-10 mb-4 text-center">
                        <div>
                          <small className="text-secondary d-block" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PONTOS</small>
                          <strong className="text-info font-display" style={{ fontSize: '1.2rem' }}>{publicProfile.user.points}</strong>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '15px' }}>
                          <small className="text-secondary d-block" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PLACAR EXATO</small>
                          <strong className="text-success font-display" style={{ fontSize: '1.2rem' }}>{publicProfile.stats.exactScores}</strong>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '15px' }}>
                          <small className="text-secondary d-block" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PALPITES</small>
                          <strong className="text-white font-display" style={{ fontSize: '1.2rem' }}>{publicProfile.stats.totalPredictions}</strong>
                        </div>
                      </div>

                      {/* Outros bolões */}
                      <h4 className="text-secondary fw-semibold mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                        <i className="bi bi-shield-shaded text-info"></i>
                        <span>Participa de {publicProfile.leagues.length} bolões:</span>
                      </h4>

                      {publicProfile.leagues.length > 0 ? (
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          {publicProfile.leagues.map((lg: any) => (
                            <div key={lg.id} className="d-flex justify-content-between align-items-center p-2 rounded bg-dark bg-opacity-25 border border-secondary border-opacity-5" style={{ fontSize: '0.75rem' }}>
                              <div className="d-flex flex-column">
                                <span className="text-white fw-bold">{lg.name}</span>
                                <small className="text-secondary">
                                  {lg.role === 'owner' ? 'Criador' : lg.role === 'subadmin' ? 'Subadmin' : 'Participante'}
                                </small>
                              </div>
                              <div className="text-end">
                                <span className="text-info fw-bold">{lg.points} pts</span>
                                <small className="d-block text-secondary" style={{ fontSize: '0.6rem' }}>
                                  {lg.status === 'active' ? 'Ativo' : 'Finalizado'}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-dark bg-opacity-20 rounded border border-secondary border-opacity-5 text-center text-secondary" style={{ fontSize: '0.75rem' }}>
                          Não participa de outros bolões públicos ou compartilhados.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {selectedMemberTab === 'preds' && (
                <div>
                  {loadingPreds ? (
                    <div className="text-center py-5 text-secondary">
                      <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                        <span className="visually-hidden">Carregando...</span>
                      </div>
                      <span>Carregando palpites...</span>
                    </div>
                  ) : predsError ? (
                    <div className="p-3 rounded bg-danger bg-opacity-10 border border-danger border-opacity-20 text-danger text-center" style={{ fontSize: '0.8rem' }}>{predsError}</div>
                  ) : memberPreds.length === 0 ? (
                    <div className="text-center py-5 text-secondary" style={{ fontSize: '0.85rem' }}>
                      Nenhum palpite registrado ou visível para este participante.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {memberPreds.map((pred: any) => {
                        const isFinished = pred.match.status === 'finished';
                        const hasPlacar = pred.match.homeScore !== null && pred.match.awayScore !== null;
                        
                        return (
                          <div 
                            key={pred.id} 
                            className="p-2.5 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-10"
                            style={{ fontSize: '0.8rem' }}
                          >
                            {/* Info da partida */}
                            <div className="d-flex justify-content-between text-secondary mb-1.5" style={{ fontSize: '0.68rem' }}>
                              <span>{pred.match.group ? `Grupo ${pred.match.group}` : formatStagePtBr(pred.match.stage)}</span>
                              <span>{isFinished ? 'Jogo Encerrado' : 'Aguardando'}</span>
                            </div>

                            {/* Placar Real vs Palpite */}
                            <div className="d-flex justify-content-between align-items-center gap-3">
                              <div className="d-flex flex-column align-items-start" style={{ width: '45%' }}>
                                <span className="text-white fw-medium text-truncate" style={{ maxWidth: '140px' }}>{pred.match.homeTeam}</span>
                                <span className="text-white fw-medium text-truncate" style={{ maxWidth: '140px' }}>{pred.match.awayTeam}</span>
                              </div>

                              <div className="text-center bg-dark bg-opacity-60 px-2 py-1.5 rounded border border-secondary border-opacity-5" style={{ minWidth: '100px' }}>
                                <div className="text-secondary" style={{ fontSize: '0.62rem', fontWeight: '600' }}>PALPITE</div>
                                <div className="text-info fw-bold fs-6">{pred.homeGuess !== null ? `${pred.homeGuess} x ${pred.awayGuess}` : 'Oculto 🔒'}</div>
                                {hasPlacar && (
                                  <div className="text-secondary" style={{ fontSize: '0.62rem', marginTop: '2px' }}>
                                    Placar: {pred.match.homeScore}x{pred.match.awayScore}
                                  </div>
                                )}
                              </div>

                              <div className="text-end" style={{ width: '25%' }}>
                                {hasPlacar && pred.homeGuess !== null ? (
                                  <span className={pred.points > 0 ? 'text-success fw-bold' : 'text-secondary'} style={{ fontSize: '0.9rem' }}>
                                    +{pred.points} pts
                                  </span>
                                ) : (
                                  <span className="text-secondary">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button 
              type="button" 
              className="btn btn-secondary mt-3 py-2 w-100" 
              onClick={() => setSelectedMember(null)}
              style={{ borderRadius: '6px', fontSize: '0.85rem', background: '#334155', border: 'none', color: '#fff' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
