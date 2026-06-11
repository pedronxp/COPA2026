import Link from 'next/link';
import { prisma } from '@/lib/prisma';

const highlights = [
  { icon: 'bi-lightning-charge-fill', title: 'Palpites vivos', text: 'Janelas de aposta por partida, placar salvo e acompanhamento em tempo real.' },
  { icon: 'bi-trophy-fill', title: 'Ranking competitivo', text: 'Pontos, sequências e disputas entre amigos durante toda a Copa de 2026.' },
  { icon: 'bi-people-fill', title: 'Bolões privados', text: 'Crie ligas com regras próprias, código de convite e ranking exclusivo.' },
];

function formatMatchTimeInfo(kickOff: Date, status: string, now: Date) {
  if (status === 'live') {
    return 'Ao vivo';
  }
  if (status === 'finished') {
    return 'Finalizado';
  }
  
  const diffMs = kickOff.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 'Em andamento';
  }
  
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    if (diffHours < 1) {
      const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `em ${diffMinutes} min`;
    }
    const hours = Math.round(diffHours);
    return `em ${hours}h`;
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(kickOff).replace(',', ' às');
}

export default async function LandingPage() {
  const now = new Date();

  // Buscar partidas futuras (não terminadas) que começam a partir de agora ou começaram há até 3h
  let activeMatches = await prisma.match.findMany({
    where: {
      status: { in: ['scheduled', 'live'] },
      kickOff: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
    },
    orderBy: {
      kickOff: 'asc',
    },
    take: 3,
    include: {
      _count: {
        select: { predictions: true },
      },
    },
  });

  // Se houver menos de 3 partidas futuras, buscar as partidas terminadas mais recentes para preencher a lista
  if (activeMatches.length < 3) {
    const fallbackCount = 3 - activeMatches.length;
    const completedMatches = await prisma.match.findMany({
      where: {
        status: 'finished',
      },
      orderBy: {
        kickOff: 'desc',
      },
      take: fallbackCount,
      include: {
        _count: {
          select: { predictions: true },
        },
      },
    });
    activeMatches = [...activeMatches, ...completedMatches];
  }

  // Se ainda houver menos de 3 partidas, buscar qualquer outra partida disponível para garantir que não fique em branco
  if (activeMatches.length < 3) {
    const existingIds = activeMatches.map((m) => m.id);
    const fallbackCount = 3 - activeMatches.length;
    const remainingMatches = await prisma.match.findMany({
      where: {
        id: { notIn: existingIds },
      },
      orderBy: {
        kickOff: 'asc',
      },
      take: fallbackCount,
      include: {
        _count: {
          select: { predictions: true },
        },
      },
    });
    activeMatches = [...activeMatches, ...remainingMatches];
  }

  // Ordenar cronologicamente por horário de início
  activeMatches.sort((a, b) => a.kickOff.getTime() - b.kickOff.getTime());

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true"></div>
        <nav className="landing-nav" aria-label="Principal">
          <Link href="/" className="landing-brand" aria-label="Copa dos Crias início">
            <span className="landing-brand-mark">CA</span>
            <span>Copa dos Crias</span>
          </Link>
          <div className="landing-nav-actions">
            <Link href="/login" className="btn btn-neon-outline">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Entrar
            </Link>
            <Link href="/register" className="btn btn-neon-green">
              <i className="bi bi-person-plus-fill me-2"></i>
              Criar conta
            </Link>
          </div>
        </nav>

        <div className="landing-hero-content">
          <div className="landing-copy">
            <p className="landing-kicker">Bolão da Copa do Mundo 2026</p>
            <h1>Copa dos Crias</h1>
            <p className="landing-lead">
              Entre no bolão, crave seus placares, suba no ranking e acompanhe cada rodada com seus amigos.
            </p>
            <div className="landing-cta-row">
              <Link href="/login" className="btn btn-neon-green btn-lg">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Fazer login
              </Link>
              <Link href="/register" className="btn btn-neon-outline btn-lg">
                <i className="bi bi-person-plus-fill me-2"></i>
                Registrar
              </Link>
            </div>
          </div>

          <aside className="landing-scoreboard" aria-label="Prévia de partidas">
            <div className="scoreboard-header">
              <span>Próximos jogos</span>
              <i className="bi bi-broadcast-pin"></i>
            </div>
            {activeMatches.map((match) => {
              const isLiveOrFinished = match.status === 'live' || match.status === 'finished';
              const timeLabel = formatMatchTimeInfo(match.kickOff, match.status, now);
              const voteCount = match._count.predictions;

              return (
                <div className="scoreboard-match animate__animated animate__fadeIn" key={match.id}>
                  <div>
                    <strong>{match.homeTeam}</strong>
                    {isLiveOrFinished ? (
                      <span className={match.status === 'live' ? 'text-neon-green animate__animated animate__pulse animate__infinite mx-2' : 'text-secondary mx-2'}>
                        {match.homeScore} x {match.awayScore}
                      </span>
                    ) : (
                      <span>x</span>
                    )}
                    <strong>{match.awayTeam}</strong>
                  </div>
                  <div>
                    {match.status === 'live' ? (
                      <span className="text-danger d-inline-flex align-items-center gap-1.5" style={{ fontWeight: 800 }}>
                        <span className="live-pulse" />
                        {timeLabel}
                      </span>
                    ) : (
                      <span style={{ color: '#38bdf8' }}>{timeLabel}</span>
                    )}
                    <small>{voteCount.toLocaleString('pt-BR')} {voteCount === 1 ? 'palpite' : 'palpites'}</small>
                  </div>
                </div>
              );
            })}
          </aside>
        </div>
      </section>

      <section className="landing-section" aria-label="Destaques">
        <div className="landing-section-inner">
          <div className="landing-section-heading">
            <p className="landing-kicker">Tudo pronto para a rodada</p>
            <h2>Uma entrada mais clara para o bolão</h2>
          </div>

          <div className="landing-feature-grid">
            {highlights.map((item) => (
              <article className="landing-feature-card" key={item.title}>
                <div className="landing-feature-icon" aria-hidden="true">
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
