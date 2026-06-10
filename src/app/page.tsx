// src/app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  kickOff: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string; // 'scheduled' | 'live' | 'finished'
  stage: string;  // 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'
  group: string | null;
  matchday: string | null;
  elapsed: string | null;
  homeLabel: string | null;
  awayLabel: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string;
  points: number;
  streak: number;
  misses: number;
}

interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeGuess: number;
  awayGuess: number;
  processed: boolean;
}

interface MatchStatsEntry {
  home: number;
  draw: number;
  away: number;
}

export default function Home() {
  // Estados da Aplicação
  const [activeTab, setActiveTab] = useState<'home' | 'matches' | 'leaderboard' | 'history' | 'admin'>('home');
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  // Usuário Selecionado para simulação de Sandbox
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('currentUser');
  
  // Estado de carregamento e mensagens
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPredictionId, setSavingPredictionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Estados dos inputs de palpites locais
  const [localGuesses, setLocalGuesses] = useState<Record<string, { home: string; away: string }>>({});

  // Estados do Criador de Competidores Sandbox
  const [newCompetitorName, setNewCompetitorName] = useState<string>('');
  const [newCompetitorAvatar, setNewCompetitorAvatar] = useState<string>('😎');

  // Estados do Painel de Simulação (Admin)
  const [simulatingMatchId, setSimulatingMatchId] = useState<string | null>(null);
  const [simHomeScore, setSimHomeScore] = useState<string>('0');
  const [simAwayScore, setSimAwayScore] = useState<string>('0');
  const [simStatus, setSimStatus] = useState<'scheduled' | 'live' | 'finished'>('live');

  // Stats reais do Secômetro (busca da API)
  const [matchStats, setMatchStats] = useState<Record<string, MatchStatsEntry>>({});

  // Filtro por grupo/rodada na aba Palpites
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Sync automático - estado
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Buscar dados da API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Partidas
      const matchesRes = await fetch('/api/matches');
      const matchesData = await matchesRes.json();
      setMatches(matchesData);

      // Usuários (Ranking)
      const usersRes = await fetch('/api/leaderboard');
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Usuário logado
      const curUser = usersData.find((u: UserProfile) => u.id === selectedUserId) || usersData.find((u: UserProfile) => u.id === 'currentUser');
      setCurrentUser(curUser || null);

      // Palpites do usuário
      const predsRes = await fetch(`/api/predictions?userId=${selectedUserId}`);
      const predsData = await predsRes.json();
      setPredictions(predsData);

      // Inicializar guesses locais
      const guessesMap: Record<string, { home: string; away: string }> = {};
      predsData.forEach((pred: Prediction) => {
        guessesMap[pred.matchId] = {
          home: pred.homeGuess.toString(),
          away: pred.awayGuess.toString()
        };
      });
      setLocalGuesses(guessesMap);

      // Buscar stats do secômetro para partidas não finalizadas
      const visibleMatches = matchesData.filter((m: Match) => m.status !== 'finished');
      const statsMap: Record<string, MatchStatsEntry> = {};
      await Promise.all(
        visibleMatches.map(async (m: Match) => {
          try {
            const statsRes = await fetch(`/api/matches/stats?matchId=${m.id}`);
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              statsMap[m.id] = statsData;
            }
          } catch {
            // Ignora erros de stats individuais
          }
        })
      );
      setMatchStats(statsMap);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Falha ao sincronizar com o banco Neon SQL.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Sync automático ao carregar + fetch de dados
  useEffect(() => {
    const syncData = async () => {
      try {
        await fetch('/api/sync', { method: 'POST' });
      } catch (e) {
        console.warn('Sync automático falhou:', e);
      }
    };
    syncData();
    fetchData();
  }, [fetchData]);

  // Buscar último sync ao carregar aba admin
  useEffect(() => {
    if (activeTab === 'admin') {
      fetchLastSync();
    }
  }, [activeTab]);

  const fetchLastSync = async () => {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data && data.syncedAt) {
          setLastSyncAt(data.syncedAt);
        }
      }
    } catch {
      // Ignora erros
    }
  };

  // Exibir toast temporário
  const showToast = (text: string, type: 'success' | 'danger') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tratar mudança nos palpites locais
  const handleLocalGuessChange = (matchId: string, side: 'home' | 'away', val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return;

    setLocalGuesses(prev => {
      const current = prev[matchId] || { home: '', away: '' };
      return {
        ...prev,
        [matchId]: {
          ...current,
          [side]: val
        }
      };
    });
  };

  // Salvar palpite na API (com validação do Time Gate)
  const saveUserPrediction = async (matchId: string) => {
    const guessData = localGuesses[matchId];
    if (!guessData || guessData.home === '' || guessData.away === '') {
      showToast('Preencha os dois placares antes de salvar.', 'danger');
      return;
    }

    setSavingPredictionId(matchId);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': selectedUserId
        },
        body: JSON.stringify({
          matchId,
          homeGuess: parseInt(guessData.home),
          awayGuess: parseInt(guessData.away)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar palpite.');

      showToast('Palpite registrado!', 'success');
      
      // Atualizar lista
      const predsRes = await fetch(`/api/predictions?userId=${selectedUserId}`);
      const predsData = await predsRes.json();
      setPredictions(predsData);

    } catch (error: any) {
      showToast(error.message, 'danger');
      // Reverter
      const savedPred = predictions.find(p => p.matchId === matchId);
      if (savedPred) {
        setLocalGuesses(prev => ({
          ...prev,
          [matchId]: { home: savedPred.homeGuess.toString(), away: savedPred.awayGuess.toString() }
        }));
      } else {
        setLocalGuesses(prev => {
          const copy = { ...prev };
          delete copy[matchId];
          return copy;
        });
      }
    } finally {
      setSavingPredictionId(null);
    }
  };

  // Adicionar um novo competidor real para testes
  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitorName.trim()) return;

    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompetitorName.trim(),
          image: newCompetitorAvatar
        })
      });

      if (!res.ok) throw new Error('Erro ao criar competidor.');

      showToast(`Competidor "${newCompetitorName}" adicionado!`, 'success');
      setNewCompetitorName('');
      fetchData();

    } catch (err: any) {
      console.warn('POST /api/leaderboard não disponível. Executando em memória de sandbox.', err);
    }
  };

  // Atualizar partida no simulador
  const handleSimulateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatingMatchId) return;

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: simulatingMatchId,
          homeScore: parseInt(simHomeScore),
          awayScore: parseInt(simAwayScore),
          status: simStatus
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao simular.');
      }

      showToast('Resultado aplicado e pontos recalculados!', 'success');
      setSimulatingMatchId(null);
      fetchData();

    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  // Resetar toda a simulação
  const handleResetSimulation = async () => {
    if (!confirm('Reiniciar o Bolão? Todos os pontos voltarão a zero e palpites serão apagados.')) return;
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao reiniciar.');
      showToast('Simulação reiniciada!', 'success');
      setSelectedUserId('currentUser');
      fetchData();
      setActiveTab('home');
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  // Sync manual com a API WorldCup26.ir
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao sincronizar.');
      const data = await res.json();
      showToast(`Sincronização concluída! ${data.matchesUpdated || 0} partidas atualizadas.`, 'success');
      fetchLastSync();
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Falha na sincronização.', 'danger');
    } finally {
      setSyncing(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🔥 Meu saldo no Bolão COPA-ANT é de ${currentUser?.points || 0} pontos! Dê seus palpites nos placares reais da Copa de 2026 e venha competir comigo no ranking.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Estatísticas para o Dashboard
  const nextMatch = matches.find(m => m.status === 'scheduled');
  const finishedMatches = matches.filter(m => m.status === 'finished');
  
  const isTimeGateExpired = (kickOffStr: string) => {
    const kickOff = new Date(kickOffStr).getTime();
    const limit = kickOff - 30 * 60 * 1000;
    return Date.now() > limit;
  };

  // Streaks reais dos competidores ativos
  const usersInAlta = [...users]
    .filter(u => u.streak > 0)
    .sort((a, b) => b.streak - a.streak);

  const usersInBaixa = [...users]
    .filter(u => u.misses > 0)
    .sort((a, b) => b.misses - a.misses);

  // Emojis de avatar para seleção
  const avatars = ['😎', '⚽', '👑', '🏃', '🧤', '🔥', '🏆', '⭐', '🦁', '🦊'];

  // Filtros disponíveis
  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'A', label: 'Grupo A' },
    { value: 'B', label: 'Grupo B' },
    { value: 'C', label: 'Grupo C' },
    { value: 'D', label: 'Grupo D' },
    { value: 'E', label: 'Grupo E' },
    { value: 'F', label: 'Grupo F' },
    { value: 'G', label: 'Grupo G' },
    { value: 'H', label: 'Grupo H' },
    { value: 'I', label: 'Grupo I' },
    { value: 'J', label: 'Grupo J' },
    { value: 'K', label: 'Grupo K' },
    { value: 'L', label: 'Grupo L' },
    { value: 'r32', label: 'R32' },
    { value: 'r16', label: 'R16' },
    { value: 'qf', label: 'QF' },
    { value: 'sf', label: 'SF' },
    { value: 'third', label: '3º' },
    { value: 'final', label: 'Final' },
  ];

  // Filtrar partidas conforme seleção
  const filterMatches = (matchList: Match[]) => {
    if (selectedFilter === 'all') return matchList;
    // Filtro por grupo (letras A-L)
    if (selectedFilter.length === 1 && selectedFilter >= 'A' && selectedFilter <= 'L') {
      return matchList.filter(m => m.group === selectedFilter);
    }
    // Filtro por stage
    return matchList.filter(m => m.stage === selectedFilter);
  };

  // Componente de renderização de bandeira/logo de time
  const TeamFlag = ({ logo, flag, teamName }: { logo: string | null; flag: string | null; teamName: string }) => {
    if (logo) {
      return (
        <img
          src={logo}
          alt={teamName}
          className="team-flag-img"
        />
      );
    }
    if (flag) {
      return <span className="display-6">{flag}</span>;
    }
    return <span className="display-6">🏳️</span>;
  };

  // Componente de renderização de time para eliminatórias (TBD)
  const TeamDisplay = ({ match, side }: { match: Match; side: 'home' | 'away' }) => {
    const isHome = side === 'home';
    const teamName = isHome ? match.homeTeam : match.awayTeam;
    const teamLogo = isHome ? match.homeTeamLogo : match.awayTeamLogo;
    const teamFlag = isHome ? match.homeFlag : match.awayFlag;
    const teamLabel = isHome ? match.homeLabel : match.awayLabel;

    // Se é eliminatória com label e sem nome de time real
    const isKnockoutTBD = match.stage !== 'group' && teamLabel && (!teamName || teamName === teamLabel);

    if (isKnockoutTBD) {
      return (
        <div className="d-flex flex-column align-items-center text-center" style={{ width: '32%' }}>
          <span className="tbd-icon">❓</span>
          <span className="fw-bold text-secondary text-truncate w-100 mt-1" style={{ fontSize: '0.75rem' }}>
            {teamLabel}
          </span>
        </div>
      );
    }

    return (
      <div className="d-flex flex-column align-items-center text-center" style={{ width: '32%' }}>
        <TeamFlag logo={teamLogo} flag={teamFlag} teamName={teamName} />
        <span className="fw-bold text-white text-truncate w-100 mt-1" style={{ fontSize: '0.85rem' }}>
          {teamName}
        </span>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column h-100 min-vh-100">
      
      {/* 1. Barra de Topo Geral */}
      <header className="navbar sticky-top bg-dark navbar-dark px-3 py-2 border-bottom border-secondary shadow-sm">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          
          <div className="d-flex align-items-center">
            <span className="fs-4 fw-extrabold text-white tracking-wide d-flex align-items-center gap-2" style={{ letterSpacing: '0.5px' }}>
              🏆 COPA<span className="text-info">ANT</span>
            </span>
            <span className="badge bg-secondary ms-2 d-none d-sm-inline-block" style={{ fontSize: '0.65rem' }}>EFEITOS NEON</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            
            {/* Seletor de Contas Sandbox no Header */}
            <div className="d-flex align-items-center">
              <span className="text-secondary d-none d-sm-inline me-2" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-people-fill"></i> Jogar como:
              </span>
              <select 
                className="form-select form-select-sm bg-dark text-white border-secondary"
                style={{ fontSize: '0.8rem', width: '160px' }}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.image} {u.name.split(' ')[0]} ({u.points} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Pontos do Jogador Atual */}
            <div className="glass-card px-3 py-1 d-flex align-items-center gap-2 border border-info border-opacity-70">
              <span className="fs-5">{currentUser?.image || '👑'}</span>
              <div className="d-flex flex-column text-start">
                <span className="text-secondary" style={{ fontSize: '0.65rem', lineHeight: 1 }}>SEUS PONTOS</span>
                <span className="text-info fw-bold fs-6">{currentUser?.points || 0} pts</span>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* 2. Layout Principal Responsivo */}
      <div className="desktop-layout flex-grow-1">
        
        {/* SIDEBAR DO DESKTOP (Apenas visível em telas >= 768px) */}
        <aside className="desktop-sidebar">
          <div className="desktop-sidebar-nav">
            
            <button 
              className={`desktop-sidebar-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <i className="bi bi-house-door-fill"></i> Home
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveTab('matches')}
            >
              <i className="bi bi-lightning-charge-fill"></i> Palpites (Jogos)
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <i className="bi bi-trophy-fill"></i> Tabela / Ranking
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="bi bi-clock-history"></i> Histórico
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <i className="bi bi-person-gear"></i> Simulador Sandbox
            </button>

          </div>

          {/* Rodapé da Sidebar */}
          <div className="pt-3 border-top border-secondary border-opacity-25 text-start">
            <div className="text-secondary mb-1" style={{ fontSize: '0.7rem' }}>Copa de 2026</div>
            <div className="text-info fw-bold" style={{ fontSize: '0.75rem' }}>Timing Perfeito! 🌎</div>
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO PRINCIPAL (Se adapta responsivamente) */}
        <main className="desktop-content pb-5 mb-5 flex-grow-1">
          
          {/* Toast de Alerta */}
          {toastMessage && (
            <div className={`alert alert-${toastMessage.type} glass-card position-fixed start-50 translate-middle-x py-2 px-4 shadow-lg`} style={{ zIndex: 1050, top: '70px', minWidth: '320px' }}>
              <div className="d-flex align-items-center gap-2">
                <i className={`bi bi-${toastMessage.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>
                <span style={{ fontSize: '0.9rem' }}>{toastMessage.text}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div className="spinner-border text-info mb-3" role="status"></div>
              <span className="text-secondary">Sincronizando tabelas com o Neon SQL...</span>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* ABA: HOME (Layout responsivo com colunas no desktop)     */}
              {/* ======================================================== */}
              {activeTab === 'home' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  {/* Grid responsivo: 2 colunas no desktop, 1 coluna no celular */}
                  <div className="row g-4">
                    
                    {/* Coluna Principal da Home (Esquerda) */}
                    <div className="col-12 col-lg-8">
                      
                      {/* Banner de Boas-vindas */}
                      <div className="glass-card p-4 mb-4 text-start border-info border-opacity-25" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 135, 0.05) 0%, rgba(96, 239, 255, 0.1) 100%)' }}>
                        <h4 className="text-white fw-bold mb-2">Chegou a hora de provar que você entende! ⚽</h4>
                        <p className="text-secondary mb-3" style={{ fontSize: '0.9rem' }}>
                          Dê palpites nos placares das partidas antes de a bola rolar. Pontue na tabela oficial no estilo do Globo Esporte (GE) e desafie seus amigos!
                        </p>
                        <div className="d-flex gap-2">
                          <button className="btn btn-neon-green px-4 py-2" onClick={() => setActiveTab('matches')}>
                            <i className="bi bi-lightning-charge-fill"></i> Ir para Palpites
                          </button>
                          <button className="btn btn-neon-outline px-4 py-2" onClick={handleShareWhatsApp}>
                            <i className="bi bi-whatsapp"></i> Compartilhar Bolão
                          </button>
                        </div>
                      </div>

                      {/* Card Próximo Jogo Regressivo */}
                      {nextMatch ? (
                        <div className="glass-card p-4 mb-4 text-center border-secondary">
                          <span className="text-secondary fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>FECHAMENTO DE MERCADO</span>
                          <div className="d-flex align-items-center justify-content-around my-3">
                            <div className="d-flex flex-column align-items-center" style={{ width: '40%' }}>
                              <TeamFlag logo={nextMatch.homeTeamLogo} flag={nextMatch.homeFlag} teamName={nextMatch.homeTeam} />
                              <span className="fw-bold text-white mt-2 fs-5">{nextMatch.homeTeam}</span>
                            </div>
                            <span className="text-secondary fw-extrabold fs-4">VS</span>
                            <div className="d-flex flex-column align-items-center" style={{ width: '40%' }}>
                              <TeamFlag logo={nextMatch.awayTeamLogo} flag={nextMatch.awayFlag} teamName={nextMatch.awayTeam} />
                              <span className="fw-bold text-white mt-2 fs-5">{nextMatch.awayTeam}</span>
                            </div>
                          </div>
                          <div className="pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.85rem' }}>
                            <i className="bi bi-clock-fill text-warning me-1"></i>
                            O palpite trava automaticamente exatamente **30 minutos antes** do jogo começar.
                          </div>
                        </div>
                      ) : (
                        <div className="glass-card p-4 mb-4 text-center text-secondary">
                          <i className="bi bi-check2-circle fs-1 text-success mb-2"></i>
                          <h5>Nenhuma partida agendada</h5>
                          <p className="m-0" style={{ fontSize: '0.85rem' }}>Todos os jogos cadastrados já estão em andamento ou foram finalizados!</p>
                        </div>
                      )}

                      {/* Tabela de como Pontuar (Explicação) */}
                      <div className="glass-card p-4 text-start">
                        <h5 className="text-white fw-bold mb-3">
                          <i className="bi bi-award text-info me-2"></i> Sistema de Pontuação (GE)
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-dark table-borderless m-0" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr className="text-secondary border-bottom border-secondary">
                                <th scope="col">Cenário do Palpite</th>
                                <th scope="col" className="text-end">Pontos</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-bottom border-secondary border-opacity-25">
                                <td className="py-2">🎯 **Placar Exato** (ex: Apostou 2x1, Placar final 2x1)</td>
                                <td className="text-end text-info fw-bold py-2">+5</td>
                              </tr>
                              <tr className="border-bottom border-secondary border-opacity-25">
                                <td className="py-2">⚽ **Vencedor e Saldo** (ex: Apostou 2x0, Placar final 3x1 - diferença de 2 gols)</td>
                                <td className="text-end text-info fw-bold py-2">+3</td>
                              </tr>
                              <tr className="border-bottom border-secondary border-opacity-25">
                                <td className="py-2">🏃 **Vencedor Simples** (ex: Apostou 2x1, Placar final 3x0 - acertou quem ganhou mas errou saldo)</td>
                                <td className="text-end text-info fw-bold py-2">+2</td>
                              </tr>
                              <tr className="border-bottom border-secondary border-opacity-25">
                                <td className="py-2">🤝 **Empate Não Exato** (ex: Apostou 1x1, Placar final 2x2)</td>
                                <td className="text-end text-info fw-bold py-2">+2</td>
                              </tr>
                              <tr>
                                <td className="py-2">❌ **Erro Total** (Errou quem venceria ou errou o empate)</td>
                                <td className="text-end text-secondary py-2">0</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                    {/* Coluna Lateral da Home (Direita - Apenas desktop, flui no mobile) */}
                    <div className="col-12 col-lg-4">
                      
                      {/* Estatísticas de Andamento */}
                      <div className="glass-card p-3 mb-4 text-start">
                        <h6 className="text-white fw-bold mb-3">📊 Progresso do Bolão</h6>
                        <div className="d-flex justify-content-around text-center mb-2">
                          <div>
                            <div className="fs-3 fw-bold text-info">{matches.length}</div>
                            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>PARTIDAS</div>
                          </div>
                          <div>
                            <div className="fs-3 fw-bold text-info">{finishedMatches.length}</div>
                            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>FINALIZADAS</div>
                          </div>
                          <div>
                            <div className="fs-3 fw-bold text-info">{users.length}</div>
                            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>JOGADORES</div>
                          </div>
                        </div>
                      </div>

                      {/* Efeitos Sociais (Em alta / Em baixa) */}
                      <div className="d-flex flex-column gap-3 mb-4">
                        
                        {/* EM ALTA 🔥 */}
                        <div className="glass-card p-3 highlight-up border-0 text-start">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="fs-5 pulse-fire">🔥</span>
                            <h6 className="text-white fw-bold m-0" style={{ fontSize: '0.85rem' }}>Em Alta (Sequência)</h6>
                          </div>
                          {usersInAlta.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                              {usersInAlta.map(u => (
                                <div key={u.id} className="d-flex justify-content-between align-items-center py-1 border-bottom border-secondary border-opacity-10" style={{ fontSize: '0.8rem' }}>
                                  <span className="text-light">{u.image} {u.name}</span>
                                  <span className="badge bg-success">+{u.streak} acertos</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Ninguém acumulou acertos ainda.</span>
                          )}
                        </div>

                        {/* EM BAIXA 👎 */}
                        <div className="glass-card p-3 highlight-down border-0 text-start">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="fs-5">👎</span>
                            <h6 className="text-white fw-bold m-0" style={{ fontSize: '0.85rem' }}>Secador / Pé Frio</h6>
                          </div>
                          {usersInBaixa.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                              {usersInBaixa.map(u => (
                                <div key={u.id} className="d-flex justify-content-between align-items-center py-1 border-bottom border-secondary border-opacity-10" style={{ fontSize: '0.8rem' }}>
                                  <span className="text-light">{u.image} {u.name}</span>
                                  <span className="badge bg-danger">{u.misses} erros</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Ninguém acumulou erros seguidos.</span>
                          )}
                        </div>

                      </div>

                      {/* Mini Ranking Rápido */}
                      <div className="glass-card p-3 text-start">
                        <h6 className="text-white fw-bold mb-3">🏆 Top 3 Classificação</h6>
                        <div className="d-flex flex-column gap-2">
                          {users.slice(0, 3).map((u, i) => (
                            <div key={u.id} className="d-flex justify-content-between align-items-center py-1" style={{ fontSize: '0.8rem' }}>
                              <span className="text-light">
                                <strong className="text-secondary me-2">#{i + 1}</strong>
                                {u.image} {u.name.split(' ')[0]}
                              </span>
                              <span className="text-info fw-bold">{u.points} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: PALPITES (Grid de duas colunas no desktop)          */}
              {/* ======================================================== */}
              {activeTab === 'matches' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  <h4 className="text-white fw-bold mb-3 text-start">⚽ Partidas Agendadas</h4>

                  {/* Barra de filtros por grupo/rodada */}
                  <div className="filter-bar mb-3">
                    {filterOptions.map(opt => (
                      <button
                        key={opt.value}
                        className={`filter-chip ${selectedFilter === opt.value ? 'active' : ''}`}
                        onClick={() => setSelectedFilter(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Grid Responsivo de Jogos (1 coluna celular, 2 colunas desktop grande) */}
                  <div className="row g-3">
                    {filterMatches(matches.filter(m => m.status !== 'finished'))
                      .map(match => {
                        const isExpired = isTimeGateExpired(match.kickOff);
                        const isLive = match.status === 'live';
                        const stats = matchStats[match.id];
                        const hasStats = stats && (stats.home > 0 || stats.draw > 0 || stats.away > 0);
                        const localGuess = localGuesses[match.id] || { home: '', away: '' };

                        return (
                          <div key={match.id} className="col-12 col-lg-6">
                            <div className="glass-card p-3 h-100 d-flex flex-column justify-content-between text-start">
                              
                              {/* Status e Data */}
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                  {new Date(match.kickOff).toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                  })}
                                  {match.group && (
                                    <span className="ms-1 badge bg-dark border border-secondary" style={{ fontSize: '0.6rem' }}>
                                      Grupo {match.group}
                                    </span>
                                  )}
                                  {match.stage !== 'group' && (
                                    <span className="ms-1 badge bg-dark border border-info border-opacity-50" style={{ fontSize: '0.6rem' }}>
                                      {match.stage.toUpperCase()}
                                    </span>
                                  )}
                                </span>
                                {isLive ? (
                                  <span className="badge-live">
                                    <span className="live-dot"></span> AO VIVO
                                    {match.elapsed && match.elapsed !== 'notstarted' && match.elapsed !== 'finished' && (
                                      <span className="elapsed-badge ms-1">{match.elapsed === 'halftime' ? 'INT' : `${match.elapsed}'`}</span>
                                    )}
                                  </span>
                                ) : isExpired ? (
                                  <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50" style={{ fontSize: '0.7rem' }}>
                                    <i className="bi bi-lock-fill"></i> Fechado
                                  </span>
                                ) : (
                                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50" style={{ fontSize: '0.7rem' }}>
                                    <i className="bi bi-unlock-fill"></i> Aberto
                                  </span>
                                )}
                              </div>

                              {/* Placar e Botões */}
                              <div className="d-flex align-items-center justify-content-between my-2">
                                <TeamDisplay match={match} side="home" />

                                <div className="d-flex align-items-center justify-content-center gap-2" style={{ width: '36%' }}>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="score-input"
                                    value={localGuess.home}
                                    onChange={(e) => handleLocalGuessChange(match.id, 'home', e.target.value)}
                                    disabled={isExpired || isLive}
                                    placeholder="-"
                                  />
                                  <span className="text-secondary fw-bold">x</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="score-input"
                                    value={localGuess.away}
                                    onChange={(e) => handleLocalGuessChange(match.id, 'away', e.target.value)}
                                    disabled={isExpired || isLive}
                                    placeholder="-"
                                  />
                                </div>

                                <TeamDisplay match={match} side="away" />
                              </div>

                              {/* Placar ao vivo */}
                              {isLive && match.homeScore !== null && match.awayScore !== null && (
                                <div className="text-center my-1">
                                  <span className="text-info fw-bold fs-5">{match.homeScore} - {match.awayScore}</span>
                                  <span className="text-secondary ms-2" style={{ fontSize: '0.7rem' }}>PLACAR ATUAL</span>
                                </div>
                              )}

                              {/* Botão de Enviar */}
                              {!isExpired && !isLive && (
                                <div className="mt-3">
                                  <button
                                    className="btn btn-neon-green btn-sm w-100 py-1"
                                    onClick={() => saveUserPrediction(match.id)}
                                    disabled={savingPredictionId === match.id}
                                  >
                                    {savingPredictionId === match.id ? 'Salvando...' : 'Confirmar Palpite'}
                                  </button>
                                </div>
                              )}

                              {/* Secômetro - Stats Reais */}
                              <div className="mt-3 pt-2 border-top border-secondary border-opacity-30">
                                {hasStats ? (
                                  <>
                                    <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: '0.65rem' }}>
                                      <span>Média dos palpites:</span>
                                      <span>{stats.home}% | {stats.draw}% | {stats.away}%</span>
                                    </div>
                                    <div className="thermostat-bar d-flex">
                                      <div className="thermostat-segment-home" style={{ width: `${stats.home}%` }}></div>
                                      <div className="thermostat-segment-draw" style={{ width: `${stats.draw}%` }}></div>
                                      <div className="thermostat-segment-away" style={{ width: `${stats.away}%` }}></div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-secondary text-center" style={{ fontSize: '0.7rem' }}>
                                    <i className="bi bi-bar-chart-line me-1"></i>
                                    Nenhum palpite registrado
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {filterMatches(matches.filter(m => m.status !== 'finished')).length === 0 && (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-check-circle fs-1 text-success"></i>
                      <p className="mt-2">
                        {selectedFilter === 'all'
                          ? 'Sem partidas pendentes de palpites!'
                          : `Nenhuma partida encontrada para o filtro "${filterOptions.find(f => f.value === selectedFilter)?.label || selectedFilter}".`
                        }
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: LEADERBOARD / RANKING                               */}
              {/* ======================================================== */}
              {activeTab === 'leaderboard' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  <h4 className="text-white fw-bold mb-3 text-start">🏆 Tabela de Líderes</h4>

                  {/* Pódio visual */}
                  <div className="row g-2 mb-4 align-items-end justify-content-center text-center">
                    {users[1] && (
                      <div className="col-4 col-sm-3 order-1">
                        <div className="glass-card p-3 border-secondary" style={{ borderBottom: '4px solid var(--silver)' }}>
                          <span className="fs-2">🥈</span>
                          <div className="fw-bold text-white text-truncate mt-1" style={{ fontSize: '0.85rem' }}>{users[1].name}</div>
                          <span className="text-info fw-bold">{users[1].points} pts</span>
                        </div>
                      </div>
                    )}
                    {users[0] && (
                      <div className="col-4 col-sm-4 order-2">
                        <div className="glass-card p-4 leader-card-1" style={{ borderBottom: '4px solid var(--gold)' }}>
                          <span className="crown-bounce">👑</span>
                          <div className="fw-bold text-white text-truncate mt-1" style={{ fontSize: '0.95rem' }}>{users[0].name}</div>
                          <span className="text-info fw-bold fs-5">{users[0].points} pts</span>
                        </div>
                      </div>
                    )}
                    {users[2] && (
                      <div className="col-4 col-sm-3 order-3">
                        <div className="glass-card p-3 border-secondary" style={{ borderBottom: '4px solid var(--bronze)' }}>
                          <span className="fs-2">🥉</span>
                          <div className="fw-bold text-white text-truncate mt-1" style={{ fontSize: '0.85rem' }}>{users[2].name}</div>
                          <span className="text-info fw-bold">{users[2].points} pts</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tabela de Classificação */}
                  <div className="glass-card text-start">
                    <div className="list-group list-group-flush bg-transparent">
                      {users.map((user, index) => {
                        const isCurrentUser = user.id === selectedUserId;
                        return (
                          <div
                            key={user.id}
                            className={`list-group-item bg-transparent d-flex justify-content-between align-items-center py-3 px-4 border-secondary border-opacity-20 ${
                              isCurrentUser ? 'bg-info bg-opacity-10 border-info border-opacity-45' : ''
                            }`}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span className="text-secondary fw-bold" style={{ width: '25px' }}>
                                #{index + 1}
                              </span>
                              <span className="fs-4">{user.image}</span>
                              <div className="d-flex flex-column">
                                <span className={`fw-bold text-white ${isCurrentUser ? 'text-info' : ''}`} style={{ fontSize: '0.95rem' }}>
                                  {user.name} {isCurrentUser && <span className="badge bg-info text-dark ms-1" style={{ fontSize: '0.6rem' }}>VOCÊ</span>}
                                </span>
                                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{user.email}</span>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {user.streak >= 3 && <span className="pulse-fire">🔥</span>}
                              <span className="text-info fw-bold fs-5">{user.points} pts</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: HISTÓRICO                                           */}
              {/* ======================================================== */}
              {activeTab === 'history' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  <h4 className="text-white fw-bold mb-3 text-start">📜 Resultados Encerrados</h4>

                  <div className="row g-3">
                    {matches
                      .filter(m => m.status === 'finished')
                      .map(match => {
                        const userPred = predictions.find(p => p.matchId === match.id);
                        let scoreBadge = { text: 'Sem palpite', class: 'bg-secondary' };
                        let ptsObtidos = 0;

                        if (userPred) {
                          ptsObtidos = calculatePredictionPoints(
                            userPred.homeGuess,
                            userPred.awayGuess,
                            match.homeScore || 0,
                            match.awayScore || 0
                          );

                          if (ptsObtidos === 5) scoreBadge = { text: 'Placar Exato (+5)', class: 'bg-success' };
                          else if (ptsObtidos === 3) scoreBadge = { text: 'Vencedor & Saldo (+3)', class: 'bg-success bg-opacity-75' };
                          else if (ptsObtidos === 2) scoreBadge = { text: 'Vencedor Simples (+2)', class: 'bg-info text-dark' };
                          else scoreBadge = { text: 'Errou Placar (0)', class: 'bg-danger' };
                        }

                        return (
                          <div key={match.id} className="col-12 col-lg-6">
                            <div className="glass-card p-3 h-100 text-start d-flex flex-column justify-content-between">
                              
                              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-35">
                                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                  Encerrado
                                  {match.group && (
                                    <span className="ms-1 badge bg-dark border border-secondary" style={{ fontSize: '0.55rem' }}>
                                      Grupo {match.group}
                                    </span>
                                  )}
                                </span>
                                <span className={`badge ${scoreBadge.class}`} style={{ fontSize: '0.7rem' }}>
                                  {scoreBadge.text}
                                </span>
                              </div>

                              <div className="d-flex align-items-center justify-content-between my-2 text-center">
                                <div className="d-flex flex-column align-items-center" style={{ width: '33%' }}>
                                  <TeamFlag logo={match.homeTeamLogo} flag={match.homeFlag} teamName={match.homeTeam} />
                                  <span className="fw-bold text-white mt-1" style={{ fontSize: '0.8rem' }}>{match.homeTeam}</span>
                                </div>
                                <div className="d-flex flex-column align-items-center" style={{ width: '34%' }}>
                                  <span className="fs-3 fw-bold text-info">
                                    {match.homeScore} - {match.awayScore}
                                  </span>
                                  <span className="text-secondary" style={{ fontSize: '0.65rem' }}>RESULTADO REAL</span>
                                </div>
                                <div className="d-flex flex-column align-items-center" style={{ width: '33%' }}>
                                  <TeamFlag logo={match.awayTeamLogo} flag={match.awayFlag} teamName={match.awayTeam} />
                                  <span className="fw-bold text-white mt-1" style={{ fontSize: '0.8rem' }}>{match.awayTeam}</span>
                                </div>
                              </div>

                              {userPred ? (
                                <div className="mt-2 p-2 rounded text-center bg-dark bg-opacity-40 border border-secondary border-opacity-25" style={{ fontSize: '0.8rem' }}>
                                  <span className="text-secondary">Palpite feito:</span>{' '}
                                  <strong className="text-white">
                                    {match.homeTeam} {userPred.homeGuess} x {userPred.awayGuess} {match.awayTeam}
                                  </strong>
                                </div>
                              ) : (
                                <div className="mt-2 p-2 rounded text-center bg-danger bg-opacity-10 border border-danger border-opacity-25" style={{ fontSize: '0.8rem' }}>
                                  <span className="text-danger">Não palpitou</span>
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {matches.filter(m => m.status === 'finished').length === 0 && (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-clock-history fs-1"></i>
                      <p className="mt-2">Aguardando encerramento das partidas.</p>
                    </div>
                  )}

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: SIMULADOR SANDBOX / GERENCIAR DADOS                */}
              {/* ======================================================== */}
              {activeTab === 'admin' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  <h4 className="text-white fw-bold mb-3 d-flex justify-content-between align-items-center">
                    <span>🛠️ Painel Sandbox Administrativo</span>
                    <button className="btn btn-danger btn-sm px-3" onClick={handleResetSimulation}>
                      <i className="bi bi-arrow-counterclockwise"></i> Resetar Bolão
                    </button>
                  </h4>

                  {/* Grid de Ferramentas Sandbox: 2 Colunas */}
                  <div className="row g-4 text-start">
                    
                    {/* Coluna 1: Criar Competidores Sandbox */}
                    <div className="col-12 col-md-6">
                      <div className="glass-card p-4 h-100">
                        <h5 className="text-white fw-bold mb-3">👥 Adicionar Amigos (Sandbox)</h5>
                        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                          Crie competidores adicionais para preencher o ranking e simular rivalidades. Cada competidor criado pode receber palpites individuais!
                        </p>

                        <form onSubmit={handleAddCompetitor}>
                          <div className="mb-3">
                            <label className="form-label text-secondary" style={{ fontSize: '0.75rem' }}>Nome do Amigo:</label>
                            <input 
                              type="text" 
                              className="form-control bg-dark text-white border-secondary"
                              placeholder="Ex: Pedro, Maria, Thiago..."
                              value={newCompetitorName}
                              onChange={(e) => setNewCompetitorName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label text-secondary" style={{ fontSize: '0.75rem' }}>Escolha o Avatar:</label>
                            <div className="d-flex flex-wrap gap-2">
                              {avatars.map(av => (
                                <button
                                  type="button"
                                  key={av}
                                  className={`btn btn-sm ${newCompetitorAvatar === av ? 'btn-info text-dark' : 'btn-dark border-secondary'}`}
                                  style={{ fontSize: '1.1rem' }}
                                  onClick={() => setNewCompetitorAvatar(av)}
                                >
                                  {av}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button type="submit" className="btn btn-neon-outline btn-sm w-100 mt-2 py-2">
                            <i className="bi bi-person-plus-fill"></i> Criar Competidor
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Coluna 2: Simular Resultados de Jogos */}
                    <div className="col-12 col-md-6">
                      <div className="glass-card p-4 h-100">
                        <h5 className="text-white fw-bold mb-3">⚽ Simular Jogo da Copa</h5>
                        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                          Defina o placar final de um jogo. Ao marcar como **&quot;Encerrado&quot;**, as pontuações e o ranking de todos os competidores são recalculados na hora.
                        </p>

                        <form onSubmit={handleSimulateMatch}>
                          <div className="mb-3">
                            <label className="form-label text-secondary" style={{ fontSize: '0.75rem' }}>Selecione a Partida:</label>
                            <select 
                              className="form-select bg-dark text-white border-secondary"
                              value={simulatingMatchId || ''}
                              onChange={(e) => {
                                const mId = e.target.value;
                                setSimulatingMatchId(mId);
                                const m = matches.find(j => j.id === mId);
                                if (m) {
                                  setSimHomeScore((m.homeScore ?? 0).toString());
                                  setSimAwayScore((m.awayScore ?? 0).toString());
                                  setSimStatus(m.status as any);
                                }
                              }}
                              required
                            >
                              <option value="">-- Escolha um jogo --</option>
                              {matches.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.homeFlag || '🏳️'} {m.homeTeam} vs {m.awayTeam} {m.awayFlag || '🏳️'} ({m.status.toUpperCase()})
                                </option>
                              ))}
                            </select>
                          </div>

                          {simulatingMatchId && (
                            <>
                              <div className="row g-2 mb-3">
                                <div className="col-4">
                                  <label className="form-label text-secondary" style={{ fontSize: '0.7rem' }}>Placar Casa:</label>
                                  <input 
                                    type="number" 
                                    className="form-control bg-dark text-white border-secondary text-center fw-bold"
                                    value={simHomeScore}
                                    onChange={(e) => setSimHomeScore(e.target.value)}
                                    min="0"
                                    required
                                  />
                                </div>
                                <div className="col-4">
                                  <label className="form-label text-secondary" style={{ fontSize: '0.7rem' }}>Placar Fora:</label>
                                  <input 
                                    type="number" 
                                    className="form-control bg-dark text-white border-secondary text-center fw-bold"
                                    value={simAwayScore}
                                    onChange={(e) => setSimAwayScore(e.target.value)}
                                    min="0"
                                    required
                                  />
                                </div>
                                <div className="col-4">
                                  <label className="form-label text-secondary" style={{ fontSize: '0.7rem' }}>Status:</label>
                                  <select 
                                    className="form-select bg-dark text-white border-secondary"
                                    value={simStatus}
                                    onChange={(e) => setSimStatus(e.target.value as any)}
                                    required
                                  >
                                    <option value="scheduled">Agendado</option>
                                    <option value="live">Ao Vivo</option>
                                    <option value="finished">Encerrado</option>
                                  </select>
                                </div>
                              </div>

                              <button type="submit" className="btn btn-neon-green btn-sm w-100 py-2">
                                <i className="bi bi-play-fill"></i> Aplicar Placar & Recalcular Pontos
                              </button>
                            </>
                          )}
                        </form>
                      </div>
                    </div>

                  </div>

                  {/* Seção de Sincronização com API */}
                  <div className="row g-4 mt-2 text-start">
                    <div className="col-12">
                      <div className="glass-card p-4">
                        <h5 className="text-white fw-bold mb-3">
                          <i className="bi bi-cloud-arrow-down-fill text-info me-2"></i>
                          Sincronizar Jogos da Copa
                        </h5>
                        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                          Busca os dados mais recentes da API WorldCup26.ir e atualiza as partidas, placares e status no banco Neon.
                        </p>
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                          <button
                            className="btn btn-sync px-4 py-2"
                            onClick={handleManualSync}
                            disabled={syncing}
                          >
                            {syncing ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Sincronizando...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-repeat me-1"></i>
                                Sincronizar Agora
                              </>
                            )}
                          </button>
                          {lastSyncAt && (
                            <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-clock me-1"></i>
                              Último sync: {new Date(lastSyncAt).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </main>

      </div>

      {/* 3. Navegação Inferior (Mobile-Only: Oculto em computadores via globals.css) */}
      <nav className="mobile-nav-bar d-flex justify-content-between align-items-center px-2">
        
        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <i className="bi bi-house-door-fill"></i>
          <span>Home</span>
        </button>

        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <i className="bi bi-lightning-charge-fill"></i>
          <span>Palpites</span>
        </button>

        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <i className="bi bi-trophy-fill"></i>
          <span>Ranking</span>
        </button>

        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="bi bi-clock-history"></i>
          <span>Histórico</span>
        </button>

        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <i className="bi bi-person-gear"></i>
          <span>Simulador</span>
        </button>

      </nav>

    </div>
  );
}

// Lógica de cálculo local no React
function calculatePredictionPoints(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number
): number {
  const guessWinner = homeGuess > awayGuess ? '1' : homeGuess < awayGuess ? '2' : 'X';
  const realWinner = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';

  if (homeGuess === homeScore && awayGuess === awayScore) {
    return 5;
  }

  if (guessWinner === realWinner) {
    if (realWinner === 'X') return 2;
    const guessDiff = homeGuess - awayGuess;
    const realDiff = homeScore - awayScore;
    if (guessDiff === realDiff) return 3;
    return 2;
  }

  return 0;
}
