import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('league owner edit copy', () => {
  it('keeps the confirmation modal and lock state in Brazilian Portuguese', async () => {
    const source = await readFile(new URL('./league-detail.tsx', import.meta.url), 'utf8');

    expect(source).toContain('Salvar alterações do bolão?');
    expect(source).toContain('Confirmar e Salvar');
    expect(source).toContain('Edição de Configurações Liberada');
    expect(source).toContain('Entendendo as Publicações e Ciclos');
  });
});
