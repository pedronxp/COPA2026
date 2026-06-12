import Link from 'next/link';
import LandingScoreboard from '@/components/landing-scoreboard';
import { getFeaturedMatches } from '@/lib/landing-matches';

export const dynamic = 'force-dynamic';

const highlights = [
  { icon: 'bi-lightning-charge-fill', title: 'Palpites vivos', text: 'Janelas de aposta por partida, placar salvo e acompanhamento em tempo real.' },
  { icon: 'bi-trophy-fill', title: 'Ranking competitivo', text: 'Pontos, sequências e disputas entre amigos durante toda a Copa de 2026.' },
  { icon: 'bi-people-fill', title: 'Bolões privados', text: 'Crie ligas com regras próprias, código de convite e ranking exclusivo.' },
];

export default async function LandingPage() {
  const activeMatches = await getFeaturedMatches();

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

          <LandingScoreboard initialMatches={activeMatches} />
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
