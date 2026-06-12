/**
 * Converte emoji de bandeira de país para código ISO de duas letras (ex: "br", "us")
 */
export function getFlagIsoCode(emoji: string): string | null {
  if (!emoji) return null;
  try {
    const codePoints = Array.from(emoji).map((c) => c.codePointAt(0));
    if (
      codePoints.length >= 2 &&
      codePoints[0] !== undefined &&
      codePoints[0] >= 0x1f1e6 &&
      codePoints[0] <= 0x1f1ff &&
      codePoints[1] !== undefined &&
      codePoints[1] >= 0x1f1e6 &&
      codePoints[1] <= 0x1f1ff
    ) {
      const char1 = String.fromCharCode(codePoints[0] - 0x1f1e6 + 65);
      const char2 = String.fromCharCode(codePoints[1] - 0x1f1e6 + 65);
      return (char1 + char2).toLowerCase();
    }
  } catch {
    // Ignora erro
  }
  return null;
}

/**
 * Retorna true se a string for composta apenas por emojis ou caracteres especiais (sem letras/números).
 */
export function isEmoji(str: string): boolean {
  if (!str) return false;
  // Se for "CDC" ou contiver qualquer caractere alfanumérico padrão, não é considerado emoji puro
  return !/[a-zA-Z0-9]/.test(str);
}
