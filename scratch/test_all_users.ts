import { prisma } from '../src/lib/prisma';
import { getResultsData } from '../src/lib/player-routes-data';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });
  console.log(`Encontrados ${users.length} usuários.`);

  for (const user of users) {
    try {
      console.log(`Testando resultados para o usuário: ${user.name} (${user.email}, ID: ${user.id})`);
      const data = await getResultsData(user.id, null);
      console.log(`  Sucesso: ${data.matches.length} partidas, ${data.predictions.length} palpites.`);
    } catch (error: any) {
      console.error(`  ERRO para usuário ${user.name}:`, error);
      if (error instanceof Error) {
        console.error(error.stack);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
