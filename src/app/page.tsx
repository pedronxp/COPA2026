// src/app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickOff: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'finished';
  result: '1' | 'X' | '2' | null;
  stage: string;
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
  guess: '1' | 'X' | '2';
  processed: boolean;
}

export default function Home() {
  // Estados da Aplicação
  const [activeTab, setActiveTab] = useState<'home' | 'matches' | 'leaderboard' | 'history' | 'admin'>('home');
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  // Usuário Atual selecionado para simulação de Sandbox
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('currentUser');
  
  // Estado de carregamento e mensagens
  const [loading, setLoading] = useState<boolean>(true);
  const [savingPredictionId, setSavingPredictionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Estados dos inputs de palpites locais no React (para digitação imediata e fluida)
  const [localGuesses, setLocalGuesses] = useState<Record<string, { home: string; away: string }>>({});

  // Estados do Painel de Simulação (Admin)
  const [simulatingMatchId, setSimulatingMatchId] = useState<string | null>(null);
  const [simHomeScore, setSimHomeScore] = useState<string>('0');
  const [simAwayScore, setSimAwayScore] = useState<string>('0');
  const [simStatus, setSimStatus] = useState<'scheduled' | 'live' | 'finished'>('live');

  // Buscar dados da API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Partidas
      const matchesRes = await fetch('/api/matches');
      const matchesData = await matchesRes.json();
      setMatches(matchesData);

      // Usuários
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

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Falha ao sincronizar com a API.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Exibir toast temporário
  const showToast = (text: string, type: 'success' | 'danger') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Tratar mudança nos palpites locais
  const handleLocalGuessChange = (matchId: string, side: 'home' | 'away', val: string) => {
    // Apenas números
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

  // Salvar palpite na API (com debounce de clique ou manual)
  const saveUserPrediction = async (matchId: string) => {
    const guessData = localGuesses[matchId];
    if (!guessData || guessData.home === '' || guessData.away === '') {
      showToast('Por favor, preencha o placar dos dois times para salvar.', 'danger');
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
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar palpite.');
      }

      showToast('Palpite salvo com sucesso!', 'success');
      // Recarregar dados para refletir no histórico e simulação
      const predsRes = await fetch(`/api/predictions?userId=${selectedUserId}`);
      const predsData = await predsRes.json();
      setPredictions(predsData);

    } catch (error: any) {
      showToast(error.message, 'danger');
      // Reverter inputs para valor salvo anteriormente se houver
      const savedPred = predictions.find(p => p.matchId === matchId);
      if (savedPred) {
        setLocalGuesses(prev => ({
          ...prev,
          [matchId]: {
            home: savedPred.homeGuess.toString(),
            away: savedPred.awayGuess.toString()
          }
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

  // Simulador de Partida (Mudar placar e rodar motor de pontos)
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
        throw new Error(data.error || 'Erro ao simular partida.');
      }

      showToast('Partida simulada e pontuações processadas!', 'success');
      setSimulatingMatchId(null);
      fetchData(); // Recarregar tudo

    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  // Resetar Simulação
  const handleResetSimulation = async () => {
    if (!confirm('Deseja realmente resetar todas as partidas e pontuações para o estado inicial da Copa?')) return;
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao resetar.');
      showToast('Bolão reiniciado para o início da Copa!', 'success');
      fetchData();
      setActiveTab('home');
    } catch (error: any) {
      showToast(error.message, 'danger');
    }
  };

  // Gerar link do WhatsApp para convidar amigos
  const handleShareWhatsApp = () => {
    const text = `🔥 Entrei no Bolão COPA-ANT! Estou na corrida pelo título de Rei dos Palpites da Copa 2026. Atualmente tenho ${currentUser?.points || 0} pontos. Acha que consegue me superar? Dê seus palpites exatos também!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Calcular estatísticas e cards sociais (em alta/em baixa)
  const usersInAlta = [...users]
    .filter(u => u.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 2);

  const usersInBaixa = [...users]
    .filter(u => u.misses > 0)
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 2);

  // Encontrar o próximo jogo para o contador da Home
  const nextMatch = matches.find(m => m.status === 'scheduled');

  // Lógica de cálculo de tempo limite
  const isTimeGateExpired = (kickOffStr: string) => {
    const kickOff = new Date(kickOffStr).getTime();
    const limit = kickOff - 30 * 60 * 1000;
    return Date.now() > limit;
  };

  // Calcular estatísticas de palpites gerais para o termômetro (Secômetro)
  const getMatchStats = (matchId: string) => {
    // Como os palpites de outros usuários estão mocados, geramos percentuais realistas
    // baseados na força de times para fins visuais interessantes
    if (matchId === 'match-1') return { home: 65, draw: 25, away: 10 }; // México vs NZ
    if (matchId === 'match-2') return { home: 45, draw: 30, away: 25 }; // EUA vs Marrocos
    if (matchId === 'match-3') return { home: 55, draw: 25, away: 20 }; // Canadá vs Argélia
    if (matchId === 'match-4') return { home: 70, draw: 20, away: 10 }; // Brasil vs Croácia
    return { home: 33, draw: 34, away: 33 };
  };

  return (
    <div className="container-fluid pb-5 mb-5 px-0 h-100 flex flex-col justify-content-between">
      
      {/* 1. Header Fixo Superior */}
      <header className="navbar sticky-top bg-dark px-3 py-2 border-bottom border-secondary shadow-sm">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          
          {/* Logo */}
          <div className="d-flex align-items-center">
            <span className="fs-4 fw-extrabold text-white tracking-wide d-flex align-items-center gap-2">
              🏆 COPA<span className="text-info">ANT</span>
            </span>
            <span className="badge bg-secondary ms-2 d-none d-sm-inline-block" style={{ fontSize: '0.65rem' }}>COPA 2026</span>
          </div>

          {/* Perfil & Pontuação + Sandbox Seletor */}
          <div className="d-flex align-items-center gap-2">
            
            {/* Seletor de Perfil Sandbox (Para Testes) */}
            <div className="me-2 d-flex align-items-center">
              <span className="text-secondary d-none d-md-inline me-2" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-person-gear"></i> Sandbox Conta:
              </span>
              <select 
                className="form-select form-select-sm bg-dark text-white border-secondary"
                style={{ fontSize: '0.8rem', width: '150px' }}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name.split(' ')[0]} ({u.points} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Placar de Pontos do Usuário Logado */}
            <div className="glass-card px-3 py-1 d-flex align-items-center gap-2 border border-info">
              <span className="fs-5">{currentUser?.image || '👑'}</span>
              <div className="d-flex flex-column text-start">
                <span className="text-secondary" style={{ fontSize: '0.65rem', lineHeight: 1 }}>SEUS PONTOS</span>
                <span className="text-info fw-bold fs-6">{currentUser?.points || 0} pts</span>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* 2. Conteúdo Principal da SPA */}
      <main className="container px-3 mt-3 flex-grow-1" style={{ maxWidth: '600px' }}>
        
        {/* Toast de Notificação */}
        {toastMessage && (
          <div className={`alert alert-${toastMessage.type} glass-card position-fixed start-50 translate-middle-x mt-2 py-2 px-4 shadow-lg`} style={{ zIndex: 1050, top: '70px', minWidth: '300px' }}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi bi-${toastMessage.type === 'success' ? 'check-circle' : 'exclamation-triangle'}`}></i>
              <span style={{ fontSize: '0.9rem' }}>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-info mb-3" role="status"></div>
            <span className="text-secondary">Carregando palpites da Copa...</span>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* ABA: HOME                                                */}
            {/* ======================================================== */}
            {activeTab === 'home' && (
              <div className="fade-in animate__animated animate__fadeIn">
                
                {/* 1. Banner da Copa */}
                <div className="glass-card p-3 mb-3 text-center border-info border-opacity-25" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 135, 0.05) 0%, rgba(96, 239, 255, 0.1) 100%)' }}>
                  <h5 className="text-white fw-bold mb-1">A Copa do Mundo de 2026 Começou! ⚽</h5>
                  <p className="text-secondary mb-3" style={{ fontSize: '0.8rem' }}>
                    O maior espetáculo da terra está rolando. Faça seus palpites nos jogos de hoje e dispute o pódio!
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <button className="btn btn-neon-green btn-sm px-3" onClick={() => setActiveTab('matches')}>
                      <i className="bi bi-lightning-charge-fill"></i> Dar Palpites
                    </button>
                    <button className="btn btn-neon-outline btn-sm px-3" onClick={handleShareWhatsApp}>
                      <i className="bi bi-whatsapp"></i> Desafiar Galera
                    </button>
                  </div>
                </div>

                {/* 2. Próximo Jogo Relevante */}
                {nextMatch && (
                  <div className="glass-card p-3 mb-3 text-center border-secondary">
                    <span className="text-secondary uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>PRÓXIMA PARTIDA FECHANDO</span>
                    <div className="d-flex align-items-center justify-content-around mt-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="fs-1">{nextMatch.homeFlag}</span>
                        <span className="fw-bold text-white mt-1" style={{ fontSize: '0.85rem' }}>{nextMatch.homeTeam}</span>
                      </div>
                      <span className="text-secondary fw-bold fs-6">VS</span>
                      <div className="d-flex flex-column align-items-center">
                        <span className="fs-1">{nextMatch.awayFlag}</span>
                        <span className="fw-bold text-white mt-1" style={{ fontSize: '0.85rem' }}>{nextMatch.awayTeam}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-top border-secondary text-secondary" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-clock-fill text-warning me-1"></i>
                      Limite para palpitar: 30 minutos antes da partida.
                    </div>
                  </div>
                )}

                {/* 3. Cards de Engajamento Social (Quem está em alta / Em baixa) */}
                <div className="row g-2 mb-3">
                  
                  {/* EM ALTA 🔥 */}
                  <div className="col-12 col-sm-6">
                    <div className="glass-card p-3 h-100 highlight-up border-0">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fs-5 pulse-fire">🔥</span>
                        <h6 className="text-white fw-bold m-0" style={{ fontSize: '0.9rem' }}>Quem tá em alta</h6>
                      </div>
                      {usersInAlta.length > 0 ? (
                        <div className="d-flex flex-column gap-2">
                          {usersInAlta.map((u, idx) => (
                            <div key={u.id} className="d-flex justify-content-between align-items-center py-1">
                              <span className="text-light" style={{ fontSize: '0.85rem' }}>
                                {u.image} {u.name.split(' ')[0]}
                              </span>
                              <span className="badge bg-success" style={{ fontSize: '0.75rem' }}>
                                +{u.streak} acertos seguidos!
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Competição morna. Dê palpites para incendiar!</span>
                      )}
                    </div>
                  </div>

                  {/* EM BAIXA 👎 */}
                  <div className="col-12 col-sm-6">
                    <div className="glass-card p-3 h-100 highlight-down border-0">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fs-5">👎</span>
                        <h6 className="text-white fw-bold m-0" style={{ fontSize: '0.9rem' }}>Secador / Pé Frio</h6>
                      </div>
                      {usersInBaixa.length > 0 ? (
                        <div className="d-flex flex-column gap-2">
                          {usersInBaixa.map(u => (
                            <div key={u.id} className="d-flex justify-content-between align-items-center py-1">
                              <span className="text-light" style={{ fontSize: '0.85rem' }}>
                                {u.image} {u.name.split(' ')[0]}
                              </span>
                              <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>
                                {u.misses} erros seguidos...
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Ninguém está secando os amigos ainda!</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* 4. Como Pontuar */}
                <div className="glass-card p-3 text-start">
                  <h6 className="text-white fw-bold mb-2">
                    <i className="bi bi-info-circle text-info"></i> Lógica de Pontos (Estilo GE)
                  </h6>
                  <div className="d-flex flex-column gap-2" style={{ fontSize: '0.8rem' }}>
                    <div className="d-flex justify-content-between border-bottom border-secondary pb-1">
                      <span className="text-secondary">🎯 Placar Exato (ex: apostou 2x1 e foi 2x1)</span>
                      <span className="text-info fw-bold">+5 pts</span>
                    </div>
                    <div className="d-flex justify-content-between border-bottom border-secondary pb-1">
                      <span className="text-secondary">⚽ Vencedor e Saldo (ex: apostou 2x0 e foi 3x1)</span>
                      <span className="text-info fw-bold">+3 pts</span>
                    </div>
                    <div className="d-flex justify-content-between border-bottom border-secondary pb-1">
                      <span className="text-secondary">🏃 Vencedor Simples (ex: apostou 2x1 e foi 3x0)</span>
                      <span className="text-info fw-bold">+2 pts</span>
                    </div>
                    <div className="d-flex justify-content-between border-bottom border-secondary pb-1">
                      <span className="text-secondary">🤝 Empate Não Exato (ex: apostou 1x1 e foi 2x2)</span>
                      <span className="text-info fw-bold">+2 pts</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">❌ Erro de resultado final</span>
                      <span className="text-secondary">0 pts</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* ABA: PALPITES DE PARTIDAS                                */}
            {/* ======================================================== */}
            {activeTab === 'matches' && (
              <div className="fade-in animate__animated animate__fadeIn">
                
                <h5 className="text-white fw-bold mb-3 d-flex justify-content-between align-items-center">
                  <span>⚽ Dê Seus Palpites</span>
                  <span className="badge bg-dark border border-secondary text-secondary" style={{ fontSize: '0.75rem' }}>
                    Fase de Grupos
                  </span>
                </h5>

                <div className="d-flex flex-column gap-3">
                  {matches
                    .filter(m => m.status !== 'finished') // Apenas jogos não finalizados (scheduled/live)
                    .map(match => {
                      const isExpired = isTimeGateExpired(match.kickOff);
                      const isLive = match.status === 'live';
                      const stats = getMatchStats(match.id);
                      const localGuess = localGuesses[match.id] || { home: '', away: '' };

                      return (
                        <div key={match.id} className="glass-card p-3 position-relative">
                          
                          {/* Indicator de status ou trava */}
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                              {new Date(match.kickOff).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            {isLive ? (
                              <span className="badge-live">
                                <span className="live-dot"></span> AO VIVO
                              </span>
                            ) : isExpired ? (
                              <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-lock-fill"></i> Mercado Fechado
                              </span>
                            ) : (
                              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-unlock-fill"></i> Palpite Disponível
                              </span>
                            )}
                          </div>

                          {/* Placar e Inputs de Chute */}
                          <div className="d-flex align-items-center justify-content-between my-3">
                            
                            {/* Time Casa */}
                            <div className="d-flex flex-column align-items-center text-center" style={{ width: '30%' }}>
                              <span style={{ fontSize: '2rem' }}>{match.homeFlag}</span>
                              <span className="fw-bold text-white text-truncate w-100" style={{ fontSize: '0.85rem' }}>{match.homeTeam}</span>
                            </div>

                            {/* Inputs de Placar */}
                            <div className="d-flex align-items-center justify-content-center gap-2" style={{ width: '40%' }}>
                              
                              {/* Input Casa */}
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

                              {/* Input Visitante */}
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

                            {/* Time Visitante */}
                            <div className="d-flex flex-column align-items-center text-center" style={{ width: '30%' }}>
                              <span style={{ fontSize: '2rem' }}>{match.awayFlag}</span>
                              <span className="fw-bold text-white text-truncate w-100" style={{ fontSize: '0.85rem' }}>{match.awayTeam}</span>
                            </div>

                          </div>

                          {/* Botão de Enviar Palpite se o mercado estiver aberto */}
                          {!isExpired && !isLive && (
                            <div className="mt-2 text-center">
                              <button
                                className="btn btn-neon-green btn-sm w-100 py-1"
                                onClick={() => saveUserPrediction(match.id)}
                                disabled={savingPredictionId === match.id}
                              >
                                {savingPredictionId === match.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-lg"></i> Confirmar Palpite
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Secômetro (Termômetro da Galera) */}
                          <div className="mt-3 pt-2 border-top border-secondary border-opacity-50">
                            <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: '0.65rem' }}>
                              <span>Palpites da Galera:</span>
                              <span>{match.homeTeam} {stats.home}% | Empate {stats.draw}% | {match.awayTeam} {stats.away}%</span>
                            </div>
                            <div className="thermostat-bar d-flex">
                              <div className="thermostat-segment-home" style={{ width: `${stats.home}%` }}></div>
                              <div className="thermostat-segment-draw" style={{ width: `${stats.draw}%` }}></div>
                              <div className="thermostat-segment-away" style={{ width: `${stats.away}%` }}></div>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                  {matches.filter(m => m.status !== 'finished').length === 0 && (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-emoji-smile fs-1"></i>
                      <p className="mt-2">Todos os jogos já foram finalizados! Dê uma olhada na aba Histórico ou Ranking.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* ABA: LEADERBOARD / RANKING                               */}
            {/* ======================================================== */}
            {activeTab === 'leaderboard' && (
              <div className="fade-in animate__animated animate__fadeIn">
                
                <h5 className="text-white fw-bold mb-3">🏆 Classificação Geral</h5>

                {/* Top 3 Pódio */}
                <div className="row g-2 mb-3 align-items-end justify-content-center text-center">
                  
                  {/* 2º Lugar */}
                  {users[1] && (
                    <div className="col-4 order-1">
                      <div className="glass-card p-2 border-secondary" style={{ borderBottom: '3px solid var(--silver)' }}>
                        <span className="fs-3">🥈</span>
                        <div className="fw-bold text-white text-truncate mt-1" style={{ fontSize: '0.8rem' }}>{users[1].name.split(' ')[0]}</div>
                        <span className="text-info fw-bold" style={{ fontSize: '0.85rem' }}>{users[1].points} pts</span>
                      </div>
                    </div>
                  )}

                  {/* 1º Lugar */}
                  {users[0] && (
                    <div className="col-4 order-2">
                      <div className="glass-card p-3 leader-card-1" style={{ borderBottom: '3px solid var(--gold)' }}>
                        <span className="crown-bounce">👑</span>
                        <div className="fw-bold text-white text-truncate mt-1" style={{ fontSize: '0.9rem' }}>{users[0].name.split(' ')[0]}</div>
                        <span className="text-info fw-bold" style={{ fontSize: '1rem' }}>{users[0].points} pts</span>
                      </div>
                    </div>
                  )}

                  {/* 3º Lugar */}
                  {users[2] && (
                    <div className="col-4 order-3">
                      <div className="glass-card p-2 border-secondary" style={{ borderBottom: '3px solid var(--bronze)' }}>
                        <span className="fs-3">🥉</span>
                        <div className="fw-bold text-white text-truncate mt-1" style={{ fontSize: '0.8rem' }}>{users[2].name.split(' ')[0]}</div>
                        <span className="text-info fw-bold" style={{ fontSize: '0.85rem' }}>{users[2].points} pts</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Lista Completa */}
                <div className="glass-card">
                  <div className="list-group list-group-flush bg-transparent">
                    {users.map((user, index) => {
                      const isCurrentUser = user.id === selectedUserId;
                      return (
                        <div
                          key={user.id}
                          className={`list-group-item bg-transparent d-flex justify-content-between align-items-center py-3 px-3 border-secondary border-opacity-25 ${
                            isCurrentUser ? 'bg-info bg-opacity-10 border-info border-opacity-50' : ''
                          }`}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span className="text-secondary fw-bold" style={{ width: '25px' }}>
                              #{index + 1}
                            </span>
                            <span className="fs-4">{user.image}</span>
                            <div className="d-flex flex-column text-start">
                              <span className={`fw-bold text-white ${isCurrentUser ? 'text-info' : ''}`} style={{ fontSize: '0.9rem' }}>
                                {user.name} {isCurrentUser && <span className="badge bg-info text-dark ms-1" style={{ fontSize: '0.6rem' }}>VOCÊ</span>}
                              </span>
                              <span className="text-secondary" style={{ fontSize: '0.7rem' }}>{user.email}</span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {user.streak >= 3 && <span className="fs-6 pulse-fire" title="Em alta! 🔥">🔥</span>}
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
                
                <h5 className="text-white fw-bold mb-3">📜 Seus Palpites e Resultados</h5>

                <div className="d-flex flex-column gap-3">
                  {matches
                    .filter(m => m.status === 'finished')
                    .map(match => {
                      const userPred = predictions.find(p => p.matchId === match.id);
                      
                      // Calcular pontos obtidos se houver palpite
                      let scoreBadge = { text: 'Sem palpite', class: 'bg-secondary' };
                      let ptsObtidos = 0;

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
                          scoreBadge = { text: 'Errou o resultado (0)', class: 'bg-danger' };
                        }
                      }

                      return (
                        <div key={match.id} className="glass-card p-3 border-secondary">
                          
                          {/* Cabeçalho da partida no histórico */}
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                            <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                              Fase de Grupos • Encerrado
                            </span>
                            <span className={`badge ${scoreBadge.class}`} style={{ fontSize: '0.7rem' }}>
                              {scoreBadge.text}
                            </span>
                          </div>

                          {/* Placar Real */}
                          <div className="d-flex align-items-center justify-content-between my-2 text-center">
                            <div className="d-flex flex-column align-items-center" style={{ width: '35%' }}>
                              <span className="fs-2">{match.homeFlag}</span>
                              <span className="fw-bold text-white mt-1" style={{ fontSize: '0.8rem' }}>{match.homeTeam}</span>
                            </div>
                            <div className="d-flex flex-column align-items-center" style={{ width: '30%' }}>
                              <span className="fs-3 fw-extrabold text-info">
                                {match.homeScore} - {match.awayScore}
                              </span>
                              <span className="text-secondary" style={{ fontSize: '0.65rem' }}>RESULTADO REAL</span>
                            </div>
                            <div className="d-flex flex-column align-items-center" style={{ width: '35%' }}>
                              <span className="fs-2">{match.awayFlag}</span>
                              <span className="fw-bold text-white mt-1" style={{ fontSize: '0.8rem' }}>{match.awayTeam}</span>
                            </div>
                          </div>

                          {/* Palpite do Usuário */}
                          {userPred ? (
                            <div className="mt-3 p-2 rounded text-center bg-dark bg-opacity-50 border border-secondary border-opacity-25" style={{ fontSize: '0.8rem' }}>
                              <span className="text-secondary me-1">Seu Palpite:</span>
                              <strong className="text-white">
                                {match.homeTeam} {userPred.homeGuess} x {userPred.awayGuess} {match.awayTeam}
                              </strong>
                            </div>
                          ) : (
                            <div className="mt-3 p-2 rounded text-center bg-danger bg-opacity-10 border border-danger border-opacity-25" style={{ fontSize: '0.8rem' }}>
                              <span className="text-danger">Você não deu nenhum palpite para este jogo.</span>
                            </div>
                          )}

                        </div>
                      );
                    })}

                  {matches.filter(m => m.status === 'finished').length === 0 && (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-clock-history fs-1"></i>
                      <p className="mt-2">Nenhum jogo foi finalizado ainda. Use o painel de Simulação para rodar os jogos!</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* ABA: PAINEL DE SIMULAÇÃO (ADMIN/DEV)                      */}
            {/* ======================================================== */}
            {activeTab === 'admin' && (
              <div className="fade-in animate__animated animate__fadeIn">
                
                <h5 className="text-white fw-bold mb-3 d-flex justify-content-between align-items-center">
                  <span>🛠️ Simulador da Copa (Sandbox)</span>
                  <button className="btn btn-danger btn-sm px-2" onClick={handleResetSimulation}>
                    <i className="bi bi-arrow-counterclockwise"></i> Resetar Tudo
                  </button>
                </h5>

                <div className="alert alert-warning glass-card py-2 border-warning border-opacity-25 text-start" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-info-circle-fill text-warning me-2"></i>
                  Como administrador, mude o placar e encerre jogos abaixo para ver as triggers de pontuação rodarem no banco/memória. A pontuação dos usuários no ranking atualizará na hora!
                </div>

                {/* Seleção de Jogo para Simulação */}
                <div className="glass-card p-3 mb-4 text-start">
                  <h6 className="text-white fw-bold mb-3">Simular Placar de Partida</h6>
                  
                  <form onSubmit={handleSimulateMatch}>
                    
                    {/* Selecionar Jogo */}
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
                            setSimStatus(m.status);
                          }
                        }}
                        required
                      >
                        <option value="">-- Escolha um jogo --</option>
                        {matches.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.homeFlag} {m.homeTeam} vs {m.awayTeam} {m.awayFlag} ({m.status.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {simulatingMatchId && (
                      <>
                        {/* Gols e Status */}
                        <div className="row g-2 mb-3">
                          <div className="col-4">
                            <label className="form-label text-secondary" style={{ fontSize: '0.75rem' }}>Gols Casa:</label>
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
                            <label className="form-label text-secondary" style={{ fontSize: '0.75rem' }}>Gols Visitante:</label>
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
                            <label className="form-label text-secondary" style={{ fontSize: '0.75rem' }}>Status:</label>
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

                        {/* Botão de Gravar Simulação */}
                        <button type="submit" className="btn btn-neon-green w-100">
                          <i className="bi bi-play-circle-fill"></i> Aplicar e Processar Pontos
                        </button>
                      </>
                    )}

                  </form>
                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* 3. Navegação Inferior Estilo App */}
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

// Lógica local redundante para exibição instantânea no histórico
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
