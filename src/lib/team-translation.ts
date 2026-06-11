export const teamTranslationMap: Record<string, string> = {
  "Algeria": "Argélia",
  "Argentina": "Argentina",
  "Australia": "Austrália",
  "Austria": "Áustria",
  "Belgium": "Bélgica",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Brazil": "Brasil",
  "Canada": "Canadá",
  "Cape Verde": "Cabo Verde",
  "Colombia": "Colômbia",
  "Croatia": "Croácia",
  "Curaçao": "Curaçao",
  "Czech Republic": "República Tcheca",
  "Democratic Republic of the Congo": "República Democrática do Congo",
  "Ecuador": "Equador",
  "Egypt": "Egito",
  "England": "Inglaterra",
  "France": "França",
  "Germany": "Alemanha",
  "Ghana": "Gana",
  "Haiti": "Haiti",
  "Iran": "Irã",
  "Iraq": "Iraque",
  "Ivory Coast": "Costa do Marfim",
  "Japan": "Japão",
  "Jordan": "Jordânia",
  "Mexico": "México",
  "Morocco": "Marrocos",
  "Netherlands": "Holanda",
  "New Zealand": "Nova Zelândia",
  "Norway": "Noruega",
  "Panama": "Panamá",
  "Paraguay": "Paraguai",
  "Portugal": "Portugal",
  "Qatar": "Catar",
  "Saudi Arabia": "Arábia Saudita",
  "Scotland": "Escócia",
  "Senegal": "Senegal",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "Spain": "Espanha",
  "Sweden": "Suécia",
  "Switzerland": "Suíça",
  "Tunisia": "Tunísia",
  "Turkey": "Turquia",
  "United States": "Estados Unidos",
  "Uruguay": "Uruguai",
  "Uzbekistan": "Uzbequistão"
};

export function translateTeamName(name: string | null | undefined): string {
  if (!name) return "";
  
  // Se for uma correspondência exata no dicionário
  if (teamTranslationMap[name]) {
    return teamTranslationMap[name];
  }
  
  // Tratamento de placeholders
  let translated = name;
  
  // Winner Group X -> Vencedor Grupo X
  translated = translated.replace(/Winner Group ([A-L])/gi, "Vencedor Grupo $1");
  
  // Runner-up Group X -> Segundo colocado Grupo X
  translated = translated.replace(/Runner-up Group ([A-L])/gi, "2º colocado Grupo $1");
  
  // 3rd Group X/Y/Z -> 3º colocado Grupo X/Y/Z
  translated = translated.replace(/3rd Group (.*)/gi, "3º colocado Grupo $1");
  
  // Winner Match X -> Vencedor Jogo X
  translated = translated.replace(/Winner Match (\d+)/gi, "Vencedor Jogo $1");
  
  // Loser Match X -> Perdedor Jogo X
  translated = translated.replace(/Loser Match (\d+)/gi, "Perdedor Jogo $1");

  return translated;
}
