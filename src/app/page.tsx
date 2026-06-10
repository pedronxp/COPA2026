// src/app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSquadForTeam } from '@/lib/squads-data';

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
  role?: string;
}

interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  leagueId?: string;
  homeGuess: number;
  awayGuess: number;
  processed: boolean;
  editCount?: number;
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
  const [activeTab, setActiveTab] = useState<'home' | 'matches' | 'results' | 'leaderboard' | 'calendar' | 'history' | 'leagues' | 'auth'>('home');
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  // Estados de Autenticação Local
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authImage, setAuthImage] = useState<string>('⚽');

  // Estados de Bolões Customizados (Leagues)
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('global');
  const [joinCode, setJoinCode] = useState<string>('');
  const [activeLeagueTab, setActiveLeagueTab] = useState<'ranking' | 'matches' | 'results' | 'rules' | 'admin'>('ranking');
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [leagueForm, setLeagueForm] = useState({
    name: '',
    description: '',
    expiresAt: '',
    windowHours: '48',
    maxEdits: '3',
    pointsExact: '5',
    pointsDiff: '3',
    pointsWinner: '2',
    pointsDraw: '2'
  });

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

  // Tempo real de sincronização dos cronômetros e janela de liberação
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [predictionWindow, setPredictionWindow] = useState<number>(48);

  // Estados adicionais da Fase 5 (Escalações, Sanfona e Melhorias)
  const [expandedLeagueProgressId, setExpandedLeagueProgressId] = useState<string | null>(null);
  
  const [showLineupModal, setShowLineupModal] = useState<boolean>(false);
  const [selectedLineupMatchId, setSelectedLineupMatchId] = useState<string | null>(null);
  const [lineupData, setLineupData] = useState<any>(null);
  const [loadingLineup, setLoadingLineup] = useState<boolean>(false);
  const [lineupTeamTab, setLineupTeamTab] = useState<'home' | 'away'>('home');

  // Estados adicionais da Fase 5.2 (Filtro de Desempenho, Liderança de Bolões e Expansão)
  const [desempenhoLeagueId, setDesempenhoLeagueId] = useState<string>('global');
  const [globalUserPoints, setGlobalUserPoints] = useState<number>(0);
  const [globalUserRank, setGlobalUserRank] = useState<number>(0);
  const [globalTotalUsers, setGlobalTotalUsers] = useState<number>(0);
  const [globalStreak, setGlobalStreak] = useState<number>(0);
  const [globalMisses, setGlobalMisses] = useState<number>(0);
  const [isUserGlobalLeader, setIsUserGlobalLeader] = useState<boolean>(false);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Estados para simulação de escalações no Sandbox
  const [sandboxLineupMatchId, setSandboxLineupMatchId] = useState<string>('');
  const [sandboxLineupHomeFormation, setSandboxLineupHomeFormation] = useState<string>('4-3-3');
  const [sandboxLineupAwayFormation, setSandboxLineupAwayFormation] = useState<string>('4-3-3');
  const [sandboxLineupHomeStarting, setSandboxLineupHomeStarting] = useState<string>('');
  const [sandboxLineupAwayStarting, setSandboxLineupAwayStarting] = useState<string>('');
  const [sandboxLineupHomeSubs, setSandboxLineupHomeSubs] = useState<string>('');
  const [sandboxLineupAwaySubs, setSandboxLineupAwaySubs] = useState<string>('');

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

  // Buscar bolões do usuário
  const fetchLeagues = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues?userId=${selectedUserId}`);
      if (res.ok) {
        const data = await res.json();
        setLeagues(data);
      }
    } catch (e) {
      console.error('Erro ao buscar bolões:', e);
    }
  }, [selectedUserId]);

  // Buscar pedidos de redefinição de senha
  const fetchResetRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/reset-requests');
      if (res.ok) {
        const data = await res.json();
        setResetRequests(data);
      }
    } catch (e) {
      console.error('Erro ao buscar solicitações de senha:', e);
    }
  }, []);

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

      // Usuários (Ranking do Bolão Ativo)
      const usersRes = await fetch(`/api/leagues/members?leagueId=${selectedLeagueId}`);
      let usersData: UserProfile[] = [];
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data)) {
          usersData = data;
          setUsers(usersData);

          // Se for o bolão global, salvar no cache para o card de desempenho na Home
          if (selectedLeagueId === 'global') {
            const idx = usersData.findIndex((u: UserProfile) => u.id === selectedUserId);
            const userRankVal = idx !== -1 ? idx + 1 : 0;
            setGlobalUserRank(userRankVal);
            setGlobalTotalUsers(usersData.length);
            const cur = idx !== -1 ? usersData[idx] : null;
            if (cur) {
              setGlobalUserPoints(cur.points);
              setGlobalStreak(cur.streak);
              setGlobalMisses(cur.misses);
            }
            // Verificar liderança global do usuário logado
            const isLeader = usersData.length > 0 && usersData[0].id === selectedUserId && usersData[0].points > 0;
            setIsUserGlobalLeader(isLeader);
          }
        }
      }

      // Usuário logado
      if (usersData.length > 0) {
        const curUser = usersData.find((u: UserProfile) => u.id === selectedUserId) || usersData.find((u: UserProfile) => u.id === 'currentUser');
        setCurrentUser(curUser || null);
      }

      // Palpites do usuário
      const predsRes = await fetch(`/api/predictions?userId=${selectedUserId}&leagueId=${selectedLeagueId}`);
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
            const statsRes = await fetch(`/api/matches/stats?matchId=${m.id}&leagueId=${selectedLeagueId}`);
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
  }, [selectedUserId, selectedLeagueId]);

  // Carregar usuário logado do localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('authenticatedUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setLoggedInUser(parsed);
        setSelectedUserId(parsed.id);
      } catch (e) {
        console.error('Erro ao parsear usuário logado:', e);
      }
    }
  }, []);

  // Sync automático ao carregar + fetch de dados e bolões
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
    fetchLeagues();
    fetchResetRequests();
  }, [fetchData, fetchLeagues, fetchResetRequests]);

  const handleViewLineup = async (matchId: string) => {
    setSelectedLineupMatchId(matchId);
    setLineupData(null);
    setLoadingLineup(true);
    setLineupTeamTab('home');
    setShowLineupModal(true);
    try {
      const res = await fetch(`/api/matches/lineup?matchId=${matchId}`);
      const data = await res.json();
      if (res.ok) {
        setLineupData(data);
      } else {
        showToast(data.error || 'Erro ao carregar escalação.', 'danger');
      }
    } catch {
      showToast('Erro ao carregar escalação.', 'danger');
    } finally {
      setLoadingLineup(false);
    }
  };

  const handleSaveSandboxLineup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxLineupMatchId) {
      showToast('Selecione uma partida.', 'danger');
      return;
    }
    try {
      const res = await fetch('/api/matches/lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: sandboxLineupMatchId,
          homeFormation: sandboxLineupHomeFormation,
          awayFormation: sandboxLineupAwayFormation,
          homeStarting: sandboxLineupHomeStarting ? JSON.parse(sandboxLineupHomeStarting) : [],
          awayStarting: sandboxLineupAwayStarting ? JSON.parse(sandboxLineupAwayStarting) : [],
          homeSubstitutes: sandboxLineupHomeSubs ? JSON.parse(sandboxLineupHomeSubs) : [],
          awaySubstitutes: sandboxLineupAwaySubs ? JSON.parse(sandboxLineupAwaySubs) : []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar escalação.');
      showToast('Escalação oficial salva com sucesso na Sandbox!', 'success');
      setSandboxLineupMatchId('');
      setSandboxLineupHomeStarting('');
      setSandboxLineupAwayStarting('');
      setSandboxLineupHomeSubs('');
      setSandboxLineupAwaySubs('');
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar escalação. Verifique se o JSON é válido.', 'danger');
    }
  };

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

  // Salvar palpite na API (com validação do Time Gate e limite de edições)
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
          leagueId: selectedLeagueId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar palpite.');

      showToast('Palpite registrado!', 'success');
      
      // Atualizar lista de palpites
      const predsRes = await fetch(`/api/predictions?userId=${selectedUserId}&leagueId=${selectedLeagueId}`);
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

  // ========================================================
  // FUNÇÕES DE AUTENTICAÇÃO E SESSÃO
  // ========================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast('Preencha todos os campos.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao realizar login.');

      showToast(`Bem-vindo de volta, ${data.user.name}!`, 'success');
      localStorage.setItem('authenticatedUser', JSON.stringify(data.user));
      setLoggedInUser(data.user);
      setSelectedUserId(data.user.id);
      
      // Limpar campos
      setAuthEmail('');
      setAuthPassword('');
      setActiveTab('home');
      fetchLeagues();
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authName) {
      showToast('Nome, e-mail e senha são obrigatórios.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          image: authImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no cadastro.');

      showToast('Conta criada com sucesso! Faça login.', 'success');
      setAuthMode('login');
      setAuthPassword('');
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast('E-mail e a nova senha proposta são obrigatórios.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, newPassword: authPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao solicitar troca.');

      showToast('Pedido enviado! Aguarde aprovação do admin.', 'success');
      setAuthMode('login');
      setAuthPassword('');
      fetchResetRequests();
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authenticatedUser');
    setLoggedInUser(null);
    setSelectedUserId('currentUser'); // reverte para sandbox/currentUser
    setSelectedLeagueId('global');
    showToast('Sessão encerrada.', 'success');
    setActiveTab('home');
  };

  const handleResetRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/auth/reset-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar pedido.');

      showToast(data.message, 'success');
      fetchResetRequests();
      fetchData(false);
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  // ========================================================
  // FUNÇÕES DE GERENCIAMENTO DE BOLÕES
  // ========================================================

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueForm.name) {
      showToast('O nome do bolão é obrigatório.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': selectedUserId,
        },
        body: JSON.stringify(leagueForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar bolão.');

      showToast(`Bolão "${data.name}" criado com sucesso!`, 'success');
      fetchLeagues();
      setSelectedLeagueId(data.id);
      
      // Reset form
      setLeagueForm({
        name: '',
        description: '',
        expiresAt: '',
        windowHours: '48',
        maxEdits: '3',
        pointsExact: '5',
        pointsDiff: '3',
        pointsWinner: '2',
        pointsDraw: '2'
      });
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) {
      showToast('O código de convite é obrigatório.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': selectedUserId,
        },
        body: JSON.stringify({ inviteCode: joinCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar no bolão.');

      showToast(data.message, 'success');
      setJoinCode('');
      fetchLeagues();
      setSelectedLeagueId(data.league.id);
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  const handleLeagueMemberAction = async (targetMemberId: string, action: 'promote' | 'demote' | 'remove') => {
    try {
      const res = await fetch('/api/leagues', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': selectedUserId,
        },
        body: JSON.stringify({
          leagueId: selectedLeagueId,
          targetMemberId,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerenciar membro.');

      showToast(data.message, 'success');
      fetchData(false);
    } catch (error: any) {
      showToast(error.message, 'danger');
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

  // Remoção robusta de partidas duplicadas (evita bugs como dois jogos do México)
  const uniqueMatches = Array.isArray(matches)
    ? matches.filter((match, index, self) => 
        self.findIndex(m => m.id === match.id) === index &&
        self.findIndex(m => m.homeTeam === match.homeTeam && m.awayTeam === match.awayTeam && new Date(m.kickOff).toDateString() === new Date(match.kickOff).toDateString()) === index
      )
    : [];

  // Estatísticas para o Dashboard
  // Jogo Principal da Home: O primeiro jogo cronológico agendado que o usuário ainda não palpitou.
  // Se ele já palpitou, mostra o próximo jogo agendado do dia/copa no qual ele ainda não palpitou.
  const nextMatch = uniqueMatches.filter(m => m.status === 'scheduled').find(m => 
    !predictions.some(p => p.matchId === m.id && p.leagueId === selectedLeagueId)
  ) || uniqueMatches.find(m => m.status === 'scheduled');

  const countdownText = getNextMatchCountdownText();
  
  // Jogos em alta: Mais palpitados no bolão, sem jogos duplicados
  const trendingMatches = [...uniqueMatches]
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => (b.predictionCount || 0) - (a.predictionCount || 0))
    .slice(0, 3);
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

  // Agrupar partidas por data do calendário formatada
  const groupMatchesByDay = (matchList: Match[]) => {
    const groups: Record<string, Match[]> = {};
    const sorted = [...matchList].sort((a, b) => new Date(a.kickOff).getTime() - new Date(b.kickOff).getTime());
    
    sorted.forEach(m => {
      const dateObj = new Date(m.kickOff);
      const dateStr = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      });
      const formattedDay = dateStr
        .split(' ')
        .map((word, idx) => {
          if (idx === 0 || (idx === 3 && word !== 'de')) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word;
        })
        .join(' ');

      if (!groups[formattedDay]) {
        groups[formattedDay] = [];
      }
      groups[formattedDay].push(m);
    });
    return groups;
  };

  // Converte emoji de bandeira de país para código ISO de duas letras
  const emojiToIsoCode = (emoji: string): string | null => {
    if (!emoji) return null;
    try {
      const codePoints = Array.from(emoji).map(c => c.codePointAt(0));
      if (
        codePoints.length >= 2 &&
        codePoints[0]! >= 0x1F1E6 && codePoints[0]! <= 0x1F1FF &&
        codePoints[1]! >= 0x1F1E6 && codePoints[1]! <= 0x1F1FF
      ) {
        const char1 = String.fromCharCode(codePoints[0]! - 0x1F1E6 + 65);
        const char2 = String.fromCharCode(codePoints[1]! - 0x1F1E6 + 65);
        return (char1 + char2).toLowerCase();
      }
    } catch {
      // Ignora erro
    }
    return null;
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
      // Tentar converter emoji de bandeira para código ISO
      const isoCode = emojiToIsoCode(flag) || flag;
      const isIsoCode = isoCode.length === 2 && /^[a-zA-Z]{2}$/.test(isoCode);
      if (isIsoCode) {
        return (
          <img
            src={`https://flagcdn.com/w80/${isoCode.toLowerCase()}.png`}
            alt={teamName}
            className="team-flag-img"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        );
      } else {
        // Se for emoji de bandeira que falhou na conversão, renderiza o emoji com tamanho adequado
        return (
          <span className="team-flag-emoji d-inline-flex align-items-center justify-content-center" style={{ fontSize: '2rem', width: '44px', height: '44px', lineHeight: '1' }}>
            {flag}
          </span>
        );
      }
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
              Copa 2026
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            
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
              title="Home"
            >
              <i className="bi bi-house-door-fill"></i>
              <span>Home</span>
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveTab('matches')}
              title="Dar Palpites"
            >
              <i className="bi bi-lightning-charge-fill"></i>
              <span>Dar Palpites</span>
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
              title="Resultados"
            >
              <i className="bi bi-clipboard-data-fill"></i>
              <span>Resultados</span>
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              title="Tabela / Grupos"
            >
              <i className="bi bi-calendar-event-fill"></i>
              <span>Tabela / Grupos</span>
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
              title="Ranking Geral"
            >
              <i className="bi bi-trophy-fill"></i>
              <span>Ranking Geral</span>
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              title="Seus Palpites"
            >
              <i className="bi bi-clock-history"></i>
              <span>Seus Palpites</span>
            </button>

            <button 
              className={`desktop-sidebar-item ${activeTab === 'leagues' ? 'active' : ''}`}
              onClick={() => setActiveTab('leagues')}
              title="Bolões Customizados"
            >
              <i className="bi bi-people-fill"></i>
              <span>Bolões</span>
            </button>

          </div>

          {/* Rodapé da Sidebar */}
          <div className="pt-3 border-top border-secondary border-opacity-25 text-start desktop-sidebar-footer d-flex flex-column gap-2">
            {loggedInUser ? (
              <>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '1.25rem' }}>{loggedInUser.image || '⚽'}</span>
                  <div className="min-w-0" style={{ maxWidth: '140px' }}>
                    <div className="text-white fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>{loggedInUser.name}</div>
                    <div className="text-secondary text-truncate" style={{ fontSize: '0.65rem' }}>{loggedInUser.email}</div>
                  </div>
                </div>
                <button 
                  className="btn btn-outline-danger btn-sm w-100 py-1"
                  style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Sair
                </button>
              </>
            ) : (
              <button 
                className="btn btn-neon-green btn-sm w-100 py-1"
                style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                onClick={() => {
                  setAuthMode('login');
                  setActiveTab('auth');
                }}
              >
                <i className="bi bi-person-lock me-1"></i> Entrar / Cadastrar
              </button>
            )}
            <div className="text-secondary mt-1" style={{ fontSize: '0.65rem' }}>Copa de 2026 🌎</div>
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
              <span className="text-secondary">Carregando dados da Copa 2026...</span>
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
                        <h4 className="text-white fw-bold mb-2">🏆 Copa do Mundo 2026 - Bolão Oficial!</h4>
                        <p className="text-secondary mb-3" style={{ fontSize: '0.9rem' }}>
                          Faça seus palpites nos maiores confrontos do planeta, suba no ranking em tempo real e dispute a liderança do bolão definitivo da Copa de 2026!
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
                        let points = 0;
                        let rankStr = '-';
                        let totalMembers = 0;
                        let streakVal = 0;
                        let missesVal = 0;

                        if (desempenhoLeagueId === 'global') {
                          points = globalUserPoints;
                          rankStr = globalUserRank > 0 ? `#${globalUserRank}º` : '-';
                          totalMembers = globalTotalUsers;
                          streakVal = globalStreak;
                          missesVal = globalMisses;
                        } else {
                          const leg = leagues.find(l => l.id === desempenhoLeagueId);
                          if (leg) {
                            points = leg.userPoints || 0;
                            rankStr = leg.userRank > 0 ? `#${leg.userRank}º` : '-';
                            totalMembers = leg.memberCount || 0;
                          }
                          // Manter a sequência global do site como referência geral
                          streakVal = globalStreak;
                          missesVal = globalMisses;
                        }

                        return (
                          <div className="glass-card p-4 mb-4 text-start border-info border-opacity-35" style={{ background: 'linear-gradient(135deg, rgba(96, 239, 255, 0.05) 0%, rgba(19, 27, 46, 0.7) 100%)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                              <h5 className="text-white fw-bold m-0">👑 Seu Desempenho no Bolão</h5>
                              <select 
                                className="form-select form-select-sm text-white border-secondary border-opacity-35 cursor-pointer" 
                                style={{ width: 'auto', minWidth: '180px', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
                                value={desempenhoLeagueId}
                                onChange={(e) => setDesempenhoLeagueId(e.target.value)}
                              >
                                <option value="global">🌎 Bolão Global (Site)</option>
                                {leagues.filter(l => l.id !== 'global').map(l => (
                                  <option key={l.id} value={l.id}>👥 {l.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="row g-3">
                              <div className="col-4 text-center border-end border-secondary border-opacity-20">
                                <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500' }}>RANKING</div>
                                <div className="fs-3 fw-extrabold text-warning mt-1">
                                  {rankStr}
                                </div>
                                <div className="text-secondary" style={{ fontSize: '0.65rem' }}>de {totalMembers} jogadores</div>
                              </div>
                              <div className="col-4 text-center border-end border-secondary border-opacity-20">
                                <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500' }}>PONTOS</div>
                                <div className="fs-3 fw-extrabold text-info mt-1">{points}</div>
                                <div className="text-secondary" style={{ fontSize: '0.65rem' }}>pontos acumulados</div>
                              </div>
                              <div className="col-4 text-center">
                                <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500' }}>SEQUÊNCIA</div>
                                <div className="fs-4 fw-bold mt-1 text-white">
                                  {streakVal > 0 ? (
                                    <span className="text-success"><i className="bi bi-fire text-danger"></i> {streakVal} 🔥</span>
                                  ) : missesVal > 0 ? (
                                    <span className="text-danger"><i className="bi bi-snow text-primary"></i> {missesVal} ❄️</span>
                                  ) : (
                                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Nenhuma</span>
                                  )}
                                </div>
                                <div className="text-secondary" style={{ fontSize: '0.65rem' }}>
                                  {desempenhoLeagueId === 'global' ? 'streak ativa' : 'streak geral (site)'}
                                </div>
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
                              const stats = matchStats[match.id];
                              const hasStats = stats && (stats.home > 0 || stats.draw > 0 || stats.away > 0);
                              const localGuess = localGuesses[match.id] || { home: '', away: '' };
                              const userPred = predictions.find(p => p.matchId === match.id && p.leagueId === selectedLeagueId);
                              const isPredictionSaved = userPred && localGuess.home === userPred.homeGuess.toString() && localGuess.away === userPred.awayGuess.toString();

                              const currentLeague = leagues.find(l => l.id === selectedLeagueId);
                              const maxEdits = currentLeague ? currentLeague.maxEdits : 3;
                              const editCount = userPred ? (userPred.editCount ?? 0) : 0;
                              const reachedLimit = userPred && editCount >= maxEdits;
                              const isEditable = windowStatus.isEditable && !reachedLimit;
                              const isExpanded = expandedMatchId === match.id;

                              return (
                                <div key={`trending-${match.id}`} className="col-12 col-md-4">
                                  <div 
                                    className={`glass-card p-3 h-100 d-flex flex-column justify-content-between border-secondary ${isExpanded ? 'border-info border-opacity-45' : 'border-opacity-20'} bg-dark bg-opacity-30 hover-scale`} 
                                    style={{ minHeight: isExpanded ? '380px' : '260px', transition: 'all 0.3s ease', cursor: 'pointer' }}
                                    onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                                  >
                                    
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
                                    <div className="d-flex align-items-center justify-content-between my-2" onClick={(e) => e.stopPropagation()}>
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
                                    <div onClick={(e) => e.stopPropagation()}>
                                      {windowStatus.isEditable && (
                                        <div className="mt-1">
                                          {reachedLimit ? (
                                            <div className="text-danger text-center fw-bold" style={{ fontSize: '0.7rem' }}>
                                              🚫 Limite de edições atingido
                                            </div>
                                          ) : userPred ? (
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
                                                {savingPredictionId === match.id ? '...' : `Atualizar (${maxEdits - editCount} rest.)`}
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

                                    {/* Detalhes Expandidos (Inline) */}
                                    {isExpanded && (
                                      <div 
                                        className="mt-3 pt-3 border-top border-secondary border-opacity-20 animate__animated animate__fadeIn"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button 
                                          className="btn btn-xs btn-neon-outline w-100 py-2 mb-3 d-flex align-items-center justify-content-center gap-2"
                                          style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                                          onClick={() => handleViewLineup(match.id)}
                                        >
                                          📋 Ver Escalação
                                        </button>

                                        <div className="bg-dark bg-opacity-40 p-2 rounded text-center" style={{ fontSize: '0.75rem' }}>
                                          {userPred ? (
                                            <div>
                                              <div className="text-secondary mb-1">Seu palpite salvo:</div>
                                              <div className="text-white fw-bold fs-6 mb-2">
                                                {userPred.homeGuess} x {userPred.awayGuess}
                                              </div>
                                              <div className="text-info" style={{ fontSize: '0.7rem' }}>
                                                <i className="bi bi-info-circle"></i> Alterações: <span className="text-white fw-bold">{editCount}</span> de <span className="text-white fw-bold">{maxEdits}</span>.
                                              </div>
                                              {isEditable && (
                                                <div className="text-success mt-1" style={{ fontSize: '0.65rem' }}>
                                                  Você pode refazer este palpite <span className="fw-bold">{maxEdits - editCount}</span> {maxEdits - editCount === 1 ? 'vez' : 'vezes'}.
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div>
                                              <div className="text-secondary mb-1">Sem palpite registrado.</div>
                                              <div className="text-info" style={{ fontSize: '0.7rem' }}>
                                                <i className="bi bi-info-circle"></i> Limite de edições: <span className="text-white fw-bold">{maxEdits}</span> vezes.
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Card Próximo Jogo Regressivo (Interativo) */}
                      {nextMatch ? (
                        (() => {
                          const windowStatus = getPredictionWindowStatus(nextMatch, predictionWindow);
                          const userPred = predictions.find(p => p.matchId === nextMatch.id && p.leagueId === selectedLeagueId);
                          const localGuess = localGuesses[nextMatch.id] || { home: '', away: '' };
                          const isPredictionSaved = userPred && localGuess.home === userPred.homeGuess.toString() && localGuess.away === userPred.awayGuess.toString();

                          const activeLeague = leagues.find(l => l.id === selectedLeagueId);
                          const maxEdits = activeLeague ? activeLeague.maxEdits : 3;
                          const editCount = userPred ? (userPred.editCount ?? 0) : 0;
                          const reachedLimit = userPred && (userPred.editCount ?? 0) >= maxEdits;
                          const isEditable = windowStatus.isEditable && !reachedLimit;

                          return (
                            <div className="glass-card p-4 mb-4 text-center border-info border-opacity-25" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)' }}>
                              <span className="text-secondary fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>🎯 PALPITE NO PRÓXIMO JOGO</span>
                              
                              <div className="d-flex align-items-center justify-content-around my-3 flex-wrap gap-2">
                                {/* Time Casa */}
                                <div className="d-flex flex-column align-items-center" style={{ width: '30%', minWidth: '80px' }}>
                                  <TeamFlag logo={nextMatch.homeTeamLogo} flag={nextMatch.homeFlag} teamName={nextMatch.homeTeam} />
                                  <span className="fw-bold text-white mt-2" style={{ fontSize: '0.95rem' }}>{nextMatch.homeTeam}</span>
                                </div>

                                {/* Inputs Centrais */}
                                <div className="d-flex flex-column align-items-center" style={{ width: '36%', minWidth: '120px' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      className="score-input fs-4 text-center fw-bold"
                                      style={{ width: '48px', height: '48px', borderRadius: '10px', ...(isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : {}) }}
                                      value={localGuess.home}
                                      onChange={(e) => handleLocalGuessChange(nextMatch.id, 'home', e.target.value)}
                                      disabled={!isEditable}
                                      placeholder="-"
                                    />
                                    <span className="text-secondary fs-4 fw-bold">x</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      className="score-input fs-4 text-center fw-bold"
                                      style={{ width: '48px', height: '48px', borderRadius: '10px', ...(isPredictionSaved ? { borderColor: 'rgba(0, 255, 135, 0.45)' } : {}) }}
                                      value={localGuess.away}
                                      onChange={(e) => handleLocalGuessChange(nextMatch.id, 'away', e.target.value)}
                                      disabled={!isEditable}
                                      placeholder="-"
                                    />
                                  </div>
                                  
                                  {/* Badges de Edição / Status */}
                                  {userPred && (
                                    <div className="mt-2">
                                      {reachedLimit ? (
                                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20" style={{ fontSize: '0.65rem' }}>
                                          🚫 Limite de Edições Atingido ({editCount}/{maxEdits})
                                        </span>
                                      ) : (
                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20" style={{ fontSize: '0.65rem' }}>
                                          ✓ Palpite Salvo ({editCount}/{maxEdits} edições)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Time Visitante */}
                                <div className="d-flex flex-column align-items-center" style={{ width: '30%', minWidth: '80px' }}>
                                  <TeamFlag logo={nextMatch.awayTeamLogo} flag={nextMatch.awayFlag} teamName={nextMatch.awayTeam} />
                                  <span className="fw-bold text-white mt-2" style={{ fontSize: '0.95rem' }}>{nextMatch.awayTeam}</span>
                                </div>
                              </div>

                              {/* Cronômetro */}
                              {countdownText && (
                                <div className="mb-3">
                                  <span className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500' }}>TEMPO RESTANTE PARA PALPITAR:</span>
                                  <div className="fs-4 fw-bold text-warning font-monospace mt-1">{countdownText}</div>
                                </div>
                              )}

                              {/* Explicação de Limite de Edição */}
                              <div className="text-secondary mb-3 px-2 py-1 rounded bg-dark bg-opacity-25" style={{ fontSize: '0.75rem', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                <i className="bi bi-info-circle me-1 text-info"></i>
                                Cada alteração confirmada conta como 1 edição. Limite por jogo: <strong>{maxEdits} vezes</strong>.
                              </div>

                              {/* Ações do Card Principal */}
                              <div className="d-flex justify-content-center gap-2 flex-wrap mb-2">
                                <button 
                                  className="btn btn-outline-info rounded-pill px-3" 
                                  style={{ fontSize: '0.8rem', fontWeight: '500' }}
                                  onClick={() => handleViewLineup(nextMatch.id)}
                                >
                                  📋 Ver Escalações
                                </button>

                                {isEditable && (
                                  userPred ? (
                                    !isPredictionSaved && (
                                      <button
                                        className="btn btn-warning rounded-pill px-4 fw-bold text-dark"
                                        style={{ fontSize: '0.8rem', boxShadow: '0 0 10px rgba(255, 193, 7, 0.2)' }}
                                        onClick={() => saveUserPrediction(nextMatch.id)}
                                        disabled={savingPredictionId === nextMatch.id || localGuess.home === '' || localGuess.away === ''}
                                      >
                                        {savingPredictionId === nextMatch.id ? 'Salvando...' : `Salvar Alteração (${maxEdits - editCount} rest.)`}
                                      </button>
                                    )
                                  ) : (
                                    <button
                                      className="btn btn-neon-green rounded-pill px-4 fw-bold"
                                      style={{ fontSize: '0.8rem' }}
                                      onClick={() => saveUserPrediction(nextMatch.id)}
                                      disabled={savingPredictionId === nextMatch.id || localGuess.home === '' || localGuess.away === ''}
                                    >
                                      {savingPredictionId === nextMatch.id ? 'Salvando...' : 'Confirmar Palpite'}
                                    </button>
                                  )
                                )}
                              </div>

                              <div className="pt-2 border-top border-secondary border-opacity-20 text-secondary" style={{ fontSize: '0.8rem' }}>
                                <i className="bi bi-clock-fill text-warning me-1"></i>
                                Início: {new Date(nextMatch.kickOff).toLocaleDateString('pt-BR', {
                                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                })}h (Horário de Brasília)
                              </div>
                            </div>
                          );
                        })()
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
                      
                      {/* Destaque do Líder */}
                      {users.length > 0 && (
                        <div className="glass-card p-3 mb-4 text-start border-warning border-opacity-35" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(217, 119, 6, 0.04) 100%)' }}>
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="fs-5">👑</span>
                            <h6 className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>Líder do Bolão</h6>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <div className="fs-1">{users[0].image || '👑'}</div>
                            <div className="flex-grow-1 min-w-0">
                              <div className="text-white fw-bold text-truncate fs-6">{users[0].name}</div>
                              <div className="text-warning-yellow fw-semibold" style={{ fontSize: '0.8rem' }}>
                                {users[0].points} pontos acumulados
                              </div>
                              <div className="text-secondary mt-1 text-truncate" style={{ fontSize: '0.72rem' }}>
                                Líder no bolão <span className="text-info fw-semibold">"{selectedLeagueId === 'global' ? 'Bolão Global (Site)' : (leagues.find(l => l.id === selectedLeagueId)?.name || 'Bolão')}"</span>
                              </div>
                              {users[0].streak > 0 && (
                                <div className="text-success mt-1" style={{ fontSize: '0.7rem' }}>
                                  <i className="bi bi-fire text-danger"></i> Sequência de {users[0].streak} acertos! 🔥
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progresso e Lista de Bolões Retrátil (Sanfona) */}
                      <div className="glass-card p-3 mb-4 text-start">
                        <h6 className="text-white fw-bold mb-3 d-flex align-items-center justify-content-between">
                          <span>📊 Meus Bolões & Progresso</span>
                          <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>{leagues.filter(l => l.id !== 'global').length + 1} bolões</span>
                        </h6>

                        {/* Bolão Global (Sempre visível como item 1) */}
                        <div 
                          className={`mb-2 border rounded p-2 bg-dark bg-opacity-20 hover-scale ${isUserGlobalLeader ? 'border-warning' : 'border-secondary border-opacity-25'}`}
                          style={isUserGlobalLeader ? { boxShadow: '0 0 10px rgba(251, 191, 36, 0.22)', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(30, 41, 59, 0.2) 100%)' } : {}}
                        >
                          <div 
                            className="d-flex justify-content-between align-items-center cursor-pointer" 
                            onClick={() => setExpandedLeagueProgressId(expandedLeagueProgressId === 'global' ? null : 'global')}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="text-white fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                              {isUserGlobalLeader ? '👑' : '🌎'} Bolão Global (Site) {expandedLeagueProgressId === 'global' ? '▼' : '▶'}
                            </span>
                            <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '0.7rem' }}>{currentUser?.points || 0} pts</span>
                          </div>

                          {expandedLeagueProgressId === 'global' && (
                            <div className="mt-2 pt-2 border-top border-secondary border-opacity-10 animate__animated animate__fadeIn" style={{ fontSize: '0.75rem' }}>
                              <div className="row g-2 text-center text-secondary mb-2">
                                <div className="col-4">
                                  <div className="fw-bold text-white fs-6">{matches.length}</div>
                                  <div>Partidas</div>
                                </div>
                                <div className="col-4">
                                  <div className="fw-bold text-white fs-6">{finishedMatches.length}</div>
                                  <div>Finalizadas</div>
                                </div>
                                <div className="col-4">
                                  <div className="fw-bold text-white fs-6">{users.length}</div>
                                  <div>Jogadores</div>
                                </div>
                              </div>
                              <div className="pt-2 border-top border-secondary border-opacity-10 d-flex justify-content-between text-secondary">
                                <span>Sua Posição Geral:</span>
                                <span className="text-warning-yellow fw-bold">
                                  #{users.findIndex(u => u.id === selectedUserId) + 1}º lugar
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bolões Privados do Usuário */}
                        {leagues.filter(l => l.id !== 'global').map(l => (
                          <div 
                            key={l.id} 
                            className={`mb-2 border rounded p-2 bg-dark bg-opacity-20 hover-scale ${l.isUserLeader ? 'border-warning' : 'border-secondary border-opacity-25'}`}
                            style={l.isUserLeader ? { boxShadow: '0 0 10px rgba(251, 191, 36, 0.22)', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(30, 41, 59, 0.2) 100%)' } : {}}
                          >
                            <div 
                              className="d-flex justify-content-between align-items-center cursor-pointer" 
                              onClick={() => setExpandedLeagueProgressId(expandedLeagueProgressId === l.id ? null : l.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <span className="text-white fw-bold text-truncate d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', maxWidth: '75%' }}>
                                {l.isUserLeader ? '👑' : '👥'} {l.name} {expandedLeagueProgressId === l.id ? '▼' : '▶'}
                              </span>
                              <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '0.7rem' }}>{l.userPoints || 0} pts</span>
                            </div>

                            {expandedLeagueProgressId === l.id && (
                              <div className="mt-2 pt-2 border-top border-secondary border-opacity-10 animate__animated animate__fadeIn" style={{ fontSize: '0.75rem' }}>
                                <div className="row g-2 text-center text-secondary mb-2">
                                  <div className="col-4">
                                    <div className="fw-bold text-white fs-6">{matches.length}</div>
                                    <div>Partidas</div>
                                  </div>
                                  <div className="col-4">
                                    <div className="fw-bold text-white fs-6">{finishedMatches.length}</div>
                                    <div>Finalizadas</div>
                                  </div>
                                  <div className="col-4">
                                    <div className="fw-bold text-white fs-6">{l.memberCount}</div>
                                    <div>Membros</div>
                                  </div>
                                </div>

                                <div className="pt-2 border-top border-secondary border-opacity-10 d-flex justify-content-between text-secondary mb-1">
                                  <span>Janela de Palpite:</span>
                                  <span className="text-white fw-semibold">{l.windowHours}h antes</span>
                                </div>
                                <div className="d-flex justify-content-between text-secondary mb-2">
                                  <span>Limite de Edições:</span>
                                  <span className="text-white fw-semibold">Máx {l.maxEdits} vezes</span>
                                </div>

                                <div className="pt-2 border-top border-secondary border-opacity-10 d-flex justify-content-end gap-1">
                                  <button 
                                    className="btn btn-neon-green btn-xs py-1 px-2"
                                    style={{ fontSize: '0.65rem', borderRadius: '4px' }}
                                    onClick={() => {
                                      setSelectedLeagueId(l.id);
                                      setActiveTab('leagues');
                                      setActiveLeagueTab('ranking');
                                    }}
                                  >
                                    Ver Bolão
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
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

                      {/* Painel do Administrador (Aprovação de Senhas) */}
                      {resetRequests.length > 0 && (
                        <div className="glass-card p-3 mb-4 text-start border-warning border-opacity-35" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)' }}>
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="fs-5 text-warning">🛡️</span>
                            <h6 className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
                              Solicitações de Senha
                            </h6>
                            <span className="badge bg-danger ms-auto">{resetRequests.length}</span>
                          </div>
                          
                          <div className="d-flex flex-column gap-2">
                            {resetRequests.map((req) => (
                              <div key={req.id} className="p-2 rounded bg-dark bg-opacity-35 border border-secondary border-opacity-20">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>{req.user?.name || 'Usuário'}</span>
                                  <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
                                    {new Date(req.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="text-secondary mb-2" style={{ fontSize: '0.7rem' }}>
                                  E-mail: <span className="text-light">{req.user?.email}</span>
                                </div>
                                <div className="d-flex gap-2">
                                  <button 
                                    className="btn btn-success btn-sm py-1 flex-grow-1" 
                                    style={{ fontSize: '0.75rem' }} 
                                    onClick={() => handleResetRequestAction(req.id, 'approve')}
                                  >
                                    Aprovar Nova Senha
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger btn-sm py-1" 
                                    style={{ fontSize: '0.75rem' }} 
                                    onClick={() => handleResetRequestAction(req.id, 'reject')}
                                  >
                                    Recusar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Painel Sandbox de Escalações (Fase 5) */}
                      <div className="glass-card p-3 mb-4 text-start border-info border-opacity-35" style={{ background: 'linear-gradient(135deg, rgba(96, 239, 255, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <span className="fs-5 text-info">⚙️</span>
                          <h6 className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
                            Sandbox: Escalação Oficial
                          </h6>
                        </div>

                        <form onSubmit={handleSaveSandboxLineup}>
                          <div className="mb-2">
                            <label className="form-label text-secondary mb-1" style={{ fontSize: '0.7rem' }}>PARTIDA</label>
                            <select 
                              className="form-select form-select-sm bg-dark text-white border-secondary"
                              style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                              value={sandboxLineupMatchId}
                              onChange={(e) => {
                                const matchId = e.target.value;
                                setSandboxLineupMatchId(matchId);
                                const selectedMatch = matches.find(m => m.id === matchId);
                                if (selectedMatch) {
                                  const homeSq = getSquadForTeam(selectedMatch.homeTeam);
                                  const awaySq = getSquadForTeam(selectedMatch.awayTeam);
                                  setSandboxLineupHomeFormation(homeSq.formation);
                                  setSandboxLineupAwayFormation(awaySq.formation);
                                  setSandboxLineupHomeStarting(JSON.stringify(homeSq.starting));
                                  setSandboxLineupAwayStarting(JSON.stringify(awaySq.starting));
                                  setSandboxLineupHomeSubs(JSON.stringify(homeSq.substitutes));
                                  setSandboxLineupAwaySubs(JSON.stringify(awaySq.substitutes));
                                }
                              }}
                            >
                              <option value="">Selecione um jogo...</option>
                              {matches.map(m => (
                                <option key={m.id} value={m.id} className="bg-dark text-white">
                                  {m.homeTeam} x {m.awayTeam} ({new Date(m.kickOff).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                                </option>
                              ))}
                            </select>
                          </div>

                          {sandboxLineupMatchId && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="row g-2 mb-3">
                                <div className="col-6">
                                  <label className="form-label text-secondary mb-1" style={{ fontSize: '0.7rem' }}>FORMAÇÃO CASA</label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm bg-dark text-white border-secondary" 
                                    value={sandboxLineupHomeFormation} 
                                    onChange={(e) => setSandboxLineupHomeFormation(e.target.value)} 
                                    style={{ fontSize: '0.75rem' }} 
                                  />
                                </div>
                                <div className="col-6">
                                  <label className="form-label text-secondary mb-1" style={{ fontSize: '0.7rem' }}>FORMAÇÃO VISITANTE</label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm bg-dark text-white border-secondary" 
                                    value={sandboxLineupAwayFormation} 
                                    onChange={(e) => setSandboxLineupAwayFormation(e.target.value)} 
                                    style={{ fontSize: '0.75rem' }} 
                                  />
                                </div>
                              </div>

                              <div className="p-2.5 rounded bg-info bg-opacity-5 border border-info border-opacity-15 mb-3 text-secondary" style={{ fontSize: '0.72rem' }}>
                                <i className="bi bi-info-circle text-info me-1"></i>
                                Ao confirmar, a escalação provável de elenco real será copiada e gravada no banco como <strong>Escalação Oficial</strong> definitiva.
                              </div>

                              <button type="submit" className="btn btn-info btn-sm w-100 py-2 fw-bold text-dark" style={{ borderRadius: '6px' }}>
                                Confirmar Escalação Oficial
                              </button>
                            </div>
                          )}
                        </form>
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

                  {/* Seletor de Bolão Ativo */}
                  <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                    <div className="d-flex align-items-center bg-dark bg-opacity-40 border border-secondary border-opacity-30 rounded-pill p-1 shadow-sm">
                      <span className="text-secondary ps-3 pe-2" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                        <i className="bi bi-trophy-fill text-warning me-1"></i> Bolão Ativo:
                      </span>
                      <select 
                        className="premium-select bg-transparent text-white border-0 py-1 pe-4"
                        style={{ fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                        value={selectedLeagueId}
                        onChange={(e) => setSelectedLeagueId(e.target.value)}
                      >
                        <option value="global" className="bg-dark text-white">🌎 Bolão Global (Site)</option>
                        {leagues.filter(l => l.id !== 'global').map(l => (
                          <option key={l.id} value={l.id} className="bg-dark text-white">
                            👥 {l.name} {l.userRole === 'owner' ? '👑' : l.userRole === 'subadmin' ? '🛡️' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedLeagueId !== 'global' && (
                      <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-20 py-2 px-3 rounded-pill" style={{ fontSize: '0.75rem' }}>
                        Janela: {leagues.find(l => l.id === selectedLeagueId)?.windowHours}h antes | Máximo de {leagues.find(l => l.id === selectedLeagueId)?.maxEdits} edições
                      </span>
                    )}
                  </div>

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
                  
                  {/* Grid Responsivo de Jogos Agrupados por Dia */}
                  {(() => {
                    const filtered = filterMatches(matches.filter(m => m.status !== 'finished'));
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-5 text-secondary">
                          <i className="bi bi-check-circle fs-1 text-success"></i>
                          <p className="mt-2">Sem partidas pendentes de palpites neste filtro.</p>
                        </div>
                      );
                    }
                    const grouped = groupMatchesByDay(filtered);
                    return Object.keys(grouped).map(day => (
                      <div key={day} className="mb-4">
                        <div className="day-group-header mb-3 text-start">
                          <i className="bi bi-calendar-check text-info me-2"></i>
                          <span>{day}</span>
                        </div>
                        <div className="row g-3">
                          {grouped[day].map(match => {
                            const windowStatus = getPredictionWindowStatus(match, predictionWindow);
                            const stats = matchStats[match.id];
                            const hasStats = stats && (stats.home > 0 || stats.draw > 0 || stats.away > 0);
                            const localGuess = localGuesses[match.id] || { home: '', away: '' };
                            const userPred = predictions.find(p => p.matchId === match.id);
                            const hasPrediction = !!userPred;
                            const isPredictionSaved = userPred && localGuess.home === userPred.homeGuess.toString() && localGuess.away === userPred.awayGuess.toString();

                            const activeLeague = leagues.find(l => l.id === selectedLeagueId);
                            const maxEdits = activeLeague ? activeLeague.maxEdits : 3;
                            const editCount = userPred ? (userPred.editCount ?? 0) : 0;
                            const reachedLimit = userPred && (userPred.editCount ?? 0) >= maxEdits;
                            const isEditable = windowStatus.isEditable && !reachedLimit;

                            return (
                              <div key={match.id} className="col-12 col-lg-6">
                                <div className={`glass-card p-3 h-100 d-flex flex-column justify-content-between text-start ${hasPrediction ? 'border-success-subtle' : ''}`}>
                                  
                                  {/* Status e Data */}
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                      {new Date(match.kickOff).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit', minute: '2-digit'
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
                                        reachedLimit ? (
                                          <span className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-20 me-1" style={{ fontSize: '0.65rem' }}>
                                            🚫 Sem Edições ({editCount}/{maxEdits})
                                          </span>
                                        ) : (
                                          <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 me-1" style={{ fontSize: '0.65rem' }}>
                                            ✓ Palpite Salvo ({editCount}/{maxEdits})
                                          </span>
                                        )
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

                                  {/* Botão de Visualizar Escalação */}
                                  <div className="d-flex justify-content-center mt-2">
                                    <button
                                      type="button"
                                      className="btn btn-outline-info btn-sm rounded-pill w-100 py-1"
                                      style={{ fontSize: '0.75rem', fontWeight: '500', letterSpacing: '0.3px', background: 'rgba(96, 239, 255, 0.03)', borderColor: 'rgba(96, 239, 255, 0.25)' }}
                                      onClick={() => handleViewLineup(match.id)}
                                    >
                                      📋 Escalações & Campo Tático
                                    </button>
                                  </div>

                                  {/* Botão de Enviar */}
                                  {windowStatus.isEditable && (
                                    <div className="mt-3">
                                      {reachedLimit ? (
                                        <button
                                          className="btn btn-outline-danger w-100 py-1"
                                          style={{
                                            borderColor: 'rgba(239, 68, 68, 0.4)',
                                            color: 'rgba(239, 68, 68, 0.8)',
                                            fontWeight: '600',
                                            borderRadius: '10px'
                                          }}
                                          disabled
                                        >
                                          Edições Excedidas ({editCount}/{maxEdits})
                                        </button>
                                      ) : userPred ? (
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
                                            {savingPredictionId === match.id ? 'Salvando...' : `Atualizar Palpite (${maxEdits - editCount} rest.)`}
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
                      </div>
                    ));
                  })()}

                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: RESULTADOS (Visualizar resultados dos jogos)        */}
              {/* ======================================================== */}
              {activeTab === 'results' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  
                  <h4 className="text-white fw-bold mb-3 text-start">🏆 Resultados da Copa</h4>

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

                  {/* Grid de resultados */}
                  {(() => {
                    const filtered = filterMatches(matches.filter(m => m.status === 'finished'));
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-5 text-secondary">
                          <i className="bi bi-info-circle fs-1 text-info"></i>
                          <p className="mt-2">Sem partidas finalizadas neste filtro.</p>
                        </div>
                      );
                    }
                    const grouped = groupMatchesByDay(filtered);
                    return Object.keys(grouped).map(day => (
                      <div key={day} className="mb-4">
                        <div className="day-group-header mb-3 text-start">
                          <i className="bi bi-calendar-check text-info me-2"></i>
                          <span>{day}</span>
                        </div>
                        <div className="row g-3">
                          {grouped[day].map(match => {
                            const userPred = predictions.find(p => p.matchId === match.id);
                            const stats = matchStats[match.id];
                            const hasStats = stats && (stats.home > 0 || stats.draw > 0 || stats.away > 0);
                            
                            let ptsObtidos = 0;
                            let scoreBadge = null;

                            if (userPred) {
                              ptsObtidos = calculatePredictionPoints(
                                userPred.homeGuess,
                                userPred.awayGuess,
                                match.homeScore || 0,
                                match.awayScore || 0
                              );

                              if (ptsObtidos === 5) {
                                scoreBadge = { text: 'Placar Exato (+5)', class: 'bg-success' };
                              } else if (ptsObtidos === 3) {
                                scoreBadge = { text: 'Vencedor & Saldo (+3)', class: 'bg-success bg-opacity-75' };
                              } else if (ptsObtidos === 2) {
                                scoreBadge = { text: 'Vencedor Simples (+2)', class: 'bg-info text-dark' };
                              } else {
                                scoreBadge = { text: 'Errou Placar (0)', class: 'bg-danger' };
                              }
                            } else {
                              scoreBadge = { text: 'Sem palpite (0)', class: 'bg-secondary' };
                            }

                            return (
                              <div key={match.id} className="col-12 col-lg-6">
                                <div className="glass-card p-3 h-100 text-start d-flex flex-column justify-content-between">
                                  
                                  {/* Topo do card: Data, fase e Badge do palpite */}
                                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-20">
                                    <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                      {new Date(match.kickOff).toLocaleDateString('pt-BR', {
                                        hour: '2-digit', minute: '2-digit'
                                      })}h
                                      {match.group && (
                                        <span className="ms-1 badge bg-dark border border-secondary" style={{ fontSize: '0.55rem' }}>
                                          Grupo {match.group}
                                        </span>
                                      )}
                                      {!match.group && match.stage && (
                                        <span className="ms-1 badge bg-info bg-opacity-10 text-info border border-info border-opacity-20" style={{ fontSize: '0.55rem' }}>
                                          {match.stage.toUpperCase()}
                                        </span>
                                      )}
                                    </span>
                                    <span className={`badge ${scoreBadge.class}`} style={{ fontSize: '0.65rem' }}>
                                      {scoreBadge.text}
                                    </span>
                                  </div>

                                  {/* Placar Real em destaque */}
                                  <div className="d-flex align-items-center justify-content-between my-2">
                                    {/* Casa */}
                                    <div className="d-flex align-items-center gap-2" style={{ width: '40%' }}>
                                      <TeamFlag logo={match.homeTeamLogo} flag={match.homeFlag} teamName={match.homeTeam} />
                                      <span className="text-white fw-bold text-truncate" style={{ fontSize: '0.85rem' }}>
                                        {match.homeTeam}
                                      </span>
                                    </div>

                                    {/* Placar Central */}
                                    <div className="d-flex align-items-center justify-content-center gap-2" style={{ width: '20%' }}>
                                      <span className="fs-5 fw-extrabold text-white">{match.homeScore ?? 0}</span>
                                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>x</span>
                                      <span className="fs-5 fw-extrabold text-white">{match.awayScore ?? 0}</span>
                                    </div>

                                    {/* Visitante */}
                                    <div className="d-flex align-items-center justify-content-end gap-2 text-end" style={{ width: '40%' }}>
                                      <span className="text-white fw-bold text-truncate" style={{ fontSize: '0.85rem' }}>
                                        {match.awayTeam}
                                      </span>
                                      <TeamFlag logo={match.awayTeamLogo} flag={match.awayFlag} teamName={match.awayTeam} />
                                    </div>
                                  </div>

                                  {/* Informações de Palpite do Usuário */}
                                  <div className="mt-2 p-2 rounded bg-dark bg-opacity-30 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center" style={{ fontSize: '0.8rem' }}>
                                    <span className="text-secondary">Seu palpite:</span>
                                    {userPred ? (
                                      <span className="text-white fw-bold">
                                        {userPred.homeGuess} x {userPred.awayGuess}
                                      </span>
                                    ) : (
                                      <span className="text-muted italic" style={{ fontSize: '0.75rem' }}>Nenhum palpite registrado</span>
                                    )}
                                  </div>

                                  {/* Secômetro Final */}
                                  <div className="mt-3 pt-2 border-top border-secondary border-opacity-20">
                                    {hasStats ? (
                                      <>
                                        <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: '0.65rem' }}>
                                          <span>Secômetro final (Média geral):</span>
                                          <span>{stats.home}% | {stats.draw}% | {stats.away}%</span>
                                        </div>
                                        <div className="thermostat-bar d-flex">
                                          <div className="thermostat-segment-home" style={{ width: `${stats.home}%` }} title={`Casa: ${stats.home}%`}></div>
                                          <div className="thermostat-segment-draw" style={{ width: `${stats.draw}%` }} title={`Empate: ${stats.draw}%`}></div>
                                          <div className="thermostat-segment-away" style={{ width: `${stats.away}%` }} title={`Fora: ${stats.away}%`}></div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-secondary text-center" style={{ fontSize: '0.65rem' }}>
                                        <i className="bi bi-bar-chart-line me-1"></i>
                                        Nenhum outro palpite registrado para este jogo
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}

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

                  {/* Seletor de Bolão Ativo no Ranking */}
                  <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                    <div className="d-flex align-items-center bg-dark bg-opacity-40 border border-secondary border-opacity-30 rounded-pill p-1 shadow-sm">
                      <span className="text-secondary ps-3 pe-2" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                        <i className="bi bi-trophy-fill text-warning me-1"></i> Bolão Ativo:
                      </span>
                      <select 
                        className="premium-select bg-transparent text-white border-0 py-1 pe-4"
                        style={{ fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                        value={selectedLeagueId}
                        onChange={(e) => setSelectedLeagueId(e.target.value)}
                      >
                        <option value="global" className="bg-dark text-white">🌎 Bolão Global (Site)</option>
                        {leagues.filter(l => l.id !== 'global').map(l => (
                          <option key={l.id} value={l.id} className="bg-dark text-white">
                            👥 {l.name} {l.userRole === 'owner' ? '👑' : l.userRole === 'subadmin' ? '🛡️' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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

                  {/* Seletor de Bolão Ativo no Histórico */}
                  <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                    <div className="d-flex align-items-center bg-dark bg-opacity-40 border border-secondary border-opacity-30 rounded-pill p-1 shadow-sm">
                      <span className="text-secondary ps-3 pe-2" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                        <i className="bi bi-trophy-fill text-warning me-1"></i> Bolão Ativo:
                      </span>
                      <select 
                        className="premium-select bg-transparent text-white border-0 py-1 pe-4"
                        style={{ fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                        value={selectedLeagueId}
                        onChange={(e) => setSelectedLeagueId(e.target.value)}
                      >
                        <option value="global" className="bg-dark text-white">🌎 Bolão Global (Site)</option>
                        {leagues.filter(l => l.id !== 'global').map(l => (
                          <option key={l.id} value={l.id} className="bg-dark text-white">
                            👥 {l.name} {l.userRole === 'owner' ? '👑' : l.userRole === 'subadmin' ? '🛡️' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                      
                      {/* Seção 1: Próximos Jogos com Palpite */}
                      <div>
                        <h5 className="text-info fw-bold mb-3 text-start">
                          <i className="bi bi-calendar-event me-2"></i> Próximos Jogos com Palpite
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
                                            ✓ Palpite Salvo
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

              {/* ======================================================== */}
              {/* ABA: BOLÕES CUSTOMIZADOS (Leagues)                       */}
              {/* ======================================================== */}
              {activeTab === 'leagues' && (
                <div className="fade-in animate__animated animate__fadeIn">
                  {!loggedInUser ? (
                    <div className="text-center py-5 text-secondary glass-card p-5">
                      <i className="bi bi-people-fill fs-1 text-info mb-3 d-block"></i>
                      <h5>Participe ou Crie Bolões Privados!</h5>
                      <p className="mb-4 text-secondary" style={{ fontSize: '0.85rem' }}>
                        Para competir em bolões customizados com amigos, definir suas próprias regras e acompanhar rankings exclusivos, faça login na sua conta.
                      </p>
                      <button 
                        className="btn btn-neon-green px-4 py-2" 
                        onClick={() => { setAuthMode('login'); setActiveTab('auth'); }}
                      >
                        <i className="bi bi-person-lock me-1"></i> Entrar / Cadastrar
                      </button>
                    </div>
                  ) : (
                    <div>
                      {selectedLeagueId === 'global' ? (
                        <div className="row g-4">
                          
                          {/* Coluna da Esquerda: Seus Bolões */}
                          <div className="col-12 col-lg-7 text-start">
                            <h4 className="text-white fw-bold mb-3">👥 Seus Bolões Customizados</h4>
                            
                            {leagues.filter(l => l.id !== 'global').length === 0 ? (
                              <div className="glass-card p-5 text-center text-secondary mb-4">
                                <i className="bi bi-people-fill fs-1 text-secondary mb-3 d-block"></i>
                                <h5>Você não está em nenhum bolão customizado!</h5>
                                <p className="mb-0" style={{ fontSize: '0.85rem' }}>
                                  Use os formulários ao lado para criar o seu próprio bolão ou participar de um existente usando o código de convite de seus amigos.
                                </p>
                              </div>
                            ) : (
                              <div className="d-flex flex-column gap-3 mb-4">
                                {leagues.filter(l => l.id !== 'global').map((league) => (
                                  <div 
                                    key={league.id} 
                                    className="glass-card p-3 d-flex flex-column justify-content-between hover-scale border-secondary border-opacity-30"
                                  >
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                        <h5 className="text-white fw-bold m-0">{league.name}</h5>
                                        {league.description && (
                                          <p className="text-secondary m-0 mt-1" style={{ fontSize: '0.8rem' }}>{league.description}</p>
                                        )}
                                      </div>
                                      <span className="badge bg-dark border border-secondary text-secondary" style={{ fontSize: '0.65rem' }}>
                                        {league.userRole === 'owner' ? '👑 Criador' : league.userRole === 'subadmin' ? '🛡️ Subadmin' : '👤 Membro'}
                                      </span>
                                    </div>
                                    
                                    <div className="row g-2 py-2 my-1 border-top border-bottom border-secondary border-opacity-20 text-center" style={{ fontSize: '0.8rem' }}>
                                      <div className="col-4">
                                        <span className="text-secondary d-block" style={{ fontSize: '0.65rem' }}>SEUS PONTOS</span>
                                        <strong className="text-info">{league.userPoints} pts</strong>
                                      </div>
                                      <div className="col-4 border-start border-end border-secondary border-opacity-20">
                                        <span className="text-secondary d-block" style={{ fontSize: '0.65rem' }}>MEMBROS</span>
                                        <strong className="text-white">{league.memberCount} jog.</strong>
                                      </div>
                                      <div className="col-4">
                                        <span className="text-secondary d-block" style={{ fontSize: '0.65rem' }}>CÓDIGO</span>
                                        <strong 
                                          className="text-warning-yellow cursor-pointer"
                                          title="Clique para copiar código de convite"
                                          onClick={() => {
                                            navigator.clipboard.writeText(league.inviteCode);
                                            showToast('Código de convite copiado!', 'success');
                                          }}
                                        >
                                          {league.inviteCode} <i className="bi bi-clipboard" style={{ fontSize: '0.7rem' }}></i>
                                        </strong>
                                      </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                      <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                                        Dono: {league.ownerImage} {league.ownerName}
                                      </span>
                                      <button 
                                        className="btn btn-neon-green btn-sm px-3 fw-bold text-dark"
                                        onClick={() => {
                                          setSelectedLeagueId(league.id);
                                          fetchData(false);
                                        }}
                                      >
                                        Acessar Painel <i className="bi bi-chevron-right ms-1"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>

                          {/* Coluna da Direita: Criar e Participar */}
                          <div className="col-12 col-lg-5 text-start">
                            
                            {/* Participar de Bolão */}
                            <div className="glass-card p-4 mb-4">
                              <h5 className="text-white fw-bold mb-3">🔑 Entrar em um Bolão</h5>
                              <form onSubmit={handleJoinLeague}>
                                <div className="mb-3">
                                  <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>CÓDIGO DE CONVITE</label>
                                  <input 
                                    type="text" 
                                    className="form-control bg-dark bg-opacity-40 border-secondary text-white font-monospace text-uppercase" 
                                    style={{ borderRadius: '10px', letterSpacing: '1px' }} 
                                    placeholder="COPA-XXXXX"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    required
                                  />
                                </div>
                                <button type="submit" className="btn btn-neon-outline w-100 py-2 fw-bold" style={{ borderRadius: '10px' }}>
                                  <i className="bi bi-person-plus-fill me-1"></i> Participar do Bolão
                                </button>
                              </form>
                            </div>

                            {/* Criar Novo Bolão */}
                            <div className="glass-card p-4">
                              <h5 className="text-white fw-bold mb-3">➕ Criar Novo Bolão</h5>
                              <form onSubmit={handleCreateLeague}>
                                <div className="mb-3">
                                  <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>NOME DO BOLÃO</label>
                                  <input 
                                    type="text" 
                                    className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                                    style={{ borderRadius: '10px' }} 
                                    placeholder="Ex: Bolão da Família"
                                    value={leagueForm.name}
                                    onChange={(e) => setLeagueForm({ ...leagueForm, name: e.target.value })}
                                    required
                                  />
                                </div>

                                <div className="mb-3">
                                  <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>DESCRIÇÃO (OPCIONAL)</label>
                                  <textarea 
                                    className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                                    style={{ borderRadius: '10px' }} 
                                    placeholder="Explique as regras do grupo..."
                                    rows={2}
                                    value={leagueForm.description}
                                    onChange={(e) => setLeagueForm({ ...leagueForm, description: e.target.value })}
                                  />
                                </div>

                                <div className="row g-2 mb-3">
                                  <div className="col-6">
                                    <label className="form-label text-secondary" style={{ fontSize: '0.75rem', fontWeight: '600' }}>LIBERAÇÃO</label>
                                    <select 
                                      className="form-select bg-dark border-secondary text-white" 
                                      style={{ borderRadius: '10px', fontSize: '0.85rem' }}
                                      value={leagueForm.windowHours}
                                      onChange={(e) => setLeagueForm({ ...leagueForm, windowHours: e.target.value })}
                                    >
                                      <option value="24">24 Horas Antes</option>
                                      <option value="48">48 Horas Antes</option>
                                    </select>
                                  </div>
                                  <div className="col-6">
                                    <label className="form-label text-secondary" style={{ fontSize: '0.75rem', fontWeight: '600' }}>MÁX. EDIÇÕES</label>
                                    <select 
                                      className="form-select bg-dark border-secondary text-white" 
                                      style={{ borderRadius: '10px', fontSize: '0.85rem' }}
                                      value={leagueForm.maxEdits}
                                      onChange={(e) => setLeagueForm({ ...leagueForm, maxEdits: e.target.value })}
                                    >
                                      <option value="1">1 Edição</option>
                                      <option value="3">3 Edições</option>
                                      <option value="5">5 Edições</option>
                                      <option value="999">Ilimitado</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="p-3 mb-3 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-20">
                                  <span className="text-info fw-bold d-block mb-2" style={{ fontSize: '0.8rem' }}>🔧 Regras de Pontuação:</span>
                                  <div className="row g-2">
                                    <div className="col-6">
                                      <label className="form-label text-secondary" style={{ fontSize: '0.7rem' }}>Placar Exato (+)</label>
                                      <input 
                                        type="number" 
                                        className="form-control form-control-sm bg-dark text-white border-secondary"
                                        value={leagueForm.pointsExact}
                                        onChange={(e) => setLeagueForm({ ...leagueForm, pointsExact: e.target.value })}
                                        required 
                                      />
                                    </div>
                                    <div className="col-6">
                                      <label className="form-label text-secondary" style={{ fontSize: '0.7rem' }}>Vencedor e Saldo (+)</label>
                                      <input 
                                        type="number" 
                                        className="form-control form-control-sm bg-dark text-white border-secondary"
                                        value={leagueForm.pointsDiff}
                                        onChange={(e) => setLeagueForm({ ...leagueForm, pointsDiff: e.target.value })}
                                        required 
                                      />
                                    </div>
                                    <div className="col-6">
                                      <label className="form-label text-secondary" style={{ fontSize: '0.7rem' }}>Vencedor Simples (+)</label>
                                      <input 
                                        type="number" 
                                        className="form-control form-control-sm bg-dark text-white border-secondary"
                                        value={leagueForm.pointsWinner}
                                        onChange={(e) => setLeagueForm({ ...leagueForm, pointsWinner: e.target.value })}
                                        required 
                                      />
                                    </div>
                                    <div className="col-6">
                                      <label className="form-label text-secondary" style={{ fontSize: '0.7rem' }}>Empate (+)</label>
                                      <input 
                                        type="number" 
                                        className="form-control form-control-sm bg-dark text-white border-secondary"
                                        value={leagueForm.pointsDraw}
                                        onChange={(e) => setLeagueForm({ ...leagueForm, pointsDraw: e.target.value })}
                                        required 
                                      />
                                    </div>
                                  </div>
                                </div>

                                <button type="submit" className="btn btn-neon-green w-100 py-2 fw-bold text-dark" style={{ borderRadius: '10px' }}>
                                  <i className="bi bi-plus-circle-fill me-1"></i> Criar Bolão Oficial
                                </button>
                              </form>
                            </div>

                          </div>

                        </div>
                      ) : (
                        // ========================================================
                        // VISUALIZAÇÃO INTERNA DE UM BOLÃO SELECIONADO
                        // ========================================================
                        (() => {
                          const currentLeague = leagues.find(l => l.id === selectedLeagueId);
                          if (!currentLeague) return <div className="text-secondary">Carregando bolão...</div>;
                          const isOwner = currentLeague.ownerId === selectedUserId;
                          const isSubadmin = currentLeague.userRole === 'subadmin';
                          const hasAdminRights = isOwner || isSubadmin;

                          return (
                            <div className="text-start">
                              
                              {/* Header do Bolão Selecionado */}
                              <div className="glass-card p-4 mb-4 border-info border-opacity-25 bg-dark bg-opacity-40">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                  <div>
                                    <div className="d-flex align-items-center gap-2">
                                      <button 
                                        className="btn btn-outline-secondary btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '28px', height: '28px' }}
                                        onClick={() => setSelectedLeagueId('global')}
                                      >
                                        <i className="bi bi-chevron-left" style={{ fontSize: '0.85rem' }}></i>
                                      </button>
                                      <h3 className="text-white fw-bold m-0">{currentLeague.name}</h3>
                                    </div>
                                    {currentLeague.description && (
                                      <p className="text-secondary m-0 mt-2 ms-4" style={{ fontSize: '0.85rem' }}>{currentLeague.description}</p>
                                    )}
                                  </div>

                                  <div className="d-flex align-items-center gap-2 flex-wrap ms-4 ms-md-0">
                                    <span 
                                      className="badge bg-dark border border-secondary text-warning-yellow py-2 px-3 rounded-pill cursor-pointer d-flex align-items-center gap-1"
                                      title="Clique para copiar código de convite"
                                      onClick={() => {
                                        navigator.clipboard.writeText(currentLeague.inviteCode);
                                        showToast('Código de convite copiado!', 'success');
                                      }}
                                    >
                                      <i className="bi bi-share-fill"></i> {currentLeague.inviteCode}
                                    </span>
                                    <button 
                                      className="btn btn-neon-green btn-sm rounded-pill px-3"
                                      onClick={() => {
                                        setActiveTab('matches');
                                        fetchData(false);
                                      }}
                                    >
                                      <i className="bi bi-lightning-charge-fill text-dark"></i> Dar Palpites Neste Bolão
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Navegação interna do bolão */}
                              <div className="d-flex gap-2 border-bottom border-secondary border-opacity-25 mb-4">
                                <button 
                                  className={`btn py-2 px-3 border-0 rounded-0 text-white font-weight-bold transition-all ${activeLeagueTab === 'ranking' ? 'border-bottom border-3 border-info text-info' : 'bg-transparent text-secondary'}`}
                                  onClick={() => setActiveLeagueTab('ranking')}
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  🏆 Ranking Interno
                                </button>
                                <button 
                                  className={`btn py-2 px-3 border-0 rounded-0 text-white font-weight-bold transition-all ${activeLeagueTab === 'rules' ? 'border-bottom border-3 border-info text-info' : 'bg-transparent text-secondary'}`}
                                  onClick={() => setActiveLeagueTab('rules')}
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  📜 Regras e Janelas
                                </button>
                                {hasAdminRights && (
                                  <button 
                                    className={`btn py-2 px-3 border-0 rounded-0 text-white font-weight-bold transition-all ${activeLeagueTab === 'admin' ? 'border-bottom border-3 border-info text-info' : 'bg-transparent text-secondary'}`}
                                    onClick={() => setActiveLeagueTab('admin')}
                                    style={{ fontSize: '0.85rem' }}
                                  >
                                    🛡️ Gerenciar Membros
                                  </button>
                                )}
                              </div>

                              {/* SUB-ABA: RANKING INTERNO */}
                              {activeLeagueTab === 'ranking' && (
                                <div className="glass-card p-3">
                                  <h5 className="text-white fw-bold mb-3"><i className="bi bi-list-ol text-info me-2"></i>Classificação Geral do Grupo</h5>
                                  <div className="list-group list-group-flush bg-transparent">
                                    {users.map((user, idx) => {
                                      const isCurrentUser = user.id === selectedUserId;
                                      return (
                                        <div 
                                          key={user.id} 
                                          className={`list-group-item bg-transparent d-flex justify-content-between align-items-center py-2 px-3 border-secondary border-opacity-20 ${
                                            isCurrentUser ? 'bg-info bg-opacity-10 border-info border-opacity-30' : ''
                                          }`}
                                        >
                                          <div className="d-flex align-items-center gap-3">
                                            <span className="text-secondary fw-bold" style={{ width: '25px' }}>#{idx + 1}</span>
                                            <span className="fs-4">{user.image}</span>
                                            <div className="d-flex flex-column">
                                              <span className="fw-bold text-white" style={{ fontSize: '0.9rem' }}>
                                                {user.name} 
                                                {user.id === currentLeague.ownerId && <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.55rem' }}>DONO</span>}
                                                {user.role === 'subadmin' && <span className="badge bg-info text-dark ms-1" style={{ fontSize: '0.55rem' }}>SUBADMIN</span>}
                                                {isCurrentUser && <span className="badge bg-info text-dark ms-1" style={{ fontSize: '0.55rem' }}>VOCÊ</span>}
                                              </span>
                                              <span className="text-secondary" style={{ fontSize: '0.7rem' }}>{user.email}</span>
                                            </div>
                                          </div>
                                          <span className="text-info fw-bold fs-5">{user.points} pts</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* SUB-ABA: REGRAS E JANELAS */}
                              {activeLeagueTab === 'rules' && (
                                <div className="row g-3">
                                  <div className="col-12 col-md-6">
                                    <div className="glass-card p-4 h-100">
                                      <h5 className="text-white fw-bold mb-3">📐 Parâmetros do Bolão</h5>
                                      <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Janela de Liberação:</span>
                                          <strong className="text-white">{currentLeague.windowHours} Horas antes do kickoff</strong>
                                        </div>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Fechamento do Palpite:</span>
                                          <strong className="text-white">30 Minutos antes do kickoff</strong>
                                        </div>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Limite de Edições por Palpite:</span>
                                          <strong className="text-white">{currentLeague.maxEdits === 999 ? 'Sem Limite' : `${currentLeague.maxEdits} Vezes`}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Validade / Encerramento:</span>
                                          <strong className="text-white">{new Date(currentLeague.expiresAt).toLocaleDateString('pt-BR')}</strong>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-12 col-md-6">
                                    <div className="glass-card p-4 h-100">
                                      <h5 className="text-white fw-bold mb-3">🎯 Sistema de Pontos</h5>
                                      <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Placar Exato:</span>
                                          <strong className="text-success">+{currentLeague.pointsExact} Pontos</strong>
                                        </div>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Vencedor e Saldo de Gols:</span>
                                          <strong className="text-info">+{currentLeague.pointsDiff} Pontos</strong>
                                        </div>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Vencedor Simples (Sem saldo):</span>
                                          <strong className="text-info">+{currentLeague.pointsWinner} Pontos</strong>
                                        </div>
                                        <div className="d-flex justify-content-between text-start py-2 border-bottom border-secondary border-opacity-20 text-secondary">
                                          <span>Empate Garantido:</span>
                                          <strong className="text-info">+{currentLeague.pointsDraw} Pontos</strong>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* SUB-ABA: GERENCIAMENTO DE MEMBROS */}
                              {activeLeagueTab === 'admin' && hasAdminRights && (
                                <div className="glass-card p-3">
                                  <h5 className="text-white fw-bold mb-3"><i className="bi bi-shield-lock text-info me-2"></i>Gerenciamento de Membros (Dono / Subadmin)</h5>
                                  <div className="list-group list-group-flush bg-transparent">
                                    {users.map((member) => {
                                      const isSelf = member.id === selectedUserId;
                                      const targetIsOwner = member.id === currentLeague.ownerId;
                                      
                                      // Valida se usuário logado pode alterar o cargo desse membro
                                      const canManage = !isSelf && !targetIsOwner && (isOwner || (isSubadmin && member.role === 'member'));

                                      return (
                                        <div 
                                          key={`admin-mem-${member.id}`} 
                                          className="list-group-item bg-transparent d-flex flex-column flex-sm-row justify-content-between align-items-sm-center py-3 border-secondary border-opacity-20 gap-2"
                                        >
                                          <div className="d-flex align-items-center gap-3">
                                            <span className="fs-4">{member.image}</span>
                                            <div className="d-flex flex-column">
                                              <span className="fw-bold text-white">
                                                {member.name}
                                                {targetIsOwner && <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.55rem' }}>DONO</span>}
                                                {member.role === 'subadmin' && <span className="badge bg-info text-dark ms-1" style={{ fontSize: '0.55rem' }}>SUBADMIN</span>}
                                              </span>
                                              <span className="text-secondary" style={{ fontSize: '0.7rem' }}>{member.email}</span>
                                            </div>
                                          </div>
                                          
                                          {canManage && (
                                            <div className="d-flex gap-2">
                                              {member.role === 'member' ? (
                                                <button 
                                                  className="btn btn-outline-info btn-sm py-0 px-2"
                                                  style={{ fontSize: '0.7rem' }}
                                                  onClick={() => handleLeagueMemberAction(member.id, 'promote')}
                                                >
                                                  🛡️ Promover
                                                </button>
                                              ) : (
                                                member.role === 'subadmin' && isOwner && (
                                                  <button 
                                                    className="btn btn-outline-warning btn-sm py-0 px-2"
                                                    style={{ fontSize: '0.7rem' }}
                                                    onClick={() => handleLeagueMemberAction(member.id, 'demote')}
                                                  >
                                                    👤 Rebaixar
                                                  </button>
                                                )
                                              )}
                                              <button 
                                                className="btn btn-outline-danger btn-sm py-0 px-2"
                                                style={{ fontSize: '0.7rem' }}
                                                onClick={() => handleLeagueMemberAction(member.id, 'remove')}
                                              >
                                                🚫 Banir
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* ABA: AUTENTICAÇÃO (Login / Registro / Esqueci Senha)       */}
              {/* ======================================================== */}
              {activeTab === 'auth' && (
                <div className="fade-in animate__animated animate__fadeIn d-flex justify-content-center align-items-center py-4">
                  <div className="glass-card p-4 text-start border-info border-opacity-35 shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
                    
                    {authMode === 'login' && (
                      <form onSubmit={handleLogin}>
                        <h4 className="text-white fw-bold mb-1">👋 Bem-vindo de volta!</h4>
                        <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>Faça login para dar palpites e criar bolões com amigos.</p>
                        
                        <div className="mb-3">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>E-MAIL</label>
                          <input 
                            type="email" 
                            className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                            style={{ borderRadius: '10px' }} 
                            placeholder="seuemail@exemplo.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>SENHA</label>
                          <input 
                            type="password" 
                            className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                            style={{ borderRadius: '10px' }} 
                            placeholder="Sua senha secreta"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="mb-4 text-end">
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-info text-decoration-none" 
                            style={{ fontSize: '0.75rem' }} 
                            onClick={() => { setAuthMode('forgot'); setAuthPassword(''); }}
                          >
                            Esqueceu a senha?
                          </button>
                        </div>
                        
                        <button type="submit" className="btn btn-neon-green w-100 py-2 fw-bold text-dark" style={{ borderRadius: '10px' }}>
                          <i className="bi bi-box-arrow-in-right me-1"></i> Entrar
                        </button>
                        
                        <div className="mt-4 text-center">
                          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Não tem conta?</span>{' '}
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-info text-decoration-none fw-bold" 
                            style={{ fontSize: '0.8rem' }} 
                            onClick={() => setAuthMode('register')}
                          >
                            Cadastre-se aqui
                          </button>
                        </div>
                      </form>
                    )}

                    {authMode === 'register' && (
                      <form onSubmit={handleRegister}>
                        <h4 className="text-white fw-bold mb-1">📝 Criar Nova Conta</h4>
                        <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>Cadastre-se para competir e acumular pontos.</p>
                        
                        <div className="mb-3">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>NOME COMPLETO</label>
                          <input 
                            type="text" 
                            className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                            style={{ borderRadius: '10px' }} 
                            placeholder="Seu nome"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>E-MAIL</label>
                          <input 
                            type="email" 
                            className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                            style={{ borderRadius: '10px' }} 
                            placeholder="seuemail@exemplo.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>SENHA</label>
                          <input 
                            type="password" 
                            className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                            style={{ borderRadius: '10px' }} 
                            placeholder="Crie uma senha forte"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                          />
                        </div>

                        {/* Seletor de Avatar (Emojis) */}
                        <div className="mb-4">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>ESCOLHA SEU AVATAR (EMOJI)</label>
                          <div className="d-flex flex-wrap gap-2 p-2 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-30 justify-content-center">
                            {['⚽', '🏆', '🥇', '🇧🇷', '🏟️', '🏃', '🤖', '🦁', '🐯', '🦅', '🧤', '🔥'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center transition-all ${authImage === emoji ? 'btn-neon-green text-dark shadow-lgScale font-weight-bold' : 'bg-transparent text-white border-0'}`}
                                style={{ width: '36px', height: '36px', fontSize: '1.25rem' }}
                                onClick={() => setAuthImage(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <button type="submit" className="btn btn-neon-green w-100 py-2 fw-bold text-dark" style={{ borderRadius: '10px' }}>
                          <i className="bi bi-person-plus-fill me-1"></i> Criar Conta
                        </button>
                        
                        <div className="mt-4 text-center">
                          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Já tem conta?</span>{' '}
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-info text-decoration-none fw-bold" 
                            style={{ fontSize: '0.8rem' }} 
                            onClick={() => setAuthMode('login')}
                          >
                            Faça Login
                          </button>
                        </div>
                      </form>
                    )}

                    {authMode === 'forgot' && (
                      <form onSubmit={handleForgotPassword}>
                        <h4 className="text-white fw-bold mb-1">🔑 Recuperação de Senha</h4>
                        <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>
                          Insira seu e-mail e a nova senha que deseja. O administrador precisará aprovar para que ela passe a valer.
                        </p>
                        
                        <div className="mb-3">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>E-MAIL DA SUA CONTA</label>
                          <input 
                            type="email" 
                            className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                            style={{ borderRadius: '10px' }} 
                            placeholder="seuemail@exemplo.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="form-label text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600' }}>PROPOSTA DE NOVA SENHA</label>
                          <input 
                            type="password" 
                            className="form-control bg-dark bg-opacity-40 border-secondary text-white" 
                            style={{ borderRadius: '10px' }} 
                            placeholder="Digite a nova senha desejada"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                          />
                        </div>
                        
                        <button type="submit" className="btn btn-warning w-100 py-2 fw-bold text-dark shadow-sm" style={{ borderRadius: '10px' }}>
                          <i className="bi bi-send-fill me-1"></i> Solicitar Troca de Senha
                        </button>
                        
                        <div className="mt-4 text-center">
                          <button 
                            type="button" 
                            className="btn btn-link p-0 text-info text-decoration-none fw-bold" 
                            style={{ fontSize: '0.8rem' }} 
                            onClick={() => setAuthMode('login')}
                          >
                            Voltar para o Login
                          </button>
                        </div>
                      </form>
                    )}

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
          <span>Palpitar</span>
        </button>

        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <i className="bi bi-clipboard-data-fill"></i>
          <span>Resultados</span>
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
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'leagues' ? 'active' : ''}`}
          onClick={() => setActiveTab('leagues')}
        >
          <i className="bi bi-people-fill"></i>
          <span>Bolões</span>
        </button>
 
        <button 
          className={`mobile-nav-item border-0 bg-transparent ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="bi bi-clock-history"></i>
          <span>Meus Palpites</span>
        </button>

      </nav>

      {/* ======================================================== */}
      {/* MODAL TÁTICO DE ESCALAÇÕES (Fase 5)                      */}
      {/* ======================================================== */}
      {showLineupModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1100, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card p-4 text-start border-info border-opacity-35 animate__animated animate__zoomIn" style={{ maxWidth: '550px', width: '92%', maxHeight: '90vh', overflowY: 'auto', background: '#0e1726' }}>
            
            {/* Cabeçalho */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-white fw-bold m-0 d-flex align-items-center gap-2">
                📋 Escalação Tática
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => { setShowLineupModal(false); setLineupData(null); }}
              ></button>
            </div>

            {loadingLineup ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
                <div className="spinner-border text-info mb-2" role="status"></div>
                <span>Carregando elencos reais...</span>
              </div>
            ) : lineupData ? (
              <>
                {/* Badge de Status da Escalação */}
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 rounded bg-dark bg-opacity-30">
                  <span className="text-secondary" style={{ fontSize: '0.8rem' }}>TIPO DE ESCALAÇÃO:</span>
                  {lineupData.status === 'oficial' ? (
                    <span className="badge bg-success text-white px-2 py-1 border border-success border-opacity-30" style={{ fontSize: '0.75rem' }}>
                      ✓ Oficial (Confirmada)
                    </span>
                  ) : (
                    <span className="badge bg-warning text-dark px-2 py-1 border border-warning border-opacity-30" style={{ fontSize: '0.75rem' }}>
                      ⏳ Provável (Pré-Jogo)
                    </span>
                  )}
                </div>

                {/* Seletores de Time */}
                <div className="d-flex mb-3 rounded p-1 bg-dark bg-opacity-40 border border-secondary border-opacity-20">
                  <button
                    className={`btn flex-grow-1 text-center py-1 fw-bold ${lineupTeamTab === 'home' ? 'btn-neon-green text-dark' : 'text-white bg-transparent border-0'}`}
                    style={{ fontSize: '0.8rem', borderRadius: '6px', border: 'none' }}
                    onClick={() => setLineupTeamTab('home')}
                  >
                    {lineupData.homeTeam || 'Time Casa'}
                  </button>
                  <button
                    className={`btn flex-grow-1 text-center py-1 fw-bold ${lineupTeamTab === 'away' ? 'btn-neon-green text-dark' : 'text-white bg-transparent border-0'}`}
                    style={{ fontSize: '0.8rem', borderRadius: '6px', border: 'none' }}
                    onClick={() => setLineupTeamTab('away')}
                  >
                    {lineupData.awayTeam || 'Time Visitante'}
                  </button>
                </div>

                {/* Campo Tático */}
                <div className="soccer-field mb-4 position-relative overflow-hidden" style={{
                  height: '420px',
                  background: 'linear-gradient(180deg, #1b3d22 0%, #0d2112 100%)',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'
                }}>
                  {/* Linhas de Marcação do Campo */}
                  {/* Linha do Meio Campo */}
                  <div className="position-absolute w-100" style={{ top: '50%', height: '1px', background: 'rgba(255, 255, 255, 0.15)' }}></div>
                  <div className="position-absolute rounded-circle border border-white border-opacity-15" style={{ top: '50%', left: '50%', width: '80px', height: '80px', transform: 'translate(-50%, -50%)' }}></div>
                  <div className="position-absolute rounded-circle bg-white bg-opacity-30" style={{ top: '50%', left: '50%', width: '6px', height: '6px', transform: 'translate(-50%, -50%)' }}></div>
                  
                  {/* Grande Área de Defesa */}
                  <div className="position-absolute border border-white border-opacity-15 border-top-0" style={{ bottom: 0, left: '50%', width: '56%', height: '60px', transform: 'translateX(-50%)' }}></div>
                  <div className="position-absolute border border-white border-opacity-15 border-top-0" style={{ bottom: 0, left: '50%', width: '26%', height: '22px', transform: 'translateX(-50%)' }}></div>
                  
                  {/* Grande Área de Ataque */}
                  <div className="position-absolute border border-white border-opacity-15 border-bottom-0" style={{ top: 0, left: '50%', width: '56%', height: '60px', transform: 'translateX(-50%)' }}></div>
                  <div className="position-absolute border border-white border-opacity-15 border-bottom-0" style={{ top: 0, left: '50%', width: '26%', height: '22px', transform: 'translateX(-50%)' }}></div>

                  {/* Renderização de Jogadores Titulares no Campo */}
                  {(lineupTeamTab === 'home' ? lineupData.starting.home : lineupData.starting.away).map((player: any, idx: number) => {
                    return (
                      <div 
                        key={`${player.name}-${idx}`}
                        className="position-absolute d-flex flex-column align-items-center"
                        style={{
                          left: `${player.x}%`,
                          bottom: `${player.y}%`,
                          transform: 'translate(-50%, 50%)',
                          zIndex: 10
                        }}
                      >
                        {/* Círculo do Jogador com Glow */}
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center border fw-bold text-white transition-all hover-scale"
                          style={{
                            width: '28px',
                            height: '28px',
                            fontSize: '0.75rem',
                            background: '#090d16',
                            borderColor: 'var(--neon-green)',
                            boxShadow: '0 0 10px rgba(0, 255, 135, 0.6)',
                            cursor: 'pointer'
                          }}
                          title={player.label}
                        >
                          {player.number}
                        </div>
                        {/* Nome do Jogador */}
                        <span 
                          className="px-1 py-0.5 rounded text-white text-center mt-1 text-nowrap fw-semibold border border-secondary border-opacity-20"
                          style={{
                            fontSize: '0.65rem',
                            background: 'rgba(9, 13, 22, 0.8)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            maxWidth: '78px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {player.name.split(' ').pop()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Lista de Reservas (Suplentes) */}
                <div>
                  <h6 className="text-white fw-bold mb-2">📋 Jogadores Suplentes (Reservas)</h6>
                  <div className="row g-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {(lineupTeamTab === 'home' ? lineupData.substitutes.home : lineupData.substitutes.away).map((sub: any, idx: number) => (
                      <div key={`${sub.name}-${idx}`} className="col-6 col-sm-4">
                        <div className="p-2 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-10 d-flex align-items-center gap-2">
                          <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.7rem', minWidth: '22px' }}>
                            {sub.number}
                          </span>
                          <span className="text-light text-truncate" style={{ fontSize: '0.75rem' }} title={sub.name}>
                            {sub.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-secondary">
                <span>Não foi possível carregar as escalações.</span>
              </div>
            )}

            <div className="mt-4 pt-3 border-top border-secondary border-opacity-20 text-end">
              <button 
                type="button" 
                className="btn btn-neon-green px-4 text-dark fw-bold" 
                onClick={() => { setShowLineupModal(false); setLineupData(null); }}
                style={{ borderRadius: '6px' }}
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

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
