'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function payloadMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.message === 'string') return record.message;
  }
  return fallback;
}

export function JoinLeagueForm() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(payloadMessage(payload, 'Não foi possível entrar no bolão.'));

      const record = payload as Record<string, unknown>;
      const league = record.league && typeof record.league === 'object'
        ? record.league as Record<string, unknown>
        : record;
      const destination = typeof league.slug === 'string'
        ? league.slug
        : typeof league.id === 'string' ? league.id : null;

      router.push(destination ? `/leagues/${destination}` : '/leagues');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível entrar no bolão.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="league-join-page">
      <section className="league-join-panel">
        <Link href="/leagues" className="btn league-icon-button" title="Voltar para bolões">
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
        </Link>
        <div className="league-ticket-icon"><i className="bi bi-ticket-perforated" aria-hidden="true"></i></div>
        <span className="league-eyebrow">Convite privado</span>
        <h1>Entre com seu código.</h1>
        <p>O código é enviado pelo criador ou por um subadministrador do bolão.</p>
        <form onSubmit={submit}>
          <label className="league-field">
            <span>Código de convite</span>
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder="COPA-ABCDE"
              autoComplete="off"
              autoFocus
            />
          </label>
          {error && <div className="league-alert error"><i className="bi bi-exclamation-circle" aria-hidden="true"></i>{error}</div>}
          <button type="submit" className="btn league-primary-button" disabled={pending || inviteCode.trim().length < 5}>
            {pending ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>}
            Entrar no bolão
          </button>
        </form>
        <div className="league-join-divider"><span>ou</span></div>
        <Link href="/leagues" className="league-text-link">Explorar bolões públicos <i className="bi bi-arrow-right" aria-hidden="true"></i></Link>
      </section>
    </div>
  );
}
