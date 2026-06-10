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
  predictionCount?: number;
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

interface TeamStats {
  name: string;
  logo: string | null;
  flag: string | null;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export default function Home() {
  // Estados da Aplicação (admin removido, calendar adicionado)
  const [activeTab, setActiveTab] = useState<'home' | 'matches' | 'leaderboard' | 'calendar' | 'history'>('home');
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  // Usuário Selecionado para simulação de Sandbox/Contas
  const [selectedUserId, setSelectedUserId] = useState<string>('currentUser');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Estado de carregamento e mensagens
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPredictionId, setSavingPredictionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Estados dos inputs de palpites locais
  const [localGuesses, setLocalGuesses] = useState<Record<string, { home: string; away: string }>>({});

  // Stats reais do Secômetro (busca da API)
  const [matchStats, setMatchStats] = useState<Record<string, MatchStatsEntry>>({});

  // Filtro por grupo/rodada na aba Palpites
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Filtro de Grupo selecionado na aba Tabela/Calendário
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>('A');

  // Sync automático - estado
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Tempo real de sincronização dos cronômetros
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [predictionWindow, setPredictionWindow] = useState<number>(48);

  useEffect(() => {
    const saved = localStorage.getItem('predictionWindow');
    if (saved) {
      const val = parseInt(saved);
      if (val === 24 || val === 48) {
        setPredictionWindow(val);
      }
    }
  }, []);

  const handlePredictionWindowChange = (val: number) => {
    setPredictionWindow(val);
    localStorage.setItem('predictionWindow', val.toString());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPredictionWindowStatus = (match: Match, windowHrs: number) => {
    const kickoffTime = new Date(match.kickOff).getTime();
    const openTime = kickoffTime - windowHrs * 60 * 60 * 1000;
    const limitTime = kickoffTime - 30 * 60 * 1000;
    const curr = currentTime;

    if (match.status === 'finished') return { status: 'finished', isEditable: false };
    if (match.status === 'live') return { status: 'live', isEditable: false };

    if (curr < openTime) {
      return { status: 'not_open', isEditable: false, openTime, limitTime };
    } else if (curr >= openTime && curr <= limitTime) {
      return { status: 'open', isEditable: true, openTime, limitTime };
    } else {
      return { status: 'closed', isEditable: false, openTime, limitTime };
    }
  };

  const renderMatchTimer = (match: Match) => {
    const windowStatus = getPredictionWindowStatus(match, predictionWindow);
    const curr = currentTime;

    if (match.status === 'finished') {
      return (
        <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
          Encerrado
        </span>
      );
    }

    if (match.status === 'live') {
      return (
        <span className="badge-live">
          <span className="live-dot"></span> AO VIVO
          {match.elapsed && match.elapsed !== 'notstarted' && match.elapsed !== 'finished' && (
            <span className="elapsed-badge ms-1">{match.elapsed === 'halftime' ? 'INT' : `${match.elapsed}'`}</span>
          )}
        </span>
      );
    }

    if (windowStatus.status === 'not_open') {
      const diff = windowStatus.openTime! - curr;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      let text = 'Abre em ';
      if (days > 0) text += `${days}d `;
      text += `${hours}h ${minutes}m`;

      return (
        <span className="badge bg-dark border border-secondary text-secondary" style={{ fontSize: '0.7rem' }}>
          <i className="bi bi-lock-fill me-1"></i> {text}
        </span>
      );
    }

    if (windowStatus.status === 'open') {
      const diff = windowStatus.limitTime! - curr;
      const isUrgent = diff < 2 * 60 * 60 * 1000; // less than 2 hours

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const timeText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      if (isUrgent) {
        return (
          <span className="badge-urgent-timer pulse-red-fast d-inline-flex align-items-center gap-1">
            <i className="bi bi-exclamation-triangle-fill animate-bounce text-warning"></i>
            <span>URGENTE: {timeText}</span>
          </span>
        );
      }

      return (
        <span className="badge-open-timer d-inline-flex align-items-center gap-1">
          <i className="bi bi-clock-history"></i>
          <span>Restam {timeText}</span>
        </span>
      );
    }

    return (
      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50" style={{ fontSize: '0.7rem' }}>
        <i className="bi bi-lock-fill me-1"></i> Fechado
      </span>
    );
  };

  const getNextMatchCountdownText = () => {
    if (!nextMatch) return '';
    const kickoffTime = new Date(nextMatch.kickOff).getTime();
    const limitTime = kickoffTime - 30 * 60 * 1000;
    const diff = limitTime - currentTime;
    if (diff <= 0) return 'Mercado Fechado!';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    let text = '';
    if (days > 0) text += `${days}d `;
    return text + `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Buscar dados da API
  const fetchData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      // Partidas
      const matchesRes = await fetch('/api/matches');
      let matchesData: Match[] = [];
      if (matchesRes.ok) {
        const data = await matchesRes.json();
        if (Array.isArray(data)) {
          matchesData = data;
          setMatches(matchesData);
        }
      }

      // Usuários (Ranking)
      const usersRes = await fetch('/api/leaderboard');
      let usersData: UserProfile[] = [];
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data)) {
          usersData = data;
          setUsers(usersData);
        }
      }

      // Usuário logado
      if (usersData.length > 0) {
        const curUser = usersData.find((u: UserProfile) => u.id === selectedUserId) || usersData.find((u: UserProfile) => u.id === 'currentUser');
        setCurrentUser(curUser || null);
      }

      // Palpites do usuário
      const predsRes = await fetch(`/api/predictions?userId=${selectedUserId}`);
      let predsData: Prediction[] = [];
      if (predsRes.ok) {
        const data = await predsRes.json();
        if (Array.isArray(data)) {
          predsData = data;
          setPredictions(predsData);
        }
      }

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
            // Ignora erros de stats
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
        fetchLastSync();
      } catch (e) {
        console.warn('Sync automático falhou:', e);
      }
    };
    syncData();
    fetchData(true);
  }, [fetchData]);

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
      // Ignora
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
          awayGuess: parseInt(guessData.away),
          windowHours: predictionWindow
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar palpite.');

      showToast('Palpite registrado!', 'success');
      
      // Atualizar lista de palpites
      const predsRes = await fetch(`/api/predictions?userId=${selectedUserId}`);
      const predsData = await predsRes.json();
      setPredictions(predsData);
      
      // Recarregar os dados do secômetro e ranking
      fetchData(false);

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

  // Sincronização manual (disparada pelo botão do header)
  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao sincronizar.');

      showToast(`Tabela sincronizada! ${data.created} criadas, ${data.updated} atualizadas.`, 'success');
      fetchLastSync();
      fetchData(false);
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

  // Cálculo da classificação dos grupos para a aba Tabela
  const calculateGroupsClassification = (matchList: Match[]) => {
    const groups: Record<string, Record<string, TeamStats>> = {};
    const groupMatches = matchList.filter(m => m.stage === 'group' && m.group);

    groupMatches.forEach(m => {
      const grp = m.group!;
      if (!groups[grp]) {
        groups[grp] = {};
      }

      if (!groups[grp][m.homeTeam]) {
        groups[grp][m.homeTeam] = {
          name: m.homeTeam,
          logo: m.homeTeamLogo,
          flag: m.homeFlag,
          points: 0,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        };
      }
      if (!groups[grp][m.awayTeam]) {
        groups[grp][m.awayTeam] = {
          name: m.awayTeam,
          logo: m.awayTeamLogo,
          flag: m.awayFlag,
          points: 0,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        };
      }

      if (m.status === 'finished' && m.homeScore !== null && m.awayScore !== null) {
        const home = groups[grp][m.homeTeam];
        const away = groups[grp][m.awayTeam];

        home.played += 1;
        away.played += 1;
        home.goalsFor += m.homeScore;
        home.goalsAgainst += m.awayScore;
        away.goalsFor += m.awayScore;
        away.goalsAgainst += m.homeScore;

        if (m.homeScore > m.awayScore) {
          home.wins += 1;
          home.points += 3;
          away.losses += 1;
        } else if (m.homeScore < m.awayScore) {
          away.wins += 1;
          away.points += 3;
          home.losses += 1;
        } else {
          home.draws += 1;
          home.points += 1;
          away.draws += 1;
          away.points += 1;
        }

        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;
      }
    });

    const sortedGroups: Record<string, TeamStats[]> = {};
    Object.keys(groups).forEach(grp => {
      sortedGroups[grp] = Object.values(groups[grp]).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.name.localeCompare(b.name);
      });
    });

    return sortedGroups;
  };

  // Estatísticas para o Dashboard
  const nextMatch = Array.isArray(matches) ? matches.find(m => m.status === 'scheduled') : undefined;
  const countdownText = getNextMatchCountdownText();
  const trendingMatches = Array.isArray(matches)
    ? [...matches]
        .filter(m => m.status !== 'finished')
        .sort((a, b) => (b.predictionCount || 0) - (a.predictionCount || 0))
        .slice(0, 3)
    : [];
  const finishedMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'finished') : [];
  const groupClassification = calculateGroupsClassification(matches);

  // Palpites Recentes do Usuário para o Dashboard da Home (ordenados por data de jogo mais recente)
  const recentUserPredictions = Array.isArray(predictions) && Array.isArray(matches)
    ? [...predictions]
        .map(p => {
          const match = matches.find(m => m.id === p.matchId);
          return { prediction: p, match };
        })
        .filter(item => item.match && item.match.status === 'finished')
        .sort((a, b) => new Date(b.match!.kickOff).getTime() - new Date(a.match!.kickOff).getTime())
        .slice(0, 3)
    : [];

  // Palpites Futuros do Usuário para o Dashboard da Home (ordenados por data de jogo mais próxima)
  const upcomingUserPredictions = Array.isArray(predictions) && Array.isArray(matches)
    ? [...predictions]
        .map(p => {
          const match = matches.find(m => m.id === p.matchId);
          return { prediction: p, match };
        })
        .filter(item => item.match && item.match.status !== 'finished')
        .sort((a, b) => new Date(a.match!.kickOff).getTime() - new Date(b.match!.kickOff).getTime())
        .slice(0, 3)
    : [];
  
  const isTimeGateExpired = (kickOffStr: string) => {
    const kickOff = new Date(kickOffStr).getTime();
    const limit = kickOff - 30 * 60 * 1000;
    return Date.now() > limit;
  };

  // Streaks reais dos competidores ativos
  const usersInAlta = Array.isArray(users)
    ? [...users].filter(u => u.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5)
    : [];

  const usersInBaixa = Array.isArray(users)
    ? [...users].filter(u => u.misses > 0).sort((a, b) => b.misses - a.misses).slice(0, 5)
    : [];

  // Filtros disponíveis de rodada
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
    { value: 'r32', label: 'Trinta e dois avos (R32)' },
    { value: 'r16', label: 'Oitavas (R16)' },
    { value: 'qf', label: 'Quartas (QF)' },
    { value: 'sf', label: 'Semifinal (SF)' },
    { value: 'third', label: '3º Lugar' },
    { value: 'final', label: 'Final' },
  ];

  // Letras de Grupos de A a L para a aba Tabela
  const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Filtrar partidas conforme seleção
  const filterMatches = (matchList: Match[]) => {
    if (selectedFilter === 'all') return matchList;
    if (selectedFilter.length === 1 && selectedFilter >= 'A' && selectedFilter <= 'L') {
      return matchList.filter(m => m.group === selectedFilter);
    }
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
      // Usar flagcdn para bandeiras circulares baseado no ISO de 2 letras
      return (
        <img
          src={`https://flagcdn.com/w80/${flag.toLowerCase()}.png`}
          alt={teamName}
          className="team-flag-img"
          onError={(e) => {
            // Fallback para emoji de bandeira se falhar
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    return <span className="tbd-icon">🏳️</span>;
  };

  // Componente de renderização de time para eliminatórias (TBD)
  const TeamDisplay = ({ match, side }: { match: Match; side: 'home' | 'away' }) => {
    const isHome = side === 'home';
    const teamName = isHome ? match.homeTeam : match.awayTeam;
    const teamLogo = isHome ? match.homeTeamLogo : match.awayTeamLogo;
    const teamFlag = isHome ? match.homeFlag : match.awayFlag;
    const teamLabel = isHome ? match.homeLabel : match.awayLabel;

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
      <header className="premium-header sticky-top px-3 py-2 shadow-sm">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          
          <div className="d-flex align-items-center gap-1">
            <span className="fs-4 fw-extrabold text-white tracking-wide d-flex align-items-center gap-2 logo-glow" style={{ letterSpacing: '0.5px' }}>
              🏆 COPA<span className="text-info">ANT</span>
            </span>
            <span className="badge bg-secondary ms-2 d-none d-sm-inline-block" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>DADOS REAIS</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            
            {/* Seletor de Janela de Palpite */}
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-40 border border-secondary border-opacity-30 rounded-pill p-1 shadow-sm">
              <span className="text-secondary d-none d-lg-inline ps-2 font-monospace" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                LIBERAÇÃO:
              </span>
              <button
                className={`btn btn-sm rounded-pill px-3 py-0-5 font-monospace text-uppercase transition-all ${predictionWindow === 24 ? 'btn-neon-green text-white fw-bold active' : 'text-secondary bg-transparent border-0'}`}
                style={{ fontSize: '0.65rem', height: '24px', display: 'flex', alignItems: 'center' }}
                onClick={() => handlePredictionWindowChange(24)}
              >
                24h
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 py-0-5 font-monospace text-uppercase transition-all ${predictionWindow === 48 ? 'btn-neon-green text-white fw-bold active' : 'text-secondary bg-transparent border-0'}`}
                style={{ fontSize: '0.65rem', height: '24px', display: 'flex', alignItems: 'center' }}
                onClick={() => handlePredictionWindowChange(48)}
              >
                48h
              </button>
            </div>

            {/* Seletor de Contas Sandbox no Header */}
            <div className="d-flex align-items-center bg-dark bg-opacity-40 border border-secondary border-opacity-30 rounded-pill p-1 shadow-sm">
              <span className="text-secondary d-none d-md-inline ps-2" style={{ fontSize: '0.65rem', fontWeight: '500' }}>
                <i className="bi bi-people-fill me-1"></i> USUÁRIO:
              </span>
              <select 
                className="premium-select bg-transparent text-white border-0"
                style={{ fontSize: '0.75rem', width: '130px', outline: 'none', cursor: 'pointer', paddingRight: '20px' }}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-dark text-white">
                    {u.image} {u.name.split(' ')[0]} ({u.points} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Sincronização Dinâmico no Header */}
            <button
              className="btn d-flex align-items-center justify-content-center btn-sync-header hover-scale"
              onClick={handleManualSync}
              disabled={syncing}
              title="Sincronizar Partidas e Resultados com a API"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(29, 42, 69, 0.4)',
                border: '1px solid rgba(96, 239, 255, 0.25)',
                color: 'var(--neon-cyan)',
                transition: 'all 0.3s ease'
              }}
            >
              {syncing ? (
                <span className="spinner-border spinner-border-sm" role="status" style={{ width: '1rem', height: '1rem' }}></span>
              ) : (
                <i className="bi bi-arrow-repeat fs-6 sync-icon" style={{ display: 'inline-block' }}></i>
              )}
            </button>

            {/* Pontos do Jogador Atual */}
            <div className="glass-card px-3 py-1 d-flex align-items-center gap-2 border-0 shadow-sm"
                 style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(8, 12, 20, 0.6) 100%)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '20px' }}>
              <span className="fs-5">{currentUser?.image || '👑'}</span>
              <div className="d-flex flex-column text-start">
                <span className="text-secondary" style={{ fontSize: '0.55rem', lineHeight: 1, fontWeight: '700' }}>SEUS PONTOS</span>
                <span className="text-info fw-bold font-monospace" style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>{currentUser?.points || 0} PTS</span>
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
              <i className="bi bi-lightning-charge-fill"></i> Dar Palpites
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <i className="bi bi-calendar-event-fill"></i> Tabela / Grupos
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <i className="bi bi-trophy-fill"></i> Ranking Geral
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="bi bi-clock-history"></i> Seus Palpites
            </button>

          </div>

          {/* Rodapé da Sidebar */}
          <div className="pt-3 border-top border-secondary border-opacity-25 text-start">
            <div className="text-secondary mb-1" style={{ fontSize: '0.7rem' }}>Copa de 2026</div>
            <div className="text-info fw-bold" style={{ fontSize: '0.75rem' }}>Timing Perfeito! 🌎</div>
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
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
              <span className="text-secondary">Conectando ao banco Neon SQL & API Oficial...</span>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* ABA: HOME (Dashboard principal responsivo)               */}
              {/* ======================================================== */}
              {activeTab === 'home' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  <div className="row g-4">
                    
                    {/* Coluna Principal da Home (Esquerda) */}
                    <div className="col-12 col-lg-8">
                      
                      {/* Banner de Boas-vindas */}
                      <div className="glass-card p-4 mb-4 text-start border-info border-opacity-25" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 135, 0.05) 0%, rgba(96, 239, 255, 0.1) 100%)' }}>
                        <h4 className="text-white fw-bold mb-2">Bolão Copa 2026 com Dados em Tempo Real ⚽</h4>
                        <p className="text-secondary mb-3" style={{ fontSize: '0.9rem' }}>
                          Acompanhe o calendário oficial, veja a tabela de classificação dos grupos atualizada instantaneamente e registre seus palpites!
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                          <button className="btn btn-neon-green px-4 py-2" onClick={() => setActiveTab('matches')}>
                            <i className="bi bi-lightning-charge-fill"></i> Ir para Palpites
                          </button>
                          <button className="btn btn-neon-outline px-4 py-2" onClick={handleShareWhatsApp}>
                            <i className="bi bi-whatsapp"></i> Compartilhar
                          </button>
                        </div>
                      </div>

                      {/* Card de Desempenho no Bolão */}
                      {(() => {
                        const userRank = users.findIndex(u => u.id === selectedUserId) + 1;
                        return (
                          <div className="glass-card p-4 mb-4 text-start border-info border-opacity-35" style={{ background: 'linear-gradient(135deg, rgba(96, 239, 255, 0.05) 0%, rgba(19, 27, 46, 0.7) 100%)' }}>
                            <h5 className="text-white fw-bold mb-3">👑 Seu Desempenho no Bolão</h5>
                            <div className="row g-3">
                              <div className="col-4 text-center border-end border-secondary border-opacity-20">
                                <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500' }}>RANKING</div>
                                <div className="fs-3 fw-extrabold text-warning mt-1">
                                  {userRank > 0 ? `#${userRank}º` : '-'}
                                </div>
                                <div className="text-secondary" style={{ fontSize: '0.65rem' }}>de {users.length} jogadores</div>
                              </div>
                              <div className="col-4 text-center border-end border-secondary border-opacity-20">
                                <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500' }}>PONTOS</div>
                                <div className="fs-3 fw-extrabold text-info mt-1">{currentUser?.points || 0}</div>
                                <div className="text-secondary" style={{ fontSize: '0.65rem' }}>pontos acumulados</div>
                              </div>
                              <div className="col-4 text-center">
                                <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500' }}>SEQUÊNCIA</div>
                                <div className="fs-4 fw-bold mt-1 text-white">
                                  {currentUser && currentUser.streak > 0 ? (
                                    <span className="text-success"><i className="bi bi-fire text-danger"></i> {currentUser.streak} 🔥</span>
                                  ) : currentUser && currentUser.misses > 0 ? (
                                    <span className="text-danger"><i className="bi bi-snow text-primary"></i> {currentUser.misses} ❄️</span>
                                  ) : (
                                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Nenhuma</span>
                                  )}
                                </div>
                                <div className="text-secondary" style={{ fontSize: '0.65rem' }}>streak ativa</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Seção: Jogos em Alta (Trending Matches) */}
                      {trendingMatches.length > 0 && (
                        <div className="glass-card p-4 mb-4 text-start border-info border-opacity-25" style={{ background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.2) 0%, rgba(15, 23, 42, 0.4) 100%)' }}>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="text-white fw-bold m-0 d-flex align-items-center gap-2">
                              <span className="pulse-fire">🔥</span> Jogos em Alta
                            </h5>
                            <span className="text-secondary d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>Mais palpitados pela galera</span>
                          </div>

                          <div className="row g-3">
                            {trendingMatches.map(match => {
                              const windowStatus = getPredictionWindowStatus(match, predictionWindow);
                              const isEditable = windowStatus.isEditable;
                              const stats = matchStats[match.id];
                              const hasStats = stats && (stats.home > 0 || stats.draw > 0 || stats.away > 0);
                              const localGuess = localGuesses[match.id] || { home: '', away: '' };
                              const userPred = predictions.find(p => p.matchId === match.id);
                              const hasPrediction = !!userPred;
                              const isPredictionSaved = userPred && localGuess.home === userPred.homeGuess.toString() && localGuess.away === userPred.awayGuess.toString();

                              return (
                                <div key={`trending-${match.id}`} className="col-12 col-md-4">
                                  <div className={`glass-card p-3 h-100 d-flex flex-column justify-content-between border-secondary border-opacity-20 bg-dark bg-opacity-30 hover-scale`} style={{ minHeight: '260px' }}>
                                    
                                    {/* Cabeçalho do Card */}
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <span className="text-secondary font-monospace" style={{ fontSize: '0.65rem' }}>
                                        {new Date(match.kickOff).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(match.kickOff).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                                      </span>
                                      <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '0.6rem' }}>
                                        💬 {match.predictionCount || 0}
                                      </span>
                                    </div>

                                    {/* Times e Placar de Palpite */}
                                    <div className="d-flex align-items-center justify-content-between my-2">
                                      {/* Casa */}
                                      <div className="d-flex flex-column align-items-center" style={{ width: '30%' }}>
                                        <TeamFlag logo={match.homeTeamLogo} flag={match.homeFlag} teamName={match.homeTeam} />
                                        <span className="text-white fw-bold text-center mt-1 text-truncate w-100" style={{ fontSize: '0.75rem' }}>
                                          {match.homeTeam}
                                        </span>
                                      </div>

                                      {/* Inputs */}
                                      <div className="d-flex align-items-center gap-1 justify-content-center" style={{ width: '40%' }}>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          className="score-input"
                                          style={{ width: '34px', height: '34px', fontSize: '0.95rem', borderRadius: '6px', ...(isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : {}) }}
                                          value={localGuess.home}
                                          onChange={(e) => handleLocalGuessChange(match.id, 'home', e.target.value)}
                                          disabled={!isEditable}
                                          placeholder="-"
                                        />
                                        <span className="text-secondary" style={{ fontSize: '0.8rem' }}>x</span>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          className="score-input"
                                          style={{ width: '34px', height: '34px', fontSize: '0.95rem', borderRadius: '6px', ...(isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : {}) }}
                                          value={localGuess.away}
                                          onChange={(e) => handleLocalGuessChange(match.id, 'away', e.target.value)}
                                          disabled={!isEditable}
                                          placeholder="-"
                                        />
                                      </div>

                                      {/* Visitante */}
                                      <div className="d-flex flex-column align-items-center" style={{ width: '30%' }}>
                                        <TeamFlag logo={match.awayTeamLogo} flag={match.awayFlag} teamName={match.awayTeam} />
                                        <span className="text-white fw-bold text-center mt-1 text-truncate w-100" style={{ fontSize: '0.75rem' }}>
                                          {match.awayTeam}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Timer de Fechamento */}
                                    <div className="text-center my-2">
                                      {renderMatchTimer(match)}
                                    </div>

                                    {/* Secômetro */}
                                    <div className="my-2">
                                      {hasStats ? (
                                        <div className="thermostat-bar d-flex" style={{ height: '4px' }}>
                                          <div className="thermostat-segment-home" style={{ width: `${stats.home}%` }} title={`Vitória Casa: ${stats.home}%`}></div>
                                          <div className="thermostat-segment-draw" style={{ width: `${stats.draw}%` }} title={`Empate: ${stats.draw}%`}></div>
                                          <div className="thermostat-segment-away" style={{ width: `${stats.away}%` }} title={`Vitória Fora: ${stats.away}%`}></div>
                                        </div>
                                      ) : (
                                        <div className="thermostat-bar" style={{ height: '4px', opacity: 0.1 }}></div>
                                      )}
                                    </div>

                                    {/* Botão de Enviar */}
                                    {isEditable && (
                                      <div className="mt-1">
                                        {userPred ? (
                                          isPredictionSaved ? (
                                            <button
                                              className="btn btn-outline-success w-100 py-1"
                                              style={{ fontSize: '0.7rem', borderColor: 'rgba(0, 255, 135, 0.4)', color: 'var(--neon-green)', background: 'rgba(0, 255, 135, 0.05)', borderRadius: '6px' }}
                                              disabled
                                            >
                                              Confirmado ✓
                                            </button>
                                          ) : (
                                            <button
                                              className="btn btn-warning w-100 py-1 fw-bold text-dark"
                                              style={{ fontSize: '0.7rem', borderRadius: '6px', boxShadow: '0 0 10px rgba(255, 193, 7, 0.2)' }}
                                              onClick={() => saveUserPrediction(match.id)}
                                              disabled={savingPredictionId === match.id || localGuess.home === '' || localGuess.away === ''}
                                            >
                                              {savingPredictionId === match.id ? '...' : 'Atualizar'}
                                            </button>
                                          )
                                        ) : (
                                          <button
                                            className="btn btn-neon-green btn-sm w-100 py-1"
                                            style={{ fontSize: '0.7rem', borderRadius: '6px' }}
                                            onClick={() => saveUserPrediction(match.id)}
                                            disabled={savingPredictionId === match.id || localGuess.home === '' || localGuess.away === ''}
                                          >
                                            {savingPredictionId === match.id ? '...' : 'Palpitar'}
                                          </button>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Card Próximo Jogo Regressivo */}
                      {nextMatch ? (
                        <div className="glass-card p-4 mb-4 text-center border-secondary">
                          <span className="text-secondary fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>PRÓXIMO JOGO DA COPA</span>
                          
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

                          {countdownText && (
                            <div className="mb-2">
                              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>FECHAMENTO DO MERCADO EM:</span>
                              <div className="fs-4 fw-bold text-warning font-monospace mt-1">{countdownText}</div>
                            </div>
                          )}

                          <div className="pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.85rem' }}>
                            <i className="bi bi-clock-fill text-warning me-1"></i>
                            Início: {new Date(nextMatch.kickOff).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}h (Horário de Brasília)
                          </div>
                        </div>
                      ) : (
                        <div className="glass-card p-4 mb-4 text-center text-secondary">
                          <i className="bi bi-check2-circle fs-1 text-success mb-2"></i>
                          <h5>Nenhuma partida agendada no momento</h5>
                          <p className="m-0" style={{ fontSize: '0.85rem' }}>Aguardando sincronização de novas rodadas ou a Copa terminou.</p>
                        </div>
                      )}

                      {/* Resumo de Palpites do Usuário */}
                      <div className="glass-card p-4 text-start mb-4">
                        <h5 className="text-white fw-bold mb-3">
                          <i className="bi bi-check2-all text-info me-2"></i> Resumo de Seus Palpites
                        </h5>
                        <div className="row g-3">
                          {/* Coluna 1: Próximos Palpites */}
                          <div className="col-12 col-md-6 border-end border-secondary border-opacity-10">
                            <h6 className="text-secondary fw-bold mb-2" style={{ fontSize: '0.8rem' }}>🎯 PRÓXIMOS PALPITES</h6>
                            {upcomingUserPredictions.length > 0 ? (
                              <div className="d-flex flex-column gap-2">
                                {upcomingUserPredictions.map(item => {
                                  const match = item.match!;
                                  const pred = item.prediction;
                                  return (
                                    <div key={pred.id} className="p-2 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                                      <div className="d-flex flex-column text-truncate" style={{ maxWidth: '75%' }}>
                                        <span className="text-white fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>
                                          {match.homeTeam} vs {match.awayTeam}
                                        </span>
                                        <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
                                          {new Date(match.kickOff).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}h
                                        </span>
                                      </div>
                                      <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.75rem' }}>
                                        {pred.homeGuess} x {pred.awayGuess}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-secondary m-0" style={{ fontSize: '0.75rem' }}>
                                Nenhum palpite salvo para os próximos jogos.
                              </p>
                            )}
                          </div>

                          {/* Coluna 2: Resultados Recentes */}
                          <div className="col-12 col-md-6">
                            <h6 className="text-secondary fw-bold mb-2" style={{ fontSize: '0.8rem' }}>🏆 ÚLTIMOS RESULTADOS</h6>
                            {recentUserPredictions.length > 0 ? (
                              <div className="d-flex flex-column gap-2">
                                {recentUserPredictions.map(item => {
                                  const match = item.match!;
                                  const pred = item.prediction;
                                  const pts = calculatePredictionPoints(pred.homeGuess, pred.awayGuess, match.homeScore || 0, match.awayScore || 0);
                                  let badgeClass = 'bg-danger';
                                  if (pts === 5) badgeClass = 'bg-success';
                                  else if (pts > 0) badgeClass = 'bg-info text-dark';

                                  return (
                                    <div key={pred.id} className="p-2 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                                      <div className="d-flex flex-column text-truncate" style={{ maxWidth: '70%' }}>
                                        <span className="text-white fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>
                                          {match.homeTeam} {match.homeScore} x {match.awayScore} {match.awayTeam}
                                        </span>
                                        <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
                                          Palpite: {pred.homeGuess} x {pred.awayGuess}
                                        </span>
                                      </div>
                                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                                        +{pts} pts
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-secondary m-0" style={{ fontSize: '0.75rem' }}>
                                Nenhum palpite finalizado processado.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Coluna Lateral da Home (Direita) */}
                    <div className="col-12 col-lg-4">
                      
                      {/* Progresso do Campeonato */}
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

                      {/* Sequências (Em alta / Em baixa) */}
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
                            <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Ninguém acumulou acertos seguidos.</span>
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

                    </div>

                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: PALPITES (Dar Palpites nas rodadas)                */}
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
                  
                  {/* Grid Responsivo de Jogos */}
                  <div className="row g-3">
                    {filterMatches(matches.filter(m => m.status !== 'finished'))
                      .map(match => {
                        const windowStatus = getPredictionWindowStatus(match, predictionWindow);
                        const isEditable = windowStatus.isEditable;
                        const stats = matchStats[match.id];
                        const hasStats = stats && (stats.home > 0 || stats.draw > 0 || stats.away > 0);
                        const localGuess = localGuesses[match.id] || { home: '', away: '' };
                        const userPred = predictions.find(p => p.matchId === match.id);
                        const hasPrediction = !!userPred;
                        const isPredictionSaved = userPred && localGuess.home === userPred.homeGuess.toString() && localGuess.away === userPred.awayGuess.toString();

                        return (
                          <div key={match.id} className="col-12 col-lg-6">
                            <div className={`glass-card p-3 h-100 d-flex flex-column justify-content-between text-start ${hasPrediction ? 'border-success-subtle' : ''}`}>
                              
                              {/* Status e Data */}
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                  {new Date(match.kickOff).toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                  })}h
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
                                <div className="d-flex align-items-center gap-1">
                                  {hasPrediction && (
                                    <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 me-1" style={{ fontSize: '0.65rem' }}>
                                      ✓ Palpitado
                                    </span>
                                  )}
                                  {renderMatchTimer(match)}
                                </div>
                              </div>

                              {/* Placar e Botões */}
                              <div className="d-flex align-items-center justify-content-between my-2">
                                <TeamDisplay match={match} side="home" />

                                <div className="d-flex align-items-center justify-content-center gap-2" style={{ width: '36%' }}>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="score-input"
                                    style={isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : undefined}
                                    value={localGuess.home}
                                    onChange={(e) => handleLocalGuessChange(match.id, 'home', e.target.value)}
                                    disabled={!isEditable}
                                    placeholder="-"
                                  />
                                  <span className="text-secondary fw-bold">x</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="score-input"
                                    style={isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : undefined}
                                    value={localGuess.away}
                                    onChange={(e) => handleLocalGuessChange(match.id, 'away', e.target.value)}
                                    disabled={!isEditable}
                                    placeholder="-"
                                  />
                                </div>

                                <TeamDisplay match={match} side="away" />
                              </div>

                              {/* Placar ao vivo */}
                              {match.status === 'live' && match.homeScore !== null && match.awayScore !== null && (
                                <div className="text-center my-1">
                                  <span className="text-info fw-bold fs-5">{match.homeScore} - {match.awayScore}</span>
                                  <span className="text-secondary ms-2" style={{ fontSize: '0.7rem' }}>PLACAR ATUAL</span>
                                </div>
                              )}

                              {/* Botão de Enviar */}
                              {isEditable && (
                                <div className="mt-3">
                                  {userPred ? (
                                    isPredictionSaved ? (
                                      <button
                                        className="btn btn-outline-success w-100 py-1"
                                        style={{
                                          borderColor: 'rgba(0, 255, 135, 0.5)',
                                          color: 'var(--neon-green)',
                                          background: 'rgba(0, 255, 135, 0.05)',
                                          fontWeight: '600',
                                          borderRadius: '10px'
                                        }}
                                        disabled
                                      >
                                        Palpite Confirmado ✓
                                      </button>
                                    ) : (
                                      <button
                                        className="btn btn-warning w-100 py-1 fw-bold text-dark"
                                        style={{
                                          borderRadius: '10px',
                                          boxShadow: '0 0 15px rgba(255, 193, 7, 0.3)'
                                        }}
                                        onClick={() => saveUserPrediction(match.id)}
                                        disabled={savingPredictionId === match.id || localGuess.home === '' || localGuess.away === ''}
                                      >
                                        {savingPredictionId === match.id ? 'Salvando...' : 'Atualizar Palpite'}
                                      </button>
                                    )
                                  ) : (
                                    <button
                                      className="btn btn-neon-green btn-sm w-100 py-1"
                                      onClick={() => saveUserPrediction(match.id)}
                                      disabled={savingPredictionId === match.id || localGuess.home === '' || localGuess.away === ''}
                                    >
                                      {savingPredictionId === match.id ? 'Salvando...' : 'Confirmar Palpite'}
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Secômetro */}
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
                      <p className="mt-2">Sem partidas pendentes de palpites neste filtro.</p>
                    </div>
                  )}

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: CALENDÁRIO E TABELA DE CLASSIFICAÇÃO DOS GRUPOS     */}
              {/* ======================================================== */}
              {activeTab === 'calendar' && (
                <div className="fade-in animate__animated animate__fadeIn text-start">
                  
                  <h4 className="text-white fw-bold mb-3">📅 Tabela de Classificação & Jogos</h4>

                  {/* Seletor de Grupos */}
                  <div className="filter-bar mb-4">
                    {groupLetters.map(letter => (
                      <button
                        key={letter}
                        className={`filter-chip ${selectedGroupTab === letter ? 'active' : ''}`}
                        onClick={() => setSelectedGroupTab(letter)}
                      >
                        Grupo {letter}
                      </button>
                    ))}
                  </div>

                  {/* Classificação do Grupo Selecionado */}
                  <div className="glass-card p-3 mb-4">
                    <h5 className="text-info fw-bold mb-3">Tabela do Grupo {selectedGroupTab}</h5>
                    <div className="table-responsive">
                      <table className="table table-dark table-striped align-middle m-0" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr className="text-secondary">
                            <th scope="col" style={{ width: '40px' }}>#</th>
                            <th scope="col">Seleção</th>
                            <th scope="col" className="text-center" title="Pontos">P</th>
                            <th scope="col" className="text-center" title="Jogos">J</th>
                            <th scope="col" className="text-center" title="Vitórias">V</th>
                            <th scope="col" className="text-center" title="Empates">E</th>
                            <th scope="col" className="text-center" title="Derrotas">D</th>
                            <th scope="col" className="text-center" title="Gols Pró">GP</th>
                            <th scope="col" className="text-center" title="Gols Contra">GC</th>
                            <th scope="col" className="text-center" title="Saldo de Gols">SG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupClassification[selectedGroupTab] ? (
                            groupClassification[selectedGroupTab].map((team, idx) => (
                              <tr key={team.name} className={idx < 2 ? 'border-start border-info border-4' : ''}>
                                <td>{idx + 1}</td>
                                <td className="fw-bold text-white d-flex align-items-center gap-2">
                                  <TeamFlag logo={team.logo} flag={team.flag} teamName={team.name} />
                                  <span>{team.name}</span>
                                </td>
                                <td className="text-center text-info fw-bold">{team.points}</td>
                                <td className="text-center">{team.played}</td>
                                <td className="text-center">{team.wins}</td>
                                <td className="text-center">{team.draws}</td>
                                <td className="text-center">{team.losses}</td>
                                <td className="text-center">{team.goalsFor}</td>
                                <td className="text-center">{team.goalsAgainst}</td>
                                <td className="text-center text-secondary">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={10} className="text-center text-secondary py-3">Carregando dados dos times...</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-secondary px-1" style={{ fontSize: '0.7rem' }}>
                      * Os dois primeiros classificados avançam para a fase de 32 avos (R32).
                    </div>
                  </div>

                  {/* Confrontos do Grupo Selecionado */}
                  <div className="glass-card p-3">
                    <h5 className="text-white fw-bold mb-3">Confrontos do Grupo {selectedGroupTab}</h5>
                    
                    <div className="d-flex flex-column gap-3">
                      {matches
                        .filter(m => m.stage === 'group' && m.group === selectedGroupTab)
                        .map(match => {
                          const isFinished = match.status === 'finished';
                          const isLive = match.status === 'live';
                          
                          return (
                            <div key={match.id} className="d-flex align-items-center justify-content-between p-3 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10">
                              
                              {/* Data e hora local */}
                              <div style={{ width: '22%' }} className="text-secondary">
                                <span style={{ fontSize: '0.75rem', display: 'block' }}>
                                  {new Date(match.kickOff).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                                <span style={{ fontSize: '0.7rem', display: 'block' }}>
                                  {new Date(match.kickOff).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                                </span>
                              </div>

                              {/* Time Casa */}
                              <div className="d-flex align-items-center justify-content-end gap-2 text-end" style={{ width: '28%' }}>
                                <span className="fw-bold text-white text-truncate" style={{ fontSize: '0.8rem' }}>{match.homeTeam}</span>
                                <TeamFlag logo={match.homeTeamLogo} flag={match.homeFlag} teamName={match.homeTeam} />
                              </div>

                              {/* Placar */}
                              <div className="text-center px-2 d-flex flex-column align-items-center" style={{ width: '20%' }}>
                                {isFinished ? (
                                  <span className="fs-5 fw-extrabold text-info font-monospace">{match.homeScore} - {match.awayScore}</span>
                                ) : isLive ? (
                                  <div className="d-flex flex-column">
                                    <span className="fs-5 fw-extrabold text-danger font-monospace">{match.homeScore} - {match.awayScore}</span>
                                    <span className="badge bg-danger elapsed-badge mt-1" style={{ fontSize: '0.55rem' }}>LIVE {match.elapsed}'</span>
                                  </div>
                                ) : (
                                  <span className="text-secondary fw-semibold font-monospace" style={{ fontSize: '0.85rem' }}>VS</span>
                                )}
                              </div>

                              {/* Time Fora */}
                              <div className="d-flex align-items-center justify-content-start gap-2 text-start" style={{ width: '30%' }}>
                                <TeamFlag logo={match.awayTeamLogo} flag={match.awayFlag} teamName={match.awayTeam} />
                                <span className="fw-bold text-white text-truncate" style={{ fontSize: '0.8rem' }}>{match.awayTeam}</span>
                              </div>

                            </div>
                          );
                        })}
                    </div>

                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: LEADERBOARD / RANKING GERAL                         */}
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
                              {user.streak >= 3 && <span className="pulse-fire" title={`Sequência de ${user.streak} acertos`}>🔥</span>}
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
              {/* ABA: HISTÓRICO DE PALPITES DO JOGADOR                    */}
              {/* ======================================================== */}
              {activeTab === 'history' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  <h4 className="text-white fw-bold mb-4 text-start">📜 Seus Palpites (Próximos & Histórico)</h4>

                  {predictions.length === 0 ? (
                    <div className="text-center py-5 text-secondary glass-card p-5">
                      <i className="bi bi-patch-question-fill fs-1 text-info mb-3 d-block"></i>
                      <h5>Você ainda não fez nenhum palpite!</h5>
                      <p className="mb-4 text-secondary" style={{ fontSize: '0.85rem' }}>Comece a palpitar nos próximos jogos e suba no ranking!</p>
                      <button className="btn btn-neon-green px-4 py-2" onClick={() => setActiveTab('matches')}>
                        <i className="bi bi-lightning-charge-fill"></i> Dar Palpites Agora
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-4">
                      
                      {/* Seção 1: Próximos Jogos Palpitados */}
                      <div>
                        <h5 className="text-info fw-bold mb-3 text-start">
                          <i className="bi bi-calendar-event me-2"></i> Próximos Jogos Palpitados
                        </h5>
                        
                        {matches.filter(m => m.status !== 'finished' && predictions.some(p => p.matchId === m.id)).length === 0 ? (
                          <div className="glass-card p-4 text-center text-secondary">
                            <p className="m-0" style={{ fontSize: '0.85rem' }}>Nenhum palpite pendente para próximos jogos.</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {matches
                              .filter(m => m.status !== 'finished' && predictions.some(p => p.matchId === m.id))
                              .map(match => {
                                const windowStatus = getPredictionWindowStatus(match, predictionWindow);
                                const isEditable = windowStatus.isEditable;
                                const stats = matchStats[match.id];
                                const hasStats = stats && (stats.home > 0 || stats.draw > 0 || stats.away > 0);
                                const localGuess = localGuesses[match.id] || { home: '', away: '' };
                                const userPred = predictions.find(p => p.matchId === match.id);
                                const isPredictionSaved = userPred && localGuess.home === userPred.homeGuess.toString() && localGuess.away === userPred.awayGuess.toString();

                                return (
                                  <div key={match.id} className="col-12 col-lg-6">
                                    <div className="glass-card p-3 h-100 d-flex flex-column justify-content-between text-start border-success-subtle">
                                      
                                      {/* Status e Data */}
                                      <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                          {new Date(match.kickOff).toLocaleDateString('pt-BR', {
                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                          })}h
                                          {match.group && (
                                            <span className="ms-1 badge bg-dark border border-secondary" style={{ fontSize: '0.6rem' }}>
                                              Grupo {match.group}
                                            </span>
                                          )}
                                        </span>
                                        <div className="d-flex align-items-center gap-1">
                                          <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 me-1" style={{ fontSize: '0.65rem' }}>
                                            ✓ Palpitado
                                          </span>
                                          {renderMatchTimer(match)}
                                        </div>
                                      </div>

                                      {/* Placar e Botões */}
                                      <div className="d-flex align-items-center justify-content-between my-2">
                                        <TeamDisplay match={match} side="home" />

                                        <div className="d-flex align-items-center justify-content-center gap-2" style={{ width: '36%' }}>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            className="score-input"
                                            style={isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : undefined}
                                            value={localGuess.home}
                                            onChange={(e) => handleLocalGuessChange(match.id, 'home', e.target.value)}
                                            disabled={!isEditable}
                                            placeholder="-"
                                          />
                                          <span className="text-secondary fw-bold">x</span>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            className="score-input"
                                            style={isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : undefined}
                                            value={localGuess.away}
                                            onChange={(e) => handleLocalGuessChange(match.id, 'away', e.target.value)}
                                            disabled={!isEditable}
                                            placeholder="-"
                                          />
                                        </div>

                                        <TeamDisplay match={match} side="away" />
                                      </div>

                                      {/* Botão de Enviar / Atualizar */}
                                      {isEditable && (
                                        <div className="mt-3">
                                          {isPredictionSaved ? (
                                            <button
                                              className="btn btn-outline-success w-100 py-1"
                                              style={{
                                                borderColor: 'rgba(0, 255, 135, 0.5)',
                                                color: 'var(--neon-green)',
                                                background: 'rgba(0, 255, 135, 0.05)',
                                                fontWeight: '600',
                                                borderRadius: '10px'
                                              }}
                                              disabled
                                            >
                                              Palpite Confirmado ✓
                                            </button>
                                          ) : (
                                            <button
                                              className="btn btn-warning w-100 py-1 fw-bold text-dark"
                                              style={{
                                                borderRadius: '10px',
                                                boxShadow: '0 0 15px rgba(255, 193, 7, 0.3)'
                                              }}
                                              onClick={() => saveUserPrediction(match.id)}
                                              disabled={savingPredictionId === match.id || localGuess.home === '' || localGuess.away === ''}
                                            >
                                              {savingPredictionId === match.id ? 'Salvando...' : 'Atualizar Palpite'}
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {/* Secômetro */}
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
                                            Nenhum outro palpite registrado
                                          </div>
                                        )}
                                      </div>

                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* Seção 2: Partidas Encerradas */}
                      <div>
                        <h5 className="text-white fw-bold mb-3 text-start">
                          <i className="bi bi-clock-history me-2"></i> Partidas Encerradas com Palpites
                        </h5>
                        
                        {matches.filter(m => m.status === 'finished' && predictions.some(p => p.matchId === m.id)).length === 0 ? (
                          <div className="glass-card p-4 text-center text-secondary">
                            <p className="m-0" style={{ fontSize: '0.85rem' }}>Nenhum palpite encerrado ainda.</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {matches
                              .filter(m => m.status === 'finished' && predictions.some(p => p.matchId === m.id))
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

                                      {userPred && (
                                        <div className="mt-2 p-2 rounded text-center bg-dark bg-opacity-40 border border-secondary border-opacity-25" style={{ fontSize: '0.8rem' }}>
                                          <span className="text-secondary">Palpite feito:</span>{' '}
                                          <strong className="text-white">
                                            {match.homeTeam} {userPred.homeGuess} x {userPred.awayGuess} {match.awayTeam}
                                          </strong>
                                        </div>
                                      )}

                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

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
          <span>Palpitar</span>
        </button>
 
        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <i className="bi bi-calendar-event-fill"></i>
          <span>Tabela</span>
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
          <span>Meus Palpites</span>
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
