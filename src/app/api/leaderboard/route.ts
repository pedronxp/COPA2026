// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/matches-service';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
