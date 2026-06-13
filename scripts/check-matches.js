const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { NOT: { id: 'system' } },
    take: 5
  });
  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, email: u.email })));
  
  const liveMatch = await prisma.match.findFirst({
    where: { status: 'live' }
  });
  if (liveMatch) {
    console.log("Live Match:", liveMatch);
    const preds = await prisma.prediction.findMany({
      where: { matchId: liveMatch.id }
    });
    console.log("Predictions for live match:", preds);
  } else {
    console.log("No live match found");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
