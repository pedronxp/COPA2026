import { prisma } from './src/lib/prisma';
async function main() {
  const leagues = await prisma.league.findMany();
  console.log('LEAGUES:');
  console.log(JSON.stringify(leagues, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
