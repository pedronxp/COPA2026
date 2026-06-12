export const PROFILE_AVATARS = [
  { value: 'CDC', label: 'Copa dos Crias' },
  { value: '⚽', label: 'Bola' },
  { value: '🏆', label: 'Taça' },
  { value: '🏅', label: 'Medalha' },
  { value: '🏟️', label: 'Estádio' },
  { value: '🔥', label: 'Fase boa' },
  { value: '🦅', label: 'Mascote' },
  { value: '🧤', label: 'Luva de goleiro' },
  { value: '🎯', label: 'Pontaria' },
  { value: '⚡', label: 'Rápido' },
  { value: '🧠', label: 'Estrategista' },
  { value: '🚀', label: 'Arrancada' },
  { value: '🛡️', label: 'Defesa' },
  { value: '👑', label: 'Líder' },
  { value: '💚', label: 'Torcida' },
  { value: '🌏', label: 'Mundial' },
  { value: '⏱️', label: 'Cronômetro' },
  { value: '🥅', label: 'Trave' },
  { value: '📣', label: 'Megafone' },
  { value: '🍺', label: 'Cerveja' },
  { value: '🍖', label: 'Churrasco' },
  { value: '💪', label: 'Força' },
  { value: '🎉', label: 'Festa' },
  { value: '🙌', label: 'Comemoração' },
  { value: '🤩', label: 'Estrela' },
  
  // Seleções da Copa & Principais
  { value: '🇧🇷', label: 'Brasil' },
  { value: '🇨🇦', label: 'Canadá' },
  { value: '🇲🇽', label: 'México' },
  { value: '🇺🇸', label: 'Estados Unidos' },
  { value: '🇦🇷', label: 'Argentina' },
  { value: '🇩🇪', label: 'Alemanha' },
  { value: '🇫🇷', label: 'França' },
  { value: '🇮🇹', label: 'Itália' },
  { value: '🇪🇸', label: 'Espanha' },
  { value: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', label: 'Inglaterra' },
  { value: '🇵🇹', label: 'Portugal' },
  { value: '🇳🇱', label: 'Holanda' },
  { value: '🇧🇪', label: 'Bélgica' },
  { value: '🇭🇷', label: 'Croácia' },
  { value: '🇺🇾', label: 'Uruguai' },
  { value: '🇨🇴', label: 'Colômbia' },
  { value: '🇨🇱', label: 'Chile' },
  { value: '🇪🇨', label: 'Equador' },
  { value: '🇵🇪', label: 'Peru' },
  { value: '🇵🇾', label: 'Paraguai' },
  { value: '🇯🇵', label: 'Japão' },
  { value: '🇰🇷', label: 'Coreia do Sul' },
  { value: '🇸🇦', label: 'Arábia Saudita' },
  { value: '🇦🇺', label: 'Austrália' },
  { value: '🇳🇿', label: 'Nova Zelândia' },
  { value: '🇲🇦', label: 'Marrocos' },
  { value: '🇸🇳', label: 'Senegal' },
  { value: '🇨🇲', label: 'Camarões' },
  { value: '🇬🇭', label: 'Gana' },
  { value: '🇳🇬', label: 'Nigéria' },
  { value: '🇪🇬', label: 'Egito' },
  { value: '🇩🇿', label: 'Argélia' },
  { value: '🇿🇦', label: 'África do Sul' },
  { value: '🇨🇷', label: 'Costa Rica' },
  { value: '🇨🇭', label: 'Suíça' },
  { value: '🇩🇰', label: 'Dinamarca' },
  { value: '🇸🇪', label: 'Suécia' },
  { value: '🇳🇴', label: 'Noruega' },
  { value: '🇵🇱', label: 'Polônia' },
  { value: '🇹🇷', label: 'Turquia' },
  { value: '🇺🇦', label: 'Ucrânia' },
] as const;

const allowedAvatars = new Set<string>(PROFILE_AVATARS.map((avatar) => avatar.value));

export function parseProfileUpdate(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new Error('Dados de perfil inválidos.');
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const image = typeof body.image === 'string' ? body.image.trim() : '';

  if (name.length < 2 || name.length > 60) {
    throw new Error('O nome deve ter entre 2 e 60 caracteres.');
  }
  if (!allowedAvatars.has(image)) {
    throw new Error('Escolha um avatar permitido.');
  }

  return { name, image };
}

