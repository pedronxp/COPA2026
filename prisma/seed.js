// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed de partidas da Copa do Mundo de 2026...');

  // Limpar dados anteriores (opcional, útil para resetar no desenvolvimento)
  await prisma.prediction.deleteMany({});
  await prisma.match.deleteMany({});
  
  // Como hoje é 10 de junho de 2026 e o torneio começa amanhã, 11 de junho de 2026:
  const matches = [
    {
      homeTeam: 'México',
      awayTeam: 'Nova Zelândia',
      homeFlag: '🇲🇽',
      awayFlag: '🇳🇿',
      kickOff: new Date('2026-06-11T19:00:00-06:00'), // Jogo de abertura na Cidade do México (GMT-6)
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Estados Unidos',
      awayTeam: 'Marrocos',
      homeFlag: '🇺🇸',
      awayFlag: '🇲🇦',
      kickOff: new Date('2026-06-11T18:00:00-07:00'), // Jogo de abertura nos EUA (Los Angeles, GMT-7)
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Canadá',
      awayTeam: 'Argélia',
      homeFlag: '🇨🇦',
      awayFlag: '🇩🇿',
      kickOff: new Date('2026-06-12T20:00:00-04:00'), // Jogo de abertura no Canadá (Toronto, GMT-4)
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Brasil',
      awayTeam: 'Croácia',
      homeFlag: '🇧🇷',
      awayFlag: '🇭🇷',
      kickOff: new Date('2026-06-12T16:00:00-04:00'), // Jogo no MetLife Stadium (Nova York, GMT-4)
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'Argentina',
      awayTeam: 'Arábia Saudita',
      homeFlag: '🇦🇷',
      awayFlag: '🇸🇦',
      kickOff: new Date('2026-06-13T13:00:00-04:00'), // Jogo em Atlanta (GMT-4)
      stage: 'group',
      status: 'scheduled'
    },
    {
      homeTeam: 'França',
      awayTeam: 'Austrália',
      homeFlag: '🇫🇷',
      awayFlag: '🇦🇺',
      kickOff: new Date('2026-06-13T18:00:00-04:00'), // Jogo em Miami (GMT-4)
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

  console.log('Seed de partidas concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao rodar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
