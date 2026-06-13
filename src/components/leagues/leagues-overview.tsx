'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { LeagueCardData } from './league-types';
import { JoinLeagueButton } from './join-league-button';

function roleLabel(role: LeagueCardData['userRole']) {
  if (role === 'owner') return 'Criador';
  if (role === 'subadmin') return 'Subadministrador';
  return 'Membro';
}

function policyLabel(policy: string) {
  if (policy === 'open') return 'Entrada aberta';
  if (policy === 'approval') return 'Com aprovação';
  return 'Por convite';
}

function statusLabel(status: string) {
  if (status === 'closed') return 'Encerrado';
  if (status === 'archived') return 'Arquivado';
  if (status === 'draft') return 'Rascunho';
  return 'Ativo';
}

function LeagueCard({ league, mine }: { league: LeagueCardData; mine: boolean }) {
  return (
    <article className={`league-card theme-${league.visualTheme}`}>
      <div className="league-card-topline">
        <div className="league-card-emblem" aria-hidden="true">
          {league.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="league-card-heading">
          <div className="league-card-badges">
            <span className={`league-status ${league.status}`}>{statusLabel(league.status)}</span>
            <span className="league-muted-badge">
              <i className={`bi bi-${league.visibility === 'public' ? 'globe-americas' : 'lock-fill'}`}></i>
              {league.visibility === 'public' ? 'Público' : 'Privado'}
            </span>
            {mine && league.status === 'active' && (
              typeof league.pendingPredictionsCount === 'number' && league.pendingPredictionsCount > 0 ? (
                <span className="league-predictions-pending">
                  <i className="bi bi-clock-history" aria-hidden="true"></i>
                  {league.pendingPredictionsCount} {league.pendingPredictionsCount === 1 ? 'palpite pendente' : 'palpites pendentes'}
                </span>
              ) : (
                <span className="league-predictions-done">
                  <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                  Palpites em dia
                </span>
              )
            )}
          </div>
          <h3>{league.name}</h3>
          <p>{league.description || `Bolão de ${league.ownerName}`}</p>
        </div>
      </div>

      <div className="league-card-stats">
        <div>
          <span>Participantes</span>
          <strong>{league.memberCount}/{league.maxMembers}</strong>
        </div>
        <div>
          <span>{mine ? 'Sua posição' : 'Líder'}</span>
          <strong>
            {mine
              ? league.userRank ? `${league.userRank}º` : '-'
              : league.leader?.name || 'Sem ranking'}
          </strong>
        </div>
        <div>
          <span>{mine ? 'Seus pontos' : 'Placar exato'}</span>
          <strong>{mine ? `${league.userPoints || 0} pts` : `+${league.pointsExact} pts`}</strong>
        </div>
      </div>

      <div className="league-card-footer">
        <span className="league-owner-line">
          <span className="league-avatar small" aria-hidden="true">
            {league.ownerImage || league.ownerName.charAt(0)}
          </span>
          {mine ? roleLabel(league.userRole) : policyLabel(league.joinPolicy)}
        </span>
        <div className="league-card-actions">
          {!mine && league.status === 'active' && (
            <JoinLeagueButton
              leagueId={league.id}
              leagueSlug={league.slug}
              joinPolicy={league.joinPolicy}
              compact
            />
          )}
          <Link href={`/leagues/${league.slug}`} className="btn league-icon-button" title="Abrir bolão">
            <i className="bi bi-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function LeaguesOverview({
  mine,
  discover,
}: {
  mine: LeagueCardData[];
  discover: LeagueCardData[];
}) {
  const [view, setView] = useState<'mine' | 'discover'>('mine');
  const [query, setQuery] = useState('');
  const [access, setAccess] = useState('all');

  const source = view === 'mine' ? mine : discover;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return source.filter((league) => {
      const matchesQuery = !normalized
        || league.name.toLowerCase().includes(normalized)
        || league.description?.toLowerCase().includes(normalized)
        || league.ownerName.toLowerCase().includes(normalized);
      const matchesAccess = access === 'all'
        || league.joinPolicy === access
        || league.status === access;
      return matchesQuery && matchesAccess;
    });
  }, [access, query, source]);

  return (
    <>
      <section className="league-page-header">
        <div>
          <span className="league-eyebrow">Central de bolões</span>
          <h1>Suas disputas, em um só lugar.</h1>
          <p>Acompanhe seus rankings ou encontre uma nova liga para a Copa de 2026.</p>
        </div>
        <div className="league-header-actions">
          <Link href="/leagues/join" className="btn league-secondary-button">
            <i className="bi bi-ticket-perforated" aria-hidden="true"></i>
            Inserir convite
          </Link>
          <Link href="/leagues/create" className="btn league-primary-button">
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
            Criar bolão
          </Link>
        </div>
      </section>

      <section className="league-toolbar" aria-label="Filtros de bolões">
        <div className="league-segmented">
          <button type="button" className={view === 'mine' ? 'active' : ''} onClick={() => setView('mine')}>
            Meus bolões <span>{mine.length}</span>
          </button>
          <button type="button" className={view === 'discover' ? 'active' : ''} onClick={() => setView('discover')}>
            Descobrir <span>{discover.length}</span>
          </button>
        </div>
        <div className="league-filter-group">
          <label className="league-search">
            <i className="bi bi-search" aria-hidden="true"></i>
            <span className="visually-hidden">Buscar bolões</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou criador"
            />
          </label>
          <select value={access} onChange={(event) => setAccess(event.target.value)} aria-label="Filtrar acesso">
            <option value="all">Todos</option>
            <option value="open">Entrada aberta</option>
            <option value="approval">Com aprovação</option>
            <option value="invite">Por convite</option>
            <option value="closed">Encerrados</option>
          </select>
        </div>
      </section>

      {filtered.length ? (
        <section className="league-card-grid" aria-live="polite">
          {filtered.map((league) => <LeagueCard key={league.id} league={league} mine={view === 'mine'} />)}
        </section>
      ) : (
        <section className="league-empty-state">
          <i className={`bi bi-${query || access !== 'all' ? 'search' : view === 'mine' ? 'people' : 'globe-americas'}`} aria-hidden="true"></i>
          <h2>{query || access !== 'all' ? 'Nenhum bolão encontrado' : view === 'mine' ? 'Sua primeira disputa começa aqui' : 'Nenhum bolão público disponível'}</h2>
          <p>{query || access !== 'all' ? 'Ajuste a busca ou os filtros.' : view === 'mine' ? 'Crie um bolão ou entre com um código de convite.' : 'Novos bolões públicos aparecerão nesta área.'}</p>
        </section>
      )}
    </>
  );
}
