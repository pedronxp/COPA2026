'use client';

import { deleteUsersBatchAction } from '@/app/admin/actions';

interface DeleteUserFormProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export function DeleteUserForm({ userId, userName, userEmail }: DeleteUserFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const confirmDelete = window.confirm(
      `Tem certeza de que deseja excluir permanentemente o usuario "${userName || 'Usuario'}" (${userEmail})? Esta acao nao pode ser desfeita e apagara todos os seus palpites, sessoes e boloes criados.`,
    );
    if (!confirmDelete) {
      event.preventDefault();
    }
  };

  return (
    <form className="admin-action-form admin-delete-form" action={deleteUsersBatchAction} onSubmit={handleSubmit}>
      <input type="hidden" name="userIds" value={userId} />
      <input
        name="reason"
        placeholder="Motivo exclusao"
        required
        minLength={3}
        aria-label="Motivo da exclusao do usuario"
      />
      <button
        className="admin-icon-button danger"
        type="submit"
        title="Excluir usuario"
      >
        <i className="bi bi-trash" aria-hidden="true" />
      </button>
    </form>
  );
}
