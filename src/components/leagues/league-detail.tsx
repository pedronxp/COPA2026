'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { LeagueDetailData, LeagueRankingEntry } from './league-types';
import { JoinLeagueButton } from './join-league-button';
import { SCORING_PRESETS } from '@/lib/league-domain';

type DetailTab = 'overview' | 'ranking' | 'rules' | 'members' | 'publication' | 'settings';

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
  const ownerEditLocked = league.ownerEdit.lockReason === 'used';
  const competitiveFieldsDisabled = league.ownerEdit.rulesLocked;

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
              <div className="league-owner-edit-callout">
                <i className="bi bi-pencil-square" aria-hidden="true"></i>
                <div>
                  <strong>Edição única disponível</strong>
                  <p>Você pode salvar uma alteração de nome e configurações uma única vez. Depois de confirmar, este botão ficará bloqueado.</p>
                </div>
              </div>
              {competitiveFieldsDisabled && (
                <div className="league-owner-edit-callout warning">
                  <i className="bi bi-lock-fill" aria-hidden="true"></i>
                  <div>
                    <strong>Regras competitivas travadas</strong>
                    <p>Já existem palpites neste bolão. A edição única ainda pode ajustar dados gerais, mas pontuação, janelas e publicação ficam somente para consulta.</p>
                  </div>
                </div>
              )}
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
                      max={50}
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
                      <label htmlFor="rule-diff">Saldo de gols</label>
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
                  {isPending ? 'Salvando...' : 'Revisar e confirmar edição única'}
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
              <h2 id="owner-edit-confirm-title">Usar a edição única do bolão?</h2>
              <p>
                Esta ação salva as alterações e consome a única edição disponível para o dono.
                Depois disso, novas mudanças pelo dono ficarão bloqueadas com cadeado.
              </p>
              {competitiveFieldsDisabled && (
                <p className="league-confirm-modal-note">
                  As regras competitivas já estão travadas por palpites; somente os dados gerais serão alterados.
                </p>
              )}
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
                {isPending ? 'Salvando...' : 'Salvar edição única'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
