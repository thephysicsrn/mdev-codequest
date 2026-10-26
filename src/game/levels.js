// ==========================================================================
// GAME LEVELS DATA - MDEV CODEQUEST (BILINGUAL: PT-BR & EN)
// Fases estruturadas com suporte a código em Português e em Inglês
// ==========================================================================

export const LEVELS = [
  // ==================== MUNDO 1 ====================
  {
    id: 1,
    world: 1,
    worldName: 'Mundo 1: Masmorra dos Primeiros Passos',
    title: 'Fase 1: O Despertar do Herói',
    subtitle: 'Comande seu herói usando comandos de movimento e colete o cristal!',
    titleEn: 'Level 1: The Hero Awakening',
    subtitleEn: 'Command your hero to walk and collect the glowing crystal!',
    pedagogy: 'Algoritmos e Sequência Lógica',
    hint: 'Use heroi.andar_direita() duas vezes até o cristal, heroi.coletar() e depois mais um passo até o portal!',
    hintEn: 'Use hero.move_right() twice to reach the crystal, hero.collect() and then one more step into the portal!',
    maxLinesFor3Stars: 4,
    gridSize: { cols: 5, rows: 3 },
    startPos: { x: 0, y: 1 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W'],
      ['.', '.', 'G', 'P', 'W'],
      ['W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 1: O Despertar do Herói!
# Dê passos para a direita e pegue o cristal brilhante!

heroi.andar_direita()
heroi.andar_direita()
heroi.coletar()
heroi.andar_direita()
`,
    initialCodeEn: `# Level 1: The Hero Awakening!
# Move right and collect the glowing crystal!

hero.move_right()
hero.move_right()
hero.collect()
hero.move_right()
`,
    spells: [
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.coletar()', code: 'heroi.coletar()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.collect()', code: 'hero.collect()\n', type: 'action' }
    ]
  },
  {
    id: 2,
    world: 1,
    worldName: 'Mundo 1: Masmorra dos Primeiros Passos',
    title: 'Fase 2: O Lago de Lava',
    subtitle: 'Desvie das poças de lava fervente usando passos para cima e para baixo!',
    titleEn: 'Level 2: The Lava Lake',
    subtitleEn: 'Dodge the burning lava pools using vertical steps!',
    pedagogy: 'Coordenadas e Mudança de Direção',
    hint: 'Não pise no fogo! Ande para a direita, desça um bloco para desviar, e depois siga em frente.',
    hintEn: 'Watch out for fire! Step down to dodge the lava pool, then proceed ahead.',
    maxLinesFor3Stars: 7,
    gridSize: { cols: 5, rows: 4 },
    startPos: { x: 0, y: 1 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W'],
      ['.', 'L', 'L', 'P', 'W'],
      ['.', '.', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 2: O Lago de Lava
# Cuidado com o fogo! Desvie andando para baixo.

heroi.andar_baixo()
heroi.andar_direita()
heroi.andar_direita()
heroi.andar_direita()
heroi.andar_cima()
`,
    initialCodeEn: `# Level 2: The Lava Lake
# Watch out for fire! Step down to dodge.

hero.move_down()
hero.move_right()
hero.move_right()
hero.move_right()
hero.move_up()
`,
    spells: [
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.andar_baixo()', code: 'heroi.andar_baixo()\n', type: 'action' },
      { label: 'heroi.andar_cima()', code: 'heroi.andar_cima()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.move_down()', code: 'hero.move_down()\n', type: 'action' },
      { label: 'hero.move_up()', code: 'hero.move_up()\n', type: 'action' }
    ]
  },
  {
    id: 3,
    world: 1,
    worldName: 'Mundo 1: Masmorra dos Primeiros Passos',
    title: 'Fase 3: A Chave e a Porta Secreta',
    subtitle: 'Colete a chave dourada para destrancar a pesada porta da masmorra!',
    titleEn: 'Level 3: The Golden Key & Door',
    subtitleEn: 'Pick up the golden key to unlock the dungeon door!',
    pedagogy: 'Ordem de Operações e Pré-requisitos',
    hint: 'Vá até a chave dourada 🗝️, use heroi.coletar(), depois vá até a porta 🚪 e use heroi.abrir_porta()!',
    hintEn: 'Collect the golden key first, then go to the door and use hero.open_door()!',
    maxLinesFor3Stars: 8,
    gridSize: { cols: 6, rows: 4 },
    startPos: { x: 0, y: 1 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W', 'W'],
      ['.', '.', '.', 'D', 'P', 'W'],
      ['W', 'K', 'W', 'W', 'W', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 3: A Chave do Calabouço
# 1. Pegue a chave na linha de baixo
# 2. Suba de volta e abra a porta com heroi.abrir_porta()

heroi.andar_direita()
heroi.andar_baixo()
heroi.coletar()
heroi.andar_cima()
heroi.andar_direita()
heroi.abrir_porta()
heroi.andar_direita()
`,
    initialCodeEn: `# Level 3: The Dungeon Key
# 1. Pick up the key below
# 2. Return up and unlock with hero.open_door()

hero.move_right()
hero.move_down()
hero.collect()
hero.move_up()
hero.move_right()
hero.open_door()
hero.move_right()
`,
    spells: [
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.andar_baixo()', code: 'heroi.andar_baixo()\n', type: 'action' },
      { label: 'heroi.andar_cima()', code: 'heroi.andar_cima()\n', type: 'action' },
      { label: 'heroi.coletar()', code: 'heroi.coletar()\n', type: 'action' },
      { label: 'heroi.abrir_porta()', code: 'heroi.abrir_porta()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.move_down()', code: 'hero.move_down()\n', type: 'action' },
      { label: 'hero.move_up()', code: 'hero.move_up()\n', type: 'action' },
      { label: 'hero.collect()', code: 'hero.collect()\n', type: 'action' },
      { label: 'hero.open_door()', code: 'hero.open_door()\n', type: 'action' }
    ]
  },

  // ==================== MUNDO 2 ====================
  {
    id: 4,
    world: 2,
    worldName: 'Mundo 2: Floresta dos Laços',
    title: 'Fase 4: A Ponte dos Laços (For Loop)',
    subtitle: 'Atravesse um corredor longo sem cansar os dedos: use for i in range(...)!',
    titleEn: 'Level 4: The Loop Bridge (For Loop)',
    subtitleEn: 'Cross a long corridor without repeating yourself: use for i in range(...)!',
    pedagogy: 'Estrutura de Repetição (for loop)',
    hint: 'Em Python, "for i in range(5):" repete qualquer comando indentado 5 vezes!',
    hintEn: 'In Python, "for i in range(5):" repeats any indented command 5 times!',
    maxLinesFor3Stars: 4,
    gridSize: { cols: 7, rows: 3 },
    startPos: { x: 0, y: 1 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['.', '.', '.', '.', '.', 'G', 'P'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 4: O Poder da Repetição!
# Não digite heroi.andar_direita() 5 vezes!
# Use o laço "for" para repetir o feitiço:

for i in range(5):
    heroi.andar_direita()

heroi.coletar()
heroi.andar_direita()
`,
    initialCodeEn: `# Level 4: The Power of Loops!
# Do not type hero.move_right() 5 times!
# Use a for loop instead:

for i in range(5):
    hero.move_right()

hero.collect()
hero.move_right()
`,
    spells: [
      { label: 'for i in range(5):', code: 'for i in range(5):\n    heroi.andar_direita()\n', type: 'loop' },
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.coletar()', code: 'heroi.coletar()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'for i in range(5):', code: 'for i in range(5):\n    hero.move_right()\n', type: 'loop' },
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.collect()', code: 'hero.collect()\n', type: 'action' }
    ]
  },
  {
    id: 5,
    world: 2,
    worldName: 'Mundo 2: Floresta dos Laços',
    title: 'Fase 5: O Pomar dos Cristais',
    subtitle: 'Colete vários cristais seguidos repetindo andar e coletar dentro do loop!',
    titleEn: 'Level 5: Crystal Orchard',
    subtitleEn: 'Collect consecutive gems by combining move and collect inside a loop!',
    pedagogy: 'Blocos de Código Indentados no Loop',
    hint: 'Dentro do for, você pode colocar mais de um comando! Ex: andar e coletar a cada passo.',
    hintEn: 'Inside a for loop, you can put multiple commands like move and collect!',
    maxLinesFor3Stars: 5,
    gridSize: { cols: 6, rows: 3 },
    startPos: { x: 0, y: 1 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W', 'W'],
      ['.', 'G', 'G', 'G', 'G', 'P'],
      ['W', 'W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 5: Pomar de Cristais
# A cada passo para a direita, colete um cristal!

for i in range(4):
    heroi.andar_direita()
    heroi.coletar()

heroi.andar_direita()
`,
    initialCodeEn: `# Level 5: Crystal Orchard
# At each step to the right, collect a gem!

for i in range(4):
    hero.move_right()
    hero.collect()

hero.move_right()
`,
    spells: [
      { label: 'for i in range(4):', code: 'for i in range(4):\n    ', type: 'loop' },
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.coletar()', code: 'heroi.coletar()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'for i in range(4):', code: 'for i in range(4):\n    ', type: 'loop' },
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.collect()', code: 'hero.collect()\n', type: 'action' }
    ]
  },
  {
    id: 6,
    world: 2,
    worldName: 'Mundo 2: Floresta dos Laços',
    title: 'Fase 6: O Corredor Sem Fim (While Loop)',
    subtitle: 'Ande para frente enquanto o caminho estiver livre: while heroi.caminho_livre()!',
    titleEn: 'Level 6: Endless Hall (While Loop)',
    subtitleEn: 'Move forward while path is clear: while hero.is_path_clear()!',
    pedagogy: 'Laços Condicionais (while loop)',
    hint: 'O while repete enquanto a condição for verdadeira. heroi.caminho_livre() verifica paredes!',
    hintEn: 'While repeats until condition is false. hero.is_path_clear() checks for walls!',
    maxLinesFor3Stars: 5,
    gridSize: { cols: 7, rows: 4 },
    startPos: { x: 0, y: 1 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['.', '.', '.', '.', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'P', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 6: Andando com While!
# Avance até encontrar a parede, depois vire para baixo:

while heroi.caminho_livre():
    heroi.andar_direita()

heroi.andar_baixo()
`,
    initialCodeEn: `# Level 6: Moving with While!
# Advance while path is free, then turn down:

while hero.is_path_clear():
    hero.move_right()

hero.move_down()
`,
    spells: [
      { label: 'while heroi.caminho_livre():', code: 'while heroi.caminho_livre():\n    heroi.andar_direita()\n', type: 'loop' },
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.andar_baixo()', code: 'heroi.andar_baixo()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'while hero.is_path_clear():', code: 'while hero.is_path_clear():\n    hero.move_right()\n', type: 'loop' },
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.move_down()', code: 'hero.move_down()\n', type: 'action' }
    ]
  },

  // ==================== MUNDO 3 ====================
  {
    id: 7,
    world: 3,
    worldName: 'Mundo 3: Templo das Decisões',
    title: 'Fase 7: O Guardião Slime (If Condicional)',
    subtitle: 'Verifique se há um monstro na sua frente e golpeie com sua espada mágica!',
    titleEn: 'Level 7: The Slime Guardian (If Statement)',
    subtitleEn: 'Check if there is a monster ahead and strike with your staff!',
    pedagogy: 'Estruturas Condicionais (if / else)',
    hint: 'Use if heroi.tem_inimigo(): heroi.atacar() para derrotar o Slime antes de avançar!',
    hintEn: 'Use if hero.has_enemy(): hero.attack() to defeat the slime before advancing!',
    maxLinesFor3Stars: 7,
    gridSize: { cols: 6, rows: 3 },
    startPos: { x: 0, y: 1 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W', 'W'],
      ['.', '.', 'S', '.', 'G', 'P'],
      ['W', 'W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 7: Batalha com o Slime Gelatinoso
# Se tiver inimigo, ataque!

heroi.andar_direita()
if heroi.tem_inimigo():
    heroi.atacar()

heroi.andar_direita()
heroi.andar_direita()
heroi.coletar()
heroi.andar_direita()
`,
    initialCodeEn: `# Level 7: Battle with the Slime
# If enemy detected, attack!

hero.move_right()
if hero.has_enemy():
    hero.attack()

hero.move_right()
hero.move_right()
hero.collect()
hero.move_right()
`,
    spells: [
      { label: 'if heroi.tem_inimigo():', code: 'if heroi.tem_inimigo():\n    heroi.atacar()\n', type: 'if' },
      { label: 'heroi.atacar()', code: 'heroi.atacar()\n', type: 'action' },
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.coletar()', code: 'heroi.coletar()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'if hero.has_enemy():', code: 'if hero.has_enemy():\n    hero.attack()\n', type: 'if' },
      { label: 'hero.attack()', code: 'hero.attack()\n', type: 'action' },
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.collect()', code: 'hero.collect()\n', type: 'action' }
    ]
  },
  {
    id: 8,
    world: 3,
    worldName: 'Mundo 3: Templo das Decisões',
    title: 'Fase 8: A Grande Prova do Mestre Merlin',
    subtitle: 'Combine laços for, condicionais if e colete todos os cristais para se formar Mestre!',
    titleEn: 'Level 8: Master Merlin Grand Trial',
    subtitleEn: 'Combine for loops and if checks to defeat the golem and graduate!',
    pedagogy: 'Integração Completa (Loops + Condições + Ações)',
    hint: 'Colete as 2 gemas, ataque o Golem de Pedra com heroi.atacar() e entre triunfante no Portal!',
    hintEn: 'Collect both gems, attack the stone golem with hero.attack() and enter the portal!',
    maxLinesFor3Stars: 9,
    gridSize: { cols: 7, rows: 4 },
    startPos: { x: 0, y: 2 },
    startDir: 'right',
    map: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'G', '.', '.', 'B', 'P', 'W'],
      ['.', '.', 'L', 'G', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
    ],
    initialCode: `# Fase 8: Prova Final de Mestre Mago!
heroi.andar_cima()
heroi.andar_direita()
heroi.coletar()

for i in range(2):
    heroi.andar_direita()

heroi.andar_baixo()
heroi.coletar()
heroi.andar_cima()
heroi.andar_direita()

if heroi.tem_inimigo():
    heroi.atacar()

heroi.andar_direita()
`,
    initialCodeEn: `# Level 8: Grand Master Trial!
hero.move_up()
hero.move_right()
hero.collect()

for i in range(2):
    hero.move_right()

hero.move_down()
hero.collect()
hero.move_up()
hero.move_right()

if hero.has_enemy():
    hero.attack()

hero.move_right()
`,
    spells: [
      { label: 'for i in range(2):', code: 'for i in range(2):\n    heroi.andar_direita()\n', type: 'loop' },
      { label: 'if heroi.tem_inimigo():', code: 'if heroi.tem_inimigo():\n    heroi.atacar()\n', type: 'if' },
      { label: 'heroi.andar_direita()', code: 'heroi.andar_direita()\n', type: 'action' },
      { label: 'heroi.andar_cima()', code: 'heroi.andar_cima()\n', type: 'action' },
      { label: 'heroi.andar_baixo()', code: 'heroi.andar_baixo()\n', type: 'action' },
      { label: 'heroi.coletar()', code: 'heroi.coletar()\n', type: 'action' },
      { label: 'heroi.atacar()', code: 'heroi.atacar()\n', type: 'action' }
    ],
    spellsEn: [
      { label: 'for i in range(2):', code: 'for i in range(2):\n    hero.move_right()\n', type: 'loop' },
      { label: 'if hero.has_enemy():', code: 'if hero.has_enemy():\n    hero.attack()\n', type: 'if' },
      { label: 'hero.move_right()', code: 'hero.move_right()\n', type: 'action' },
      { label: 'hero.move_up()', code: 'hero.move_up()\n', type: 'action' },
      { label: 'hero.move_down()', code: 'hero.move_down()\n', type: 'action' },
      { label: 'hero.collect()', code: 'hero.collect()\n', type: 'action' },
      { label: 'hero.attack()', code: 'hero.attack()\n', type: 'action' }
    ]
  }
];

export const HERO_CHARACTERS = [
  { id: 'wizard', name: 'Mago Merlin Jr.', emoji: '🧙‍♂️', desc: 'Mestre dos feitiços e da lógica arcana' },
  { id: 'mage', name: 'Feiticeira Luna', emoji: '🧙‍♀️', desc: 'Canalizadora das estrelas e dos laços mágicos' },
  { id: 'knight', name: 'Cavaleiro Arthur', emoji: '⚔️', desc: 'Guerreiro ágil e especialista em desvios de lava' },
  { id: 'robot', name: 'Robô Byte-01', emoji: '🤖', desc: 'Androide do futuro programado para não ter bugs' }
];

export const TROPHIES = [
  { id: 'first_spell', title: 'Primeiro Feitiço', desc: 'Completou a Fase 1 da Masmorra', icon: '📜' },
  { id: 'lava_walker', title: 'Pés Ligeiros', desc: 'Desviou com perfeição do Lago de Lava', icon: '🔥' },
  { id: 'key_master', title: 'Chaveiro Mágico', desc: 'Encontrou a chave e destrancou a porta', icon: '🗝️' },
  { id: 'loop_master', title: 'Senhor dos Laços', desc: 'Dominou o laço for em Python', icon: '🔄' },
  { id: 'slayer', title: 'Caçador de Slimes', desc: 'Derrotou seu primeiro monstro com if/atacar', icon: '🗡️' },
  { id: 'crystal_collector', title: 'Colecionador de Gemas', desc: 'Coletou 5 ou mais cristais reluzentes', icon: '💎' },
  { id: 'perfectionist', title: 'Mente Brilhante (3 Estrelas)', desc: 'Concluiu qualquer fase com pontuação máxima', icon: '⭐' },
  { id: 'grand_master', title: 'Mestre da Programação', desc: 'Derrotou o Golem e concluiu todas as 8 fases!', icon: '👑' }
];
