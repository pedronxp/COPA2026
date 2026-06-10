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
  },
  'Croácia': {
    formation: '4-3-3',
    starting: [
      { name: 'D. Livaković', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'J. Stanišić', number: 2, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'J. Šutalo', number: 6, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'J. Gvardiol', number: 4, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Borna Sosa', number: 3, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'M. Kovačić', number: 8, position: 'MID', x: 50, y: 50, label: 'Volante Defensivo' },
      { name: 'Luka Modrić', number: 10, position: 'MID', x: 68, y: 58, label: 'Meia Atacante Direito' },
      { name: 'M. Pašalić', number: 15, position: 'MID', x: 32, y: 58, label: 'Meia Atacante Esquerdo' },
      { name: 'L. Majer', number: 7, position: 'ATT', x: 82, y: 80, label: 'Ponta Direito' },
      { name: 'A. Kramarić', number: 9, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'Ivan Perišić', number: 14, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'N. Labrović', number: 12, position: 'GK' },
      { name: 'M. Pongračić', number: 5, position: 'DEF' },
      { name: 'Martin Erlić', number: 19, position: 'DEF' },
      { name: 'Domagoj Vida', number: 21, position: 'DEF' },
      { name: 'J. Juranović', number: 22, position: 'DEF' },
      { name: 'M. Brozović', number: 11, position: 'MID' },
      { name: 'Nikola Vlašić', number: 13, position: 'MID' },
      { name: 'Luka Sučić', number: 25, position: 'MID' },
      { name: 'Ante Budimir', number: 16, position: 'ATT' },
      { name: 'Bruno Petković', number: 17, position: 'ATT' },
      { name: 'Marko Pjaca', number: 20, position: 'ATT' }
    ]
  },
  'Nova Zelândia': {
    formation: '4-3-3',
    starting: [
      { name: 'S. Marinovic', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Tim Payne', number: 2, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'M. Boxall', number: 4, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Tommy Smith', number: 6, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Libby Cacace', number: 3, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Joe Bell', number: 8, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'M. Stamenic', number: 10, position: 'MID', x: 68, y: 58, label: 'Meia Central' },
      { name: 'Clayton Lewis', number: 14, position: 'MID', x: 32, y: 58, label: 'Meia Central' },
      { name: 'K. Barbarouses', number: 7, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'Chris Wood', number: 9, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'Elijah Just', number: 11, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Oliver Sail', number: 12, position: 'GK' },
      { name: 'Nando Pijnaker', number: 5, position: 'DEF' },
      { name: 'Tyler Bindon', number: 15, position: 'DEF' },
      { name: 'Storm Roux', number: 16, position: 'DEF' },
      { name: 'M. Garbett', number: 17, position: 'MID' },
      { name: 'Sarpreet Singh', number: 18, position: 'MID' },
      { name: 'Ben Waine', number: 19, position: 'ATT' },
      { name: 'Max Mata', number: 20, position: 'ATT' }
    ]
  },
  'Marrocos': {
    formation: '4-3-3',
    starting: [
      { name: 'Yassine Bounou', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Achraf Hakimi', number: 2, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Nayef Aguerd', number: 5, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Romain Saïss', number: 6, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'N. Mazraoui', number: 3, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Sofyan Amrabat', number: 4, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'Azzedine Ounahi', number: 8, position: 'MID', x: 68, y: 58, label: 'Meia Central' },
      { name: 'B. El Khannouss', number: 10, position: 'MID', x: 32, y: 58, label: 'Meia Central' },
      { name: 'Hakim Ziyech', number: 7, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'Y. En-Nesyri', number: 19, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'Amine Adli', number: 21, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'M. Mohamedi', number: 12, position: 'GK' },
      { name: 'Abdel Abqar', number: 13, position: 'DEF' },
      { name: 'Achraf Dari', number: 15, position: 'DEF' },
      { name: 'Y. Attiyat Allah', number: 25, position: 'DEF' },
      { name: 'Amir Richardson', number: 16, position: 'MID' },
      { name: 'Ismael Saibari', number: 17, position: 'MID' },
      { name: 'Brahim Díaz', number: 10, position: 'ATT' },
      { name: 'Soufiane Rahimi', number: 9, position: 'ATT' },
      { name: 'Ayoub El Kaabi', number: 20, position: 'ATT' }
    ]
  },
  'Canadá': {
    formation: '4-4-2',
    starting: [
      { name: 'Maxime Crépeau', number: 16, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'A. Johnston', number: 2, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Moïse Bombito', number: 15, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'D. Cornelius', number: 13, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Alphonso Davies', number: 19, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Tajon Buchanan', number: 11, position: 'MID', x: 75, y: 56, label: 'Meia Direito' },
      { name: 'S. Eustáquio', number: 7, position: 'MID', x: 58, y: 50, label: 'Volante' },
      { name: 'Ismaël Koné', number: 8, position: 'MID', x: 42, y: 50, label: 'Volante' },
      { name: 'Liam Millar', number: 14, position: 'MID', x: 25, y: 56, label: 'Meia Esquerdo' },
      { name: 'Jonathan David', number: 10, position: 'ATT', x: 62, y: 82, label: 'Segundo Atacante' },
      { name: 'Cyle Larin', number: 9, position: 'ATT', x: 38, y: 85, label: 'Centroavante' }
    ],
    substitutes: [
      { name: 'D. St. Clair', number: 1, position: 'GK' },
      { name: 'Kamal Miller', number: 3, position: 'DEF' },
      { name: 'Joel Waterman', number: 4, position: 'DEF' },
      { name: 'Richie Laryea', number: 22, position: 'DEF' },
      { name: 'Samuel Piette', number: 6, position: 'MID' },
      { name: 'M. Choinière', number: 21, position: 'MID' },
      { name: 'Jonathan Osorio', number: 21, position: 'MID' },
      { name: 'J. Shaffelburg', number: 12, position: 'ATT' },
      { name: 'Tani Oluwaseyi', number: 19, position: 'ATT' }
    ]
  },
  'Argélia': {
    formation: '4-3-3',
    starting: [
      { name: 'Anthony Mandrea', number: 16, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Youcef Atal', number: 20, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Aïssa Mandi', number: 2, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'R. Bensebaini', number: 21, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Rayan Aït-Nouri', number: 3, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Nabil Bentaleb', number: 6, position: 'MID', x: 50, y: 50, label: 'Primeiro Volante' },
      { name: 'Ismaël Bennacer', number: 22, position: 'MID', x: 32, y: 58, label: 'Volante Misto' },
      { name: 'Houssem Aouar', number: 11, position: 'MID', x: 68, y: 58, label: 'Meia Ofensivo' },
      { name: 'Riyad Mahrez', number: 7, position: 'ATT', x: 82, y: 80, label: 'Ponta Direita' },
      { name: 'B. Bounedjah', number: 9, position: 'ATT', x: 50, y: 85, label: 'Centroavante' },
      { name: 'Farès Chaïbi', number: 10, position: 'ATT', x: 18, y: 80, label: 'Ponta Esquerda' }
    ],
    substitutes: [
      { name: 'Moustapha Zeghba', number: 1, position: 'GK' },
      { name: 'Kevin Guitoun', number: 4, position: 'DEF' },
      { name: 'Mohamed Tougai', number: 5, position: 'DEF' },
      { name: 'Yasser Larouci', number: 15, position: 'DEF' },
      { name: 'Ramiz Zerrouki', number: 19, position: 'MID' },
      { name: 'Hicham Boudaoui', number: 14, position: 'MID' },
      { name: 'Amine Gouiri', number: 12, position: 'ATT' },
      { name: 'Islam Slimani', number: 13, position: 'ATT' },
      { name: 'Adam Ounas', number: 18, position: 'ATT' }
    ]
  },
  'Arábia Saudita': {
    formation: '4-2-3-1',
    starting: [
      { name: 'M. Al-Owais', number: 21, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'Saud Abdulhamid', number: 12, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Hassan Tambakti', number: 4, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Ali Al-Bulaihi', number: 5, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Y. Al-Shahrani', number: 13, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Abdullah Otayf', number: 14, position: 'MID', x: 38, y: 50, label: 'Volante Defensivo' },
      { name: 'Mohamed Kanno', number: 23, position: 'MID', x: 62, y: 50, label: 'Volante Construtor' },
      { name: 'F. Al-Buraikan', number: 9, position: 'MID', x: 22, y: 68, label: 'Ponta Esquerda' },
      { name: 'Salman Al-Faraj', number: 7, position: 'MID', x: 50, y: 68, label: 'Meia Atacante' },
      { name: 'Salem Al-Dawsari', number: 10, position: 'MID', x: 78, y: 68, label: 'Ponta Direita' },
      { name: 'Saleh Al-Shehri', number: 11, position: 'ATT', x: 50, y: 85, label: 'Centroavante' }
    ],
    substitutes: [
      { name: 'M. Al-Rubaie', number: 1, position: 'GK' },
      { name: 'Abdulelah Al-Amri', number: 5, position: 'DEF' },
      { name: 'Sultan Al-Ghannam', number: 2, position: 'DEF' },
      { name: 'M. Al-Breik', number: 6, position: 'DEF' },
      { name: 'Abdulelah Al-Malki', number: 8, position: 'MID' },
      { name: 'Nasser Al-Dawsari', number: 16, position: 'MID' },
      { name: 'Sami Al-Najei', number: 18, position: 'MID' },
      { name: 'A. Ghareeb', number: 19, position: 'ATT' },
      { name: 'Hattan Bahebri', number: 20, position: 'ATT' }
    ]
  },
  'Austrália': {
    formation: '4-2-3-1',
    starting: [
      { name: 'Mathew Ryan', number: 1, position: 'GK', x: 50, y: 15, label: 'Goleiro' },
      { name: 'N. Atkinson', number: 3, position: 'DEF', x: 85, y: 38, label: 'Lateral Direito' },
      { name: 'Harry Souttar', number: 19, position: 'DEF', x: 62, y: 32, label: 'Zagueiro Direito' },
      { name: 'Kye Rowles', number: 4, position: 'DEF', x: 38, y: 32, label: 'Zagueiro Esquerdo' },
      { name: 'Aziz Behich', number: 16, position: 'DEF', x: 15, y: 38, label: 'Lateral Esquerdo' },
      { name: 'Keanu Baccus', number: 22, position: 'MID', x: 38, y: 50, label: 'Volante Defensivo' },
      { name: 'Jackson Irvine', number: 22, position: 'MID', x: 62, y: 50, label: 'Volante Construtor' },
      { name: 'Martin Boyle', number: 6, position: 'MID', x: 22, y: 68, label: 'Ponta Esquerda' },
      { name: 'Connor Metcalfe', number: 8, position: 'MID', x: 50, y: 68, label: 'Meia Atacante' },
      { name: 'Craig Goodwin', number: 23, position: 'MID', x: 78, y: 68, label: 'Ponta Direita' },
      { name: 'Mitchell Duke', number: 15, position: 'ATT', x: 50, y: 85, label: 'Centroavante' }
    ],
    substitutes: [
      { name: 'Joe Gauci', number: 12, position: 'GK' },
      { name: 'Gethin Jones', number: 2, position: 'DEF' },
      { name: 'Thomas Deng', number: 15, position: 'DEF' },
      { name: 'Jordan Bos', number: 5, position: 'DEF' },
      { name: 'Aiden O\'Neill', number: 13, position: 'MID' },
      { name: 'Riley McGree', number: 14, position: 'MID' },
      { name: 'Kusini Yengi', number: 11, position: 'ATT' },
      { name: 'Bruno Fornaroli', number: 9, position: 'ATT' },
      { name: 'Marco Tilio', number: 17, position: 'ATT' }
    ]
  }
};

// Gera um fallback inteligente para qualquer país que não está nos convocados reais
export function getSquadFallback(teamName: string): TeamSquad {
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

  // Pool de nomes e sobrenomes de repercussão internacional para um visual autêntico de Copa
  const surnames = ['Smith', 'Jones', 'Müller', 'Kane', 'Hernández', 'Silva', 'García', 'Williams', 'Davies', 'Martínez', 'Ali', 'Kim', 'Mbappé', 'Rossi', 'Santos', 'Okafor'];
  const firstNames = ['Thomas', 'Daniel', 'David', 'James', 'Carlos', 'Lucas', 'Alex', 'Pierre', 'Mohamed', 'Hans', 'Brahim', 'Marco', 'Robert', 'Koji', 'Arthur', 'Diego'];

  const starting: PlayerLineup[] = positions.map((pos, idx) => {
    const fn = firstNames[(idx + cleanName.charCodeAt(0)) % firstNames.length];
    const sn = surnames[(idx + cleanName.length) % surnames.length];
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
    const fn = firstNames[(idx + 13 + cleanName.charCodeAt(0)) % firstNames.length];
    const sn = surnames[(idx + 7 + cleanName.length) % surnames.length];
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
  
  // Normalizar nomes comuns para bater com SQUADS_DATA
  let mappedName = cleanName;
  if (cleanName.toLowerCase() === 'estados unidos' || cleanName.toLowerCase() === 'usa' || cleanName.toLowerCase() === 'united states') {
    mappedName = 'EUA';
  }
  
  if (SQUADS_DATA[mappedName]) {
    return SQUADS_DATA[mappedName];
  }
  
  // Tentar encontrar por substring
  const key = Object.keys(SQUADS_DATA).find(k => 
    mappedName.toLowerCase().includes(k.toLowerCase()) || 
    k.toLowerCase().includes(mappedName.toLowerCase())
  );
  if (key) {
    return SQUADS_DATA[key];
  }
  
  return getSquadFallback(teamName);
}
