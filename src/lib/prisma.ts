// src/lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Detecta se o erro é de conexão/timeout com o banco (ex: Neon hibernando).
 */
function isConnectionError(error: unknown): boolean {
  // Erros conhecidos do Prisma: P1001 = não conseguiu conectar, P1017 = servidor fechou conexão
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1017', 'P2024'].includes(error.code);
  }
  // Erros de inicialização: timeout de connection pool, SSL, etc.
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  // Erros genéricos com mensagem de timeout
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('connection pool') ||
      msg.includes('timed out') ||
      msg.includes('connect timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset')
    );
  }
  return false;
}

/**
 * Executa uma operação no banco com retry automático caso o Neon esteja hibernando.
 * Tenta até `maxAttempts` vezes com espera crescente entre tentativas.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isConnectionError(error) || attempt === maxAttempts) {
        throw error;
      }

      const waitMs = attempt * 1000; // 1s, 2s, 3s
      console.warn(
        `[Prisma] Erro de conexão (tentativa ${attempt}/${maxAttempts}). Aguardando ${waitMs}ms para tentar novamente...`,
        error instanceof Error ? error.message : error,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}
