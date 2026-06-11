import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/auth-form';
import { getCurrentUser } from '@/lib/session';

interface RegisterPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
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
      <section className="auth-shell" aria-label="Cadastro">
        <div className="auth-context">
          <p className="landing-kicker">Primeiro palpite</p>
          <h1>Crie sua conta e entre no jogo.</h1>
          <p>
            A conta já nasce no bolão global para você começar a competir sem passos extras.
          </p>
        </div>
        <AuthForm mode="register" nextPath={nextPath} />
      </section>
    </main>
  );
}
