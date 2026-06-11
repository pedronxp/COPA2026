import { NextResponse } from 'next/server';
import { deleteCurrentSession, SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST() {
  await deleteCurrentSession();

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
