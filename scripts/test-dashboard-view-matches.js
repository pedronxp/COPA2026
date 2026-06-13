const { getDashboardData } = require('../src/lib/player-routes-data');
async function main() {
  const userId = 'bb377f3a-f3b2-4f81-bfad-608e40c39b15';
  const data = await getDashboardData(userId, 'global');
  console.log("Active League ID:", data.leagueContext.activeLeague.id);
  console.log("Total matches:", data.matches.length);
  const live = data.matches.filter(m => m.status === 'live');
  console.log("Live matches in data:", live);
}
main().catch(console.error);
