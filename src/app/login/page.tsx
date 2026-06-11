import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/auth-form';
import { getCurrentUser } from '@/lib/session';

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const nextPath = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') && !next.startsWith('/register')
    ? next
    : '/dashboard';

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="auth-page">
      <div className="auth-visual" aria-hidden="true"></div>
      <Link href="/" className="auth-home-link">
        <i className="bi bi-arrow-left"></i>
        Copa dos Crias
      </Link>
      <section className="auth-shell" aria-label="Login">
        <div className="auth-context">
          <p className="landing-kicker">Volte para a disputa</p>
          <h1>Seu ranking espera por você.</h1>
          <p>
            Entre para salvar palpites, ver sua posição e continuar nos bolões da Copa de 2026.
          </p>
        </div>
        <AuthForm mode="login" nextPath={nextPath} />
      </section>
    </main>
  );
}
