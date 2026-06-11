export function withPrismaPoolLimits(
  rawUrl: string,
  connectionLimit?: number,
  poolTimeout?: number,
): string;
export function withPrismaPoolLimits(
  rawUrl: undefined,
  connectionLimit?: number,
  poolTimeout?: number,
): undefined;
export function withPrismaPoolLimits(
  rawUrl: string | undefined,
  connectionLimit?: number,
  poolTimeout?: number,
): string | undefined;
export function withPrismaPoolLimits(
  rawUrl: string | undefined,
  connectionLimit = 3,
  poolTimeout = 20,
): string | undefined {
  if (!rawUrl) return rawUrl;

  const url = new URL(rawUrl);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', String(connectionLimit));
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', String(poolTimeout));
  }
  return url.toString();
}
