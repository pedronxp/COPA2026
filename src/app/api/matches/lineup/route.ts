// src/app/api/matches/lineup/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSquadForTeam } from '@/lib/squads-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'Parâmetro matchId é obrigatório.' }, { status: 400 });
    }

    // Buscar partida do banco de dados
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { lineup: true }
    });

    if (!match) {
      return NextResponse.json({ error: 'Partida não encontrada.' }, { status: 404 });
    }

    // Se houver lineup cadastrado (oficial)
    if (match.lineup) {
      return NextResponse.json({
        status: 'oficial',
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        formation: {
          home: match.lineup.homeFormation,
          away: match.lineup.awayFormation
        },
        starting: {
          home: JSON.parse(match.lineup.homeStarting),
          away: JSON.parse(match.lineup.awayStarting)
        },
        substitutes: {
          home: JSON.parse(match.lineup.homeSubstitutes),
          away: JSON.parse(match.lineup.awaySubstitutes)
        }
      });
    }

    // Se não houver, vamos gerar a provável
    const homeSquad = getSquadForTeam(match.homeTeam);
    const awaySquad = getSquadForTeam(match.awayTeam);

    return NextResponse.json({
      status: 'provavel',
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      formation: {
        home: homeSquad.formation,
        away: awaySquad.formation
      },
      starting: {
        home: homeSquad.starting,
        away: awaySquad.starting
      },
      substitutes: {
        home: homeSquad.substitutes,
        away: awaySquad.substitutes
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar escalação.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      matchId,
      homeFormation,
      awayFormation,
      homeStarting,
      awayStarting,
      homeSubstitutes,
      awaySubstitutes
    } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'matchId é obrigatório.' }, { status: 400 });
    }

    const lineup = await prisma.matchLineup.upsert({
      where: { matchId },
      update: {
        homeFormation,
        awayFormation,
        homeStarting: typeof homeStarting === 'string' ? homeStarting : JSON.stringify(homeStarting),
        awayStarting: typeof awayStarting === 'string' ? awayStarting : JSON.stringify(awayStarting),
        homeSubstitutes: typeof homeSubstitutes === 'string' ? homeSubstitutes : JSON.stringify(homeSubstitutes),
        awaySubstitutes: typeof awaySubstitutes === 'string' ? awaySubstitutes : JSON.stringify(awaySubstitutes)
      },
      create: {
        matchId,
        homeFormation,
        awayFormation,
        homeStarting: typeof homeStarting === 'string' ? homeStarting : JSON.stringify(homeStarting),
        awayStarting: typeof awayStarting === 'string' ? awayStarting : JSON.stringify(awayStarting),
        homeSubstitutes: typeof homeSubstitutes === 'string' ? homeSubstitutes : JSON.stringify(homeSubstitutes),
        awaySubstitutes: typeof awaySubstitutes === 'string' ? awaySubstitutes : JSON.stringify(awaySubstitutes)
      }
    });

    return NextResponse.json({ success: true, lineup });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao salvar escalação.' }, { status: 500 });
  }
}
