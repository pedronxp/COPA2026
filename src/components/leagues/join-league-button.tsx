'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface JoinLeagueButtonProps {
  leagueId: string;
  leagueSlug: string;
  joinPolicy: string;
  compact?: boolean;
}

function apiMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.message === 'string') return record.message;
  }
  return fallback;
}

export function JoinLeagueButton({
  leagueId,
  leagueSlug,
  joinPolicy,
  compact = false,
}: JoinLeagueButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleJoin() {
    if (joinPolicy === 'invite') {
      router.push('/leagues/join');
      return;
    }

    setPending(true);
    setFeedback(null);

    try {
      // The redesigned endpoint accepts a league identity; inviteCode remains supported by /leagues/join.
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId,
          slug: leagueSlug,
          action: joinPolicy === 'approval' ? 'request' : 'join',
        }),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(apiMessage(payload, 'Não foi possível concluir a entrada.'));
      }

      if (joinPolicy === 'approval') {
        setFeedback('Solicitação enviada.');
      } else {
        router.refresh();
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível concluir a entrada.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`league-join-action ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className="btn league-primary-button"
        onClick={handleJoin}
        disabled={pending}
      >
        {pending ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
        ) : (
          <i className={`bi bi-${joinPolicy === 'approval' ? 'send' : 'person-plus'}`} aria-hidden="true"></i>
        )}
        {joinPolicy === 'approval' ? 'Solicitar entrada' : joinPolicy === 'invite' ? 'Usar convite' : 'Entrar no bolão'}
      </button>
      {feedback && <span className="league-inline-feedback">{feedback}</span>}
    </div>
  );
}
