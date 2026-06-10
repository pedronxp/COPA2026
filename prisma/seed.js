// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed de dados do Bolão...');

  // Limpar dados anteriores para o reset
  await prisma.prediction.deleteMany({});
  await prisma.leagueMember.deleteMany({});
  await prisma.league.deleteMany({});
  await prisma.passwordResetRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.match.deleteMany({});

  // 1. Criar Usuários Fundamentais
  console.log('Criando usuários do sistema...');
  const systemUser = await prisma.user.create({
    data: {
      id: 'system',
      name: 'Sistema',
      email: 'sistema@copa.com',
      image: '🤖',
      points: 0,
    }
  });

  const currentUser = await prisma.user.create({
    data: {
      id: 'currentUser',
      name: 'Você (Torcedor)',
      email: 'usuario@copa.com',
      image: '👑',
      points: 0,
    }
  });

  // 2. Criar Bolão Global Oficial
  console.log('Criando Bolão Global...');
  const globalLeague = await prisma.league.create({
    data: {
      id: 'global',
      name: 'Bolão Global da Copa',
      description: 'O bolão oficial da plataforma para todos os torcedores.',
      inviteCode: 'COPA-GLOBAL',
      ownerId: systemUser.id,
      expiresAt: new Date('2026-08-01T00:00:00Z'),
      windowHours: 48,
      maxEdits: 3,
      pointsExact: 5,
      pointsDiff: 3,
      pointsWinner: 2,
      pointsDraw: 2,
    }
  });

  // 3. Adicionar currentUser como membro do bolão global
  await prisma.leagueMember.create({
    data: {
      leagueId: globalLeague.id,
      userId: currentUser.id,
      role: 'member',
      points: 0,
    }
  });

  // 4. Inserir Partidas Iniciais
  console.log('Cadastrando partidas iniciais da Copa...');
  const matches = [
    {
      homeTeam: 'México',
      awayTeam: 'Nova Zelândia',
      homeFlag: '🇲🇽',
      awayFlag: '🇳🇿',
      kickOff: new Date('2026-06-11T19:00:00-06:00'),
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Estados Unidos',
      awayTeam: 'Marrocos',
      homeFlag: '🇺🇸',
      awayFlag: '🇲🇦',
      kickOff: new Date('2026-06-11T18:00:00-07:00'),
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Canadá',
      awayTeam: 'Argélia',
      homeFlag: '🇨🇦',
      awayFlag: '🇩🇿',
      kickOff: new Date('2026-06-12T20:00:00-04:00'),
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Brasil',
      awayTeam: 'Croácia',
      homeFlag: '🇧🇷',
      awayFlag: '🇭🇷',
      kickOff: new Date('2026-06-12T16:00:00-04:00'),
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Argentina',
      awayTeam: 'Arábia Saudita',
      homeFlag: '🇦🇷',
      awayFlag: '🇸🇦',
      kickOff: new Date('2026-06-13T13:00:00-04:00'),
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'França',
      awayTeam: 'Austrália',
      homeFlag: '🇫🇷',
      awayFlag: '🇦🇺',
      kickOff: new Date('2026-06-13T18:00:00-04:00'),
      stage: 'group',
      status: 'scheduled'
    }
  ];

  for (const match of matches) {
    const createdMatch = await prisma.match.create({
      data: match
    });
    console.log(`Partida cadastrada: ${createdMatch.homeTeam} vs ${createdMatch.awayTeam}`);
  }

  console.log('Seed completo de dados do bolão finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao rodar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
