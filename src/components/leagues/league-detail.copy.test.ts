import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('league owner edit copy', () => {
  it('keeps the confirmation modal and lock state in Brazilian Portuguese', async () => {
    const source = await readFile(new URL('./league-detail.tsx', import.meta.url), 'utf8');

    expect(source).toContain('Usar a edição única do bolão?');
    expect(source).toContain('Salvar edição única');
    expect(source).toContain('Edição do dono bloqueada');
    expect(source).toContain('Regras competitivas travadas');
  });
});
