// src/lib/auth.ts
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Cria um hash seguro scrypt para uma senha
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  // scrypt key derivation
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica se a senha corresponde ao hash armazenado
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    
    const hash = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    
    // Comparação de tempo constante para evitar side-channel attacks
    return timingSafeEqual(hash, keyBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Gera um token aleatório seguro para sessões ou redefinição de senha
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}
