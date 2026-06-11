import { NextResponse } from 'next/server';
import { LeagueValidationError } from '@/lib/league-domain';
import { LeagueServiceError } from '@/lib/league-service';

export async function readJsonObject(request: Request, allowEmpty = false) {
  const text = await request.text();
  if (allowEmpty && !text.trim()) return {};
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LeagueServiceError(
      'O corpo da requisicao deve ser um objeto JSON.',
      400,
      'INVALID_BODY',
    );
  }
  return value as Record<string, unknown>;
}

export function leagueErrorResponse(error: unknown, fallback: string) {
  if (error instanceof LeagueServiceError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        field: error.field,
      },
      { status: error.status },
    );
  }
  if (error instanceof LeagueValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'VALIDATION_ERROR',
        field: error.field,
      },
      { status: 400 },
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: 'JSON invalido.', code: 'INVALID_JSON' },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: fallback, code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}
