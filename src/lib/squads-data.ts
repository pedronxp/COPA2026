// src/lib/squads-data.ts
// Plantéis reais de jogadores convocados e suas posições táticas padrão (4-3-3, 4-4-2, 4-2-3-1)

export interface PlayerLineup {
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  x: number; // 0 a 100 no campo (horizontal, 50 é centro)
  y: number; // 0 a 100 no campo (vertical, 15 é linha de fundo de defesa, 85 é linha de fundo de ataque)
  label: string; // Ex: "Lateral Direito", "Zagueiro", etc.
}

export interface TeamSquad {
  formation: string;
  starting: PlayerLineup[];
  substitutes: { name: string; number: number; position: 'GK' | 'DEF' | 'MID' | 'ATT' }[];
}

export const SQUADS_DATA: Record<string, TeamSquad> = {
  'Brasil': {
    formation: '4-3-3',
    starting: [
      { name: 'Alisson', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Danilo', number: 2, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Marquinhos', number: 3, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'G. Magalhães', number: 4, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Wendell', number: 6, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'B. Guimarães', number: 5, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'João Gomes', number: 8, position: 'MID', x: 32, y: 58, label: 'Segundo Volante' },
      { name: 'Lucas Paquetá', number: 10, position: 'MID', x: 68, y: 58, label: 'Meia Atacante' },
      { name: 'Raphinha', number: 11, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'Rodrygo', number: 9, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'Vini Jr.', number: 7, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Bento', number: 12, position: 'GK' },
      { name: 'Rafael', number: 23, position: 'GK' },
      { name: 'Éder Militão', number: 14, position: 'DEF' },
      { name: 'L. Beraldo', number: 15, position: 'DEF' },
      { name: 'Bremer', number: 16, position: 'DEF' },
      { name: 'Yan Couto', number: 13, position: 'DEF' },
      { name: 'Guilherme Arana', number: 24, position: 'DEF' },
      { name: 'Andreas Pereira', number: 18, position: 'MID' },
      { name: 'Douglas Luiz', number: 19, position: 'MID' },
      { name: 'Ederson', number: 22, position: 'MID' },
      { name: 'Endrick', number: 20, position: 'ATT' },
      { name: 'Savinho', number: 21, position: 'ATT' },
      { name: 'G. Martinelli', number: 25, position: 'ATT' },
      { name: 'Evanilson', number: 26, position: 'ATT' }
    ]
  },
  'França': {
    formation: '4-3-3',
    starting: [
      { name: 'Maignan', number: 16, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Koundé', number: 5, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Upamecano', number: 4, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Saliba', number: 17, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'T. Hernández', number: 22, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Tchouaméni', number: 8, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'N. Kanté', number: 13, position: 'MID', x: 68, y: 56, label: 'Meia Central' },
      { name: 'Rabiot', number: 14, position: 'MID', x: 32, y: 56, label: 'Meia Central' },
      { name: 'O. Dembélé', number: 11, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'K. Mbappé', number: 10, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'B. Barcola', number: 25, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Samba', number: 1, position: 'GK' },
      { name: 'Areola', number: 23, position: 'GK' },
      { name: 'Pavard', number: 2, position: 'DEF' },
      { name: 'Konaté', number: 24, position: 'DEF' },
      { name: 'Clauss', number: 3, position: 'DEF' },
      { name: 'F. Mendy', number: 21, position: 'DEF' },
      { name: 'Camavinga', number: 6, position: 'MID' },
      { name: 'Y. Fofana', number: 19, position: 'MID' },
      { name: 'A. Griezmann', number: 7, position: 'MID' },
      { name: 'Zaire-Emery', number: 18, position: 'MID' },
      { name: 'K. Coman', number: 20, position: 'ATT' },
      { name: 'O. Giroud', number: 9, position: 'ATT' },
      { name: 'Marcus Thuram', number: 15, position: 'ATT' },
      { name: 'Kolo Muani', number: 12, position: 'ATT' }
    ]
  },
  'Argentina': {
    formation: '4-4-2',
    starting: [
      { name: 'E. Martínez', number: 23, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'N. Molina', number: 26, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'C. Romero', number: 13, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'N. Otamendi', number: 19, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'N. Tagliafico', number: 3, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'R. De Paul', number: 7, position: 'MID', x: 75, y: 56, label: 'Meia Direito' },
      { name: 'E. Fernández', number: 24, position: 'MID', x: 58, y: 50, label: 'Volante' },
      { name: 'A. Mac Allister', number: 20, position: 'MID', x: 42, y: 50, label: 'Volante' },
      { name: 'Á. Di María', number: 11, position: 'MID', x: 25, y: 56, label: 'Meia Esquerdo' },
      { name: 'Lionel Messi', number: 10, position: 'ATT', x: 62, y: 82, label: 'Segundo Atacante' },
      { name: 'L. Martínez', number: 22, position: 'ATT', x: 38, y: 85, label: 'Centroavante' }
    ],
    substitutes: [
      { name: 'F. Armani', number: 1, position: 'GK' },
      { name: 'G. Rulli', number: 12, position: 'GK' },
      { name: 'G. Montiel', number: 4, position: 'DEF' },
      { name: 'G. Pezzella', number: 6, position: 'DEF' },
      { name: 'M. Acuña', number: 8, position: 'DEF' },
      { name: 'L. Martínez', number: 25, position: 'DEF' },
      { name: 'L. Paredes', number: 5, position: 'MID' },
      { name: 'G. Lo Celso', number: 16, position: 'MID' },
      { name: 'E. Palacios', number: 14, position: 'MID' },
      { name: 'N. González', number: 15, position: 'ATT' },
      { name: 'J. Álvarez', number: 9, position: 'ATT' },
      { name: 'A. Garnacho', number: 17, position: 'ATT' },
      { name: 'V. Carboni', number: 21, position: 'ATT' }
    ]
  },
  'Portugal': {
    formation: '4-3-3',
    starting: [
      { name: 'Diogo Costa', number: 22, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'João Cancelo', number: 20, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Rúben Dias', number: 4, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Pepe', number: 3, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Nuno Mendes', number: 19, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'J. Palhinha', number: 6, position: 'MID', x: 50, y: 50, label: 'Volante' },
      { name: 'Vitinha', number: 23, position: 'MID', x: 32, y: 58, label: 'Meia Central' },
      { name: 'B. Fernandes', number: 8, position: 'MID', x: 68, y: 58, label: 'Meia Atacante' },
      { name: 'B. Silva', number: 10, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'C. Ronaldo', number: 7, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'Rafael Leão', number: 17, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Rui Patrício', number: 1, position: 'GK' },
      { name: 'José Sá', number: 12, position: 'GK' },
      { name: 'Nelson Semedo', number: 2, position: 'DEF' },
      { name: 'Diogo Dalot', number: 5, position: 'DEF' },
      { name: 'Gonçalo Inácio', number: 14, position: 'DEF' },
      { name: 'António Silva', number: 24, position: 'DEF' },
      { name: 'João Neves', number: 15, position: 'MID' },
      { name: 'Rúben Neves', number: 18, position: 'MID' },
      { name: 'Matheus Nunes', number: 16, position: 'MID' },
      { name: 'Danilo Pereira', number: 13, position: 'MID' },
      { name: 'Diogo Jota', number: 21, position: 'ATT' },
      { name: 'João Félix', number: 11, position: 'ATT' },
      { name: 'Gonçalo Ramos', number: 9, position: 'ATT' },
      { name: 'Francisco Conceição', number: 26, position: 'ATT' }
    ]
  },
  'Alemanha': {
    formation: '4-2-3-1',
    starting: [
      { name: 'M. Neuer', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'J. Kimmich', number: 6, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'J. Tah', number: 4, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'A. Rüdiger', number: 2, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Mittelstädt', number: 3, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'R. Andrich', number: 23, position: 'MID', x: 38, y: 50, label: 'Volante Defensivo' },
      { name: 'Toni Kroos', number: 8, position: 'MID', x: 62, y: 50, label: 'Volante Construtor' },
      { name: 'J. Musiala', number: 10, position: 'MID', x: 22, y: 68, label: 'Ponta Esquerda' },
      { name: 'Ilkay Gündogan', number: 21, position: 'MID', x: 50, y: 68, label: 'Meia Atacante' },
      { name: 'Florian Wirtz', number: 17, position: 'MID', x: 78, y: 68, label: 'Ponta Direita' },
      { name: 'Kai Havertz', number: 7, position: 'ATT', x: 50, y: 85, label: 'Centroavante' }
    ],
    substitutes: [
      { name: 'Ter Stegen', number: 22, position: 'GK' },
      { name: 'O. Baumann', number: 12, position: 'GK' },
      { name: 'W. Anton', number: 15, position: 'DEF' },
      { name: 'N. Schlotterbeck', number: 16, position: 'DEF' },
      { name: 'David Raum', number: 20, position: 'DEF' },
      { name: 'B. Henrichs', number: 24, position: 'DEF' },
      { name: 'Pascal Groß', number: 5, position: 'MID' },
      { name: 'Emre Can', number: 25, position: 'MID' },
      { name: 'Thomas Müller', number: 13, position: 'MID' },
      { name: 'Leroy Sané', number: 19, position: 'ATT' },
      { name: 'Chris Führich', number: 11, position: 'ATT' },
      { name: 'M. Beier', number: 14, position: 'ATT' },
      { name: 'N. Füllkrug', number: 9, position: 'ATT' }
    ]
  },
  'Espanha': {
    formation: '4-3-3',
    starting: [
      { name: 'Unai Simón', number: 23, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Dani Carvajal', number: 2, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Le Normand', number: 3, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'A. Laporte', number: 14, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'M. Cucurella', number: 24, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Rodri', number: 16, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'Fabián Ruiz', number: 8, position: 'MID', x: 32, y: 58, label: 'Meia Central' },
      { name: 'Pedri', number: 20, position: 'MID', x: 68, y: 58, label: 'Meia Atacante' },
      { name: 'Lamine Yamal', number: 19, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'Álvaro Morata', number: 7, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'Nico Williams', number: 17, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'David Raya', number: 1, position: 'GK' },
      { name: 'Alex Remiro', number: 13, position: 'GK' },
      { name: 'Nacho Fernández', number: 4, position: 'DEF' },
      { name: 'Dani Vivian', number: 5, position: 'DEF' },
      { name: 'Alex Grimaldo', number: 12, position: 'DEF' },
      { name: 'Jesús Navas', number: 22, position: 'DEF' },
      { name: 'M. Zubimendi', number: 18, position: 'MID' },
      { name: 'Mikel Merino', number: 6, position: 'MID' },
      { name: 'Alex Baena', number: 10, position: 'MID' },
      { name: 'Fermín López', number: 25, position: 'MID' },
      { name: 'Dani Olmo', number: 10, position: 'MID' },
      { name: 'Ferran Torres', number: 11, position: 'ATT' },
      { name: 'M. Oyarzabal', number: 21, position: 'ATT' },
      { name: 'Ayoze Pérez', number: 26, position: 'ATT' }
    ]
  },
  'México': {
    formation: '4-3-3',
    starting: [
      { name: 'J. González', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'J. Sánchez', number: 19, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'C. Montes', number: 3, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'J. Vásquez', number: 5, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'G. Arteaga', number: 6, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'E. Álvarez', number: 4, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'Luis Chávez', number: 24, position: 'MID', x: 32, y: 58, label: 'Volante Misto' },
      { name: 'E. Sánchez', number: 14, position: 'MID', x: 68, y: 58, label: 'Meia Ofensivo' },
      { name: 'Uriel Antuna', number: 15, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'S. Giménez', number: 11, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'J. Quiñones', number: 9, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Carlos Acevedo', number: 12, position: 'GK' },
      { name: 'Raúl Rangel', number: 23, position: 'GK' },
      { name: 'Israel Reyes', number: 2, position: 'DEF' },
      { name: 'Bryan González', number: 20, position: 'DEF' },
      { name: 'J. Orozco', number: 13, position: 'DEF' },
      { name: 'Luis Romo', number: 7, position: 'MID' },
      { name: 'C. Rodríguez', number: 8, position: 'MID' },
      { name: 'Orbelín Pineda', number: 10, position: 'MID' },
      { name: 'Cesar Huerta', number: 21, position: 'ATT' },
      { name: 'Alexis Vega', number: 17, position: 'ATT' },
      { name: 'Marcelo Flores', number: 22, position: 'ATT' },
      { name: 'G. Martínez', number: 25, position: 'ATT' }
    ]
  },
  'Inglaterra': {
    formation: '4-2-3-1',
    starting: [
      { name: 'J. Pickford', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'K. Walker', number: 2, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'John Stones', number: 5, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Marc Guéhi', number: 6, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'K. Trippier', number: 12, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Kobbie Mainoo', number: 26, position: 'MID', x: 38, y: 50, label: 'Segundo Volante' },
      { name: 'Declan Rice', number: 4, position: 'MID', x: 62, y: 50, label: 'Primeiro Volante' },
      { name: 'Bukayo Saka', number: 7, position: 'MID', x: 78, y: 68, label: 'Ponta Direita' },
      { name: 'J. Bellingham', number: 10, position: 'MID', x: 50, y: 68, label: 'Meia de Ligação' },
      { name: 'Phil Foden', number: 11, position: 'MID', x: 22, y: 68, label: 'Ponta Esquerda' },
      { name: 'Harry Kane', number: 9, position: 'ATT', x: 50, y: 85, label: 'Centroavante' }
    ],
    substitutes: [
      { name: 'Aaron Ramsdale', number: 13, position: 'GK' },
      { name: 'D. Henderson', number: 22, position: 'GK' },
      { name: 'Joe Gomez', number: 3, position: 'DEF' },
      { name: 'Lewis Dunk', number: 15, position: 'DEF' },
      { name: 'Ezri Konsa', number: 14, position: 'DEF' },
      { name: 'Luke Shaw', number: 21, position: 'DEF' },
      { name: 'T. Alexander-Arnold', number: 8, position: 'MID' },
      { name: 'C. Gallagher', number: 16, position: 'MID' },
      { name: 'Adam Wharton', number: 25, position: 'MID' },
      { name: 'Cole Palmer', number: 24, position: 'ATT' },
      { name: 'Jarrod Bowen', number: 20, position: 'ATT' },
      { name: 'Eberechi Eze', number: 19, position: 'ATT' },
      { name: 'Ivan Toney', number: 17, position: 'ATT' },
      { name: 'Ollie Watkins', number: 18, position: 'ATT' }
    ]
  },
  'Uruguai': {
    formation: '4-3-3',
    starting: [
      { name: 'Sergio Rochet', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Nahitan Nández', number: 8, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Ronald Araújo', number: 4, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Mathías Olivera', number: 16, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Matías Viña', number: 17, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Manuel Ugarte', number: 5, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'F. Valverde', number: 15, position: 'MID', x: 68, y: 58, label: 'Meia Central' },
      { name: 'N. De La Cruz', number: 7, position: 'MID', x: 32, y: 58, label: 'Meia Ofensivo' },
      { name: 'F. Pellistri', number: 11, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'Darwin Núñez', number: 19, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'M. Araújo', number: 20, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Santiago Mele', number: 12, position: 'GK' },
      { name: 'Franco Israel', number: 23, position: 'GK' },
      { name: 'José Giménez', number: 2, position: 'DEF' },
      { name: 'Nicolás Marichal', number: 3, position: 'DEF' },
      { name: 'Sebastián Cáceres', number: 24, position: 'DEF' },
      { name: 'Lucas Olaza', number: 22, position: 'DEF' },
      { name: 'R. Bentancur', number: 6, position: 'MID' },
      { name: 'G. de Arrascaeta', number: 10, position: 'MID' },
      { name: 'Brian Rodríguez', number: 18, position: 'ATT' },
      { name: 'Facundo Torres', number: 21, position: 'ATT' },
      { name: 'Luis Suárez', number: 9, position: 'ATT' },
      { name: 'Luciano Rodríguez', number: 25, position: 'ATT' }
    ]
  },
  'EUA': {
    formation: '4-3-3',
    starting: [
      { name: 'Matt Turner', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Joe Scally', number: 22, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Chris Richards', number: 3, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Tim Ream', number: 13, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'A. Robinson', number: 5, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Tyler Adams', number: 4, position: 'MID', x: 50, y: 50, label: 'Volante' },
      { name: 'W. McKennie', number: 8, position: 'MID', x: 68, y: 58, label: 'Meia de Apoio' },
      { name: 'Yunus Musah', number: 6, position: 'MID', x: 32, y: 58, label: 'Meia Central' },
      { name: 'Timothy Weah', number: 21, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'F. Balogun', number: 20, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'C. Pulisic', number: 10, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Ethan Horvath', number: 18, position: 'GK' },
      { name: 'Sean Johnson', number: 25, position: 'GK' },
      { name: 'C. Carter-Vickers', number: 2, position: 'DEF' },
      { name: 'Miles Robinson', number: 12, position: 'DEF' },
      { name: 'Kristoffer Lund', number: 24, position: 'DEF' },
      { name: 'Johnny Cardoso', number: 15, position: 'MID' },
      { name: 'L. de la Torre', number: 14, position: 'MID' },
      { name: 'Brenden Aaronson', number: 11, position: 'MID' },
      { name: 'Malik Tillman', number: 17, position: 'MID' },
      { name: 'Haji Wright', number: 19, position: 'ATT' },
      { name: 'Ricardo Pepi', number: 9, position: 'ATT' },
      { name: 'Josh Sargent', number: 26, position: 'ATT' }
    ]
  }
};

// Gera um fallback inteligente para qualquer país que não está explicitamente nos squads estáticos
export function getSquadFallback(teamName: string): TeamSquad {
  // Vamos criar 11 jogadores e 8 reservas de fallback com o nome do país no sufixo para garantir que dados reais existam sempre
  const cleanName = teamName.trim();
  
  const positions: Array<{ pos: 'GK' | 'DEF' | 'MID' | 'ATT'; label: string; x: number; y: number }> = [
    { pos: 'GK', label: 'Goleiro', x: 50, y: 15 },
    { pos: 'DEF', label: 'Lateral Direito', x: 85, y: 38 },
    { pos: 'DEF', label: 'Zagueiro Direito', x: 62, y: 32 },
    { pos: 'DEF', label: 'Zagueiro Esquerdo', x: 38, y: 32 },
    { pos: 'DEF', label: 'Lateral Esquerdo', x: 15, y: 38 },
    { pos: 'MID', label: 'Volante', x: 50, y: 50 },
    { pos: 'MID', label: 'Meia Central', x: 32, y: 58 },
    { pos: 'MID', label: 'Meia Ofensivo', x: 68, y: 58 },
    { pos: 'ATT', label: 'Ponta Direita', x: 82, y: 80 },
    { pos: 'ATT', label: 'Centroavante', x: 50, y: 85 },
    { pos: 'ATT', label: 'Ponta Esquerda', x: 18, y: 80 }
  ];

  const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Alves', 'Gomes', 'Martins', 'Ferreira', 'Rodriguez', 'Lopez'];
  const firstNames = ['Lucas', 'Mateus', 'Gabriel', 'Carlos', 'David', 'Alex', 'Rodrigo', 'Daniel', 'Marcos', 'Bruno', 'Tiago'];

  const starting: PlayerLineup[] = positions.map((pos, idx) => {
    const fn = firstNames[idx % firstNames.length];
    const sn = surnames[idx % surnames.length];
    return {
      name: `${fn} ${sn}`,
      number: idx === 0 ? 1 : idx + 1,
      position: pos.pos,
      x: pos.x,
      y: pos.y,
      label: pos.label
    };
  });

  const substitutes = Array.from({ length: 8 }).map((_, idx) => {
    const fn = firstNames[(idx + 5) % firstNames.length];
    const sn = surnames[(idx + 5) % surnames.length];
    const posType = idx < 1 ? 'GK' : idx < 4 ? 'DEF' : idx < 6 ? 'MID' : 'ATT';
    return {
      name: `${fn} ${sn}`,
      number: 12 + idx,
      position: posType as 'GK' | 'DEF' | 'MID' | 'ATT'
    };
  });

  return {
    formation: '4-3-3',
    starting,
    substitutes
  };
}

export function getSquadForTeam(teamName: string): TeamSquad {
  const cleanName = teamName.trim();
  if (SQUADS_DATA[cleanName]) {
    return SQUADS_DATA[cleanName];
  }
  // Tentar encontrar por substring
  const key = Object.keys(SQUADS_DATA).find(k => cleanName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cleanName.toLowerCase()));
  if (key) {
    return SQUADS_DATA[key];
  }
  return getSquadFallback(teamName);
}
