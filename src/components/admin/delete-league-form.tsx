'use client';

import { deleteLeagueAction } from '@/app/admin/actions';

interface DeleteLeagueFormProps {
  leagueId: string;
  leagueName: string;
}

export function DeleteLeagueForm({ leagueId, leagueName }: DeleteLeagueFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const confirmDelete = window.confirm(
      `Tem certeza de que deseja excluir permanentemente o bolão "${leagueName}"? Esta ação não pode ser desfeita e removerá todos os membros e palpites relacionados.`,
    );
    if (!confirmDelete) {
      event.preventDefault();
    }
  };

  return (
    <form className="admin-action-form admin-delete-form" action={deleteLeagueAction} onSubmit={handleSubmit}>
      <input type="hidden" name="leagueId" value={leagueId} />
      <input
        name="reason"
        placeholder="Motivo exclusão"
        required
        minLength={3}
        aria-label="Motivo da exclusão do bolão"
      />
      <button
        className="admin-icon-button danger"
        aria-label="Excluir bolão"
        type="submit"
        title="Excluir bolão"
      >
        <i className="bi bi-trash" aria-hidden="true" />
      </button>
    </form>
  );
}
