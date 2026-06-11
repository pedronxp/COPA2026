export function readStringField(body: unknown, field: string) {
  if (!body || typeof body !== 'object') return '';
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value: string) {
  return value.toLowerCase().trim();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPassword(value: string) {
  return value.length >= 8;
}
