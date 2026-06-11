import Link from 'next/link';

export default function LeagueNotFound() {
  return (
    <section className="league-empty-state league-not-found">
      <i className="bi bi-shield-lock" aria-hidden="true"></i>
      <h1>Bolão indisponível</h1>
      <p>Ele não existe ou sua conta não tem acesso a esta disputa.</p>
      <Link href="/leagues" className="btn league-primary-button">
        <i className="bi bi-arrow-left" aria-hidden="true"></i>
        Voltar para bolões
      </Link>
    </section>
  );
}
