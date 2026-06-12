export const PROFILE_AVATARS = [
  { value: 'CDC', label: 'Copa dos Crias' },
  { value: '\u26bd', label: 'Bola' },
  { value: '\ud83c\udfc6', label: 'Taça' },
  { value: '\ud83e\udd47', label: 'Medalha' },
  { value: '\ud83c\udde7\ud83c\uddf7', label: 'Brasil' },
  { value: '\ud83c\udfdf\ufe0f', label: 'Estádio' },
  { value: '\ud83d\udd25', label: 'Fase boa' },
  { value: '\ud83e\udd85', label: 'Mascote' },
  { value: '\ud83e\udde4', label: 'Camisa' },
  { value: '\ud83c\udfaf', label: 'Pontaria' },
  { value: '\u26a1', label: 'Rápido' },
  { value: '\ud83e\udde0', label: 'Estrategista' },
  { value: '\ud83d\ude80', label: 'Arrancada' },
  { value: '\ud83d\udee1\ufe0f', label: 'Defesa' },
  { value: '\ud83d\udc51', label: 'Líder' },
  { value: '\ud83d\udc9a', label: 'Torcida' },
  { value: '\ud83c\udf0e', label: 'Mundial' },
] as const;

const allowedAvatars = new Set(PROFILE_AVATARS.map((avatar) => avatar.value));

export function parseProfileUpdate(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new Error('Dados de perfil invalidos.');
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const image = typeof body.image === 'string' ? body.image.trim() : '';

  if (name.length < 2 || name.length > 60) {
    throw new Error('O nome deve ter entre 2 e 60 caracteres.');
  }
  if (!allowedAvatars.has(image as (typeof PROFILE_AVATARS)[number]['value'])) {
    throw new Error('Escolha um avatar permitido.');
  }

  return { name, image };
}
