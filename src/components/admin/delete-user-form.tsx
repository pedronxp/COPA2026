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
      `Tem certeza de que deseja excluir permanentemente o usuário "${userName || 'Usuário'}" (${userEmail})? Esta ação não pode ser desfeita e apagará todos os seus palpites, sessões e bolões criados.`
    );
    if (!confirmDelete) {
      event.preventDefault();
    }
  };

  return (
    <form className="admin-inline-form" action={deleteUsersBatchAction} onSubmit={handleSubmit}>
      <input type="hidden" name="userIds" value={userId} />
      <input
        name="reason"
        placeholder="Motivo exclusão"
        required
        minLength={3}
        style={{ width: '130px' }}
        aria-label="Motivo da exclusão do usuário"
      />
      <button
        className="admin-icon-button danger"
        type="submit"
        title="Excluir usuário"
      >
        <i className="bi bi-trash" aria-hidden="true" />
      </button>
    </form>
  );
}
