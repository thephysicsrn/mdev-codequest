// ==========================================================================
// 2D DUNGEON GAME ENGINE - MDEV CODEQUEST
// Renderização do grid, animações, detecção de colisões e controle de gameplay
// ==========================================================================

import { sound } from './sound.js';

export class DungeonEngine {
  constructor(boardElement, inventoryElement) {
    this.boardEl = boardElement;
    this.invEl = inventoryElement;

    this.currentLevel = null;
    this.grid = []; // Matriz de células
    this.heroPos = { x: 0, y: 0 };
    this.heroDir = 'right';
    this.inventory = {
      gems: 0,
      keys: 0
    };

    this.bumpsCount = 0;
    this.heroChar = '🧙‍♂️';
    this.showCoords = false;
    this.animationSpeed = 1; // 1x = 350ms, 2x = 200ms, 4x = 100ms
    this.isPlaying = false;
    this.isPaused = false;
    this.heroEl = null;

    this.onLevelCompleted = null;
    this.onActiveLineChanged = null;
    this.onToastRequested = null;
  }

  // Carrega e desenha o mapa da fase
  loadLevel(levelData, heroEmoji = '🧙‍♂️') {
    this.currentLevel = levelData;
    this.heroChar = heroEmoji;
    this.heroPos = { ...levelData.startPos };
    this.heroDir = levelData.startDir || 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.isPlaying = false;
    this.isPaused = false;

    // Constrói a grade profunda a partir do mapa original
    this.grid = levelData.map.map(row => [...row]);

    this.renderBoard();
    this.updateInventoryUI();
  }

  // Renderiza todo o tabuleiro DOM
  renderBoard() {
    this.boardEl.innerHTML = '';
    const rows = this.currentLevel.gridSize.rows;
    const cols = this.currentLevel.gridSize.cols;

    this.boardEl.style.gridTemplateColumns = `repeat(${cols}, 58px)`;
    this.boardEl.style.gridTemplateRows = `repeat(${rows}, 58px)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tileType = this.grid[r][c];
        const tileDiv = document.createElement('div');
        tileDiv.className = 'tile';
        tileDiv.dataset.x = c;
        tileDiv.dataset.y = r;

        // Tipo de piso
        if (tileType === 'W') {
          tileDiv.classList.add('tile-wall');
        } else if (tileType === 'L') {
          tileDiv.classList.add('tile-lava');
        } else {
          tileDiv.classList.add('tile-floor');
        }

        // Elementos interativos
        if (tileType === 'G') {
          const gem = document.createElement('div');
          gem.className = 'gem-item';
          gem.textContent = '💎';
          gem.id = `item-${c}-${r}`;
          tileDiv.appendChild(gem);
        } else if (tileType === 'K') {
          const key = document.createElement('div');
          key.className = 'key-item';
          key.textContent = '🗝️';
          key.id = `item-${c}-${r}`;
          tileDiv.appendChild(key);
        } else if (tileType === 'D') {
          const door = document.createElement('div');
          door.className = 'door-item';
          door.textContent = '🚪';
          door.id = `door-${c}-${r}`;
          tileDiv.appendChild(door);
        } else if (tileType === 'P') {
          const portal = document.createElement('div');
          portal.className = 'portal-item';
          portal.textContent = '🌀';
          tileDiv.appendChild(portal);
        } else if (tileType === 'S') {
          const slime = document.createElement('div');
          slime.className = 'enemy-mob slime-mob';
          slime.textContent = '🟢';
          slime.id = `enemy-${c}-${r}`;
          tileDiv.appendChild(slime);
        } else if (tileType === 'B') {
          const boss = document.createElement('div');
          boss.className = 'enemy-mob golem-mob';
          boss.textContent = '👹';
          boss.id = `enemy-${c}-${r}`;
          tileDiv.appendChild(boss);
        }

        // Indicador de coordenadas (X, Y)
        if (this.showCoords) {
          const coordLbl = document.createElement('span');
          coordLbl.className = 'coord-label';
          coordLbl.textContent = `${c},${r}`;
          tileDiv.appendChild(coordLbl);
        }

        this.boardEl.appendChild(tileDiv);
      }
    }

    // Renderiza o Herói
    this.createHeroElement();
  }

  // Cria e posiciona o elemento do Herói
  createHeroElement() {
    if (this.heroEl) {
      this.heroEl.remove();
    }

    const hero = document.createElement('div');
    hero.className = 'hero-sprite';
    hero.innerHTML = `
      <div class="hero-body idle" id="hero-body-inner">
        <span class="hero-char-icon">${this.heroChar}</span>
        <div class="hero-aura"></div>
      </div>
    `;

    this.boardEl.appendChild(hero);
    this.heroEl = hero;
    this.updateHeroVisualPosition(false);
  }

  // Atualiza a posição visual no grid
  updateHeroVisualPosition(animated = true) {
    if (!this.heroEl) return;
    const tileWidth = 58 + 4; // 58px + 4px gap
    const padding = 10; // padding do board

    const left = padding + this.heroPos.x * tileWidth;
    const top = padding + this.heroPos.y * tileWidth;

    if (!animated) {
      this.heroEl.style.transition = 'none';
    } else {
      const duration = (0.35 / this.animationSpeed).toFixed(2);
      this.heroEl.style.transition = `top ${duration}s cubic-bezier(0.34, 1.3, 0.64, 1), left ${duration}s cubic-bezier(0.34, 1.3, 0.64, 1)`;
    }

    this.heroEl.style.left = `${left}px`;
    this.heroEl.style.top = `${top}px`;
  }

  // Alterna exibição das coordenadas
  toggleCoords() {
    this.showCoords = !this.showCoords;
    this.renderBoard();
    return this.showCoords;
  }

  // Alterna velocidade de execução: 1x -> 2x -> 4x -> 1x
  cycleSpeed() {
    if (this.animationSpeed === 1) this.animationSpeed = 2;
    else if (this.animationSpeed === 2) this.animationSpeed = 4;
    else this.animationSpeed = 1;
    return this.animationSpeed;
  }

  // Retorna um clone de estado para o interpretador de Python testar condições
  cloneSimulationState() {
    const simGrid = this.grid.map(row => [...row]);
    const simPos = { ...this.heroPos };
    const simDir = this.heroDir;
    let simKeys = this.inventory.keys;
    let simGems = this.inventory.gems;

    return {
      move: (dir) => {
        const offset = this.getOffset(dir);
        const nx = simPos.x + offset.x;
        const ny = simPos.y + offset.y;
        if (this.isValidCell(nx, ny) && simGrid[ny][nx] !== 'W' && simGrid[ny][nx] !== 'D') {
          simPos.x = nx;
          simPos.y = ny;
        }
      },
      collect: () => {
        const item = simGrid[simPos.y][simPos.x];
        if (item === 'G') {
          simGems++;
          simGrid[simPos.y][simPos.x] = '.';
        } else if (item === 'K') {
          simKeys++;
          simGrid[simPos.y][simPos.x] = '.';
        }
      },
      attack: () => {
        // Ataca célula à frente ou adjacente
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        for (const off of offsets) {
          const nx = simPos.x + off.x;
          const ny = simPos.y + off.y;
          if (this.isValidCell(nx, ny) && (simGrid[ny][nx] === 'S' || simGrid[ny][nx] === 'B')) {
            simGrid[ny][nx] = '.';
            break;
          }
        }
      },
      openDoor: () => {
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        for (const off of offsets) {
          const nx = simPos.x + off.x;
          const ny = simPos.y + off.y;
          if (this.isValidCell(nx, ny) && simGrid[ny][nx] === 'D' && simKeys > 0) {
            simGrid[ny][nx] = '.';
            simKeys--;
            break;
          }
        }
      },
      isPathAheadFree: () => {
        const offset = this.getOffset(simDir);
        const nx = simPos.x + offset.x;
        const ny = simPos.y + offset.y;
        return this.isValidCell(nx, ny) && simGrid[ny][nx] !== 'W' && simGrid[ny][nx] !== 'D' && simGrid[ny][nx] !== 'L';
      },
      hasEnemyAhead: () => {
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        return offsets.some(off => {
          const nx = simPos.x + off.x;
          const ny = simPos.y + off.y;
          return this.isValidCell(nx, ny) && (simGrid[ny][nx] === 'S' || simGrid[ny][nx] === 'B');
        });
      },
      hasKeyInInventory: () => simKeys > 0,
      isCurrentTileGem: () => simGrid[simPos.y][simPos.x] === 'G',
      isCurrentTilePortal: () => simGrid[simPos.y][simPos.x] === 'P'
    };
  }

  getOffset(dir) {
    if (dir === 'right') return { x: 1, y: 0 };
    if (dir === 'left') return { x: -1, y: 0 };
    if (dir === 'up') return { x: 0, y: -1 };
    if (dir === 'down') return { x: 0, y: 1 };
    return { x: 1, y: 0 };
  }

  isValidCell(x, y) {
    return y >= 0 && y < this.currentLevel.gridSize.rows && x >= 0 && x < this.currentLevel.gridSize.cols;
  }

  // Executa uma lista de ações sequencialmente com animação
  async playActionQueue(actions, codeTotalLines) {
    this.isPlaying = true;
    let success = true;

    for (let i = 0; i < actions.length; i++) {
      if (!this.isPlaying) break;

      const act = actions[i];

      // Atualiza linha ativa no editor
      if (this.onActiveLineChanged && act.line) {
        this.onActiveLineChanged(act.line);
      }

      await this.executeSingleAction(act);

      // Checa colisão com lava
      if (this.grid[this.heroPos.y][this.heroPos.x] === 'L') {
        sound.playBump();
        this.showToast('🔥 Ai! O herói pisou na lava fervente! Tente desviar.');
        this.bumpHero();
        success = false;
        break;
      }

      // Intervalo entre passos conforme a velocidade
      const delay = Math.max(80, Math.floor(400 / this.animationSpeed));
      await new Promise(r => setTimeout(r, delay));
    }

    if (this.onActiveLineChanged) {
      this.onActiveLineChanged(null);
    }

    this.isPlaying = false;

    // Checa vitória se ainda estiver vivo
    if (success) {
      this.checkLevelCompletion(codeTotalLines);
    }
  }

  // Executa uma única ação no tabuleiro com áudio e física
  async executeSingleAction(act) {
    const bodyInner = document.getElementById('hero-body-inner');

    if (act.type === 'move') {
      const offset = this.getOffset(act.dir);
      this.heroDir = act.dir;
      const nx = this.heroPos.x + offset.x;
      const ny = this.heroPos.y + offset.y;

      if (!this.isValidCell(nx, ny) || this.grid[ny][nx] === 'W' || this.grid[ny][nx] === 'D') {
        // Colisão com parede ou porta trancada
        this.bumpsCount++;
        sound.playBump();
        this.bumpHero();
        if (this.grid[ny]?.[nx] === 'D') {
          this.showToast('🚪 A porta está trancada! Use heroi.abrir_porta() se tiver a chave.');
        } else {
          this.showToast('🧱 O herói bateu na parede de pedra!');
        }
        return;
      }

      // Movimento válido
      this.heroPos.x = nx;
      this.heroPos.y = ny;
      sound.playStep();

      if (bodyInner) {
        bodyInner.className = 'hero-body walking';
        setTimeout(() => {
          if (bodyInner.classList.contains('walking')) bodyInner.className = 'hero-body idle';
        }, 300);
      }

      this.updateHeroVisualPosition(true);

    } else if (act.type === 'collect') {
      const currentTile = this.grid[this.heroPos.y][this.heroPos.x];

      if (currentTile === 'G') {
        this.inventory.gems++;
        this.grid[this.heroPos.y][this.heroPos.x] = '.';
        sound.playGem();
        this.spawnParticle(this.heroPos.x, this.heroPos.y, '✨ +1 Gema');
        const gemEl = document.getElementById(`item-${this.heroPos.x}-${this.heroPos.y}`);
        if (gemEl) gemEl.remove();
        this.updateInventoryUI();
      } else if (currentTile === 'K') {
        this.inventory.keys++;
        this.grid[this.heroPos.y][this.heroPos.x] = '.';
        sound.playGem();
        this.spawnParticle(this.heroPos.x, this.heroPos.y, '🗝️ Chave Pega!');
        const keyEl = document.getElementById(`item-${this.heroPos.x}-${this.heroPos.y}`);
        if (keyEl) keyEl.remove();
        this.updateInventoryUI();
      } else {
        this.showToast('🔍 Nada para coletar neste bloco!');
      }

    } else if (act.type === 'attack') {
      if (bodyInner) {
        bodyInner.className = 'hero-body attacking';
        setTimeout(() => { bodyInner.className = 'hero-body idle'; }, 400);
      }
      sound.playAttack();

      // Verifica se há monstro adjacente
      const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
      let hit = false;

      for (const off of offsets) {
        const nx = this.heroPos.x + off.x;
        const ny = this.heroPos.y + off.y;
        if (this.isValidCell(nx, ny) && (this.grid[ny][nx] === 'S' || this.grid[ny][nx] === 'B')) {
          hit = true;
          const enemyEl = document.getElementById(`enemy-${nx}-${ny}`);
          if (enemyEl) {
            enemyEl.classList.add('defeated');
            setTimeout(() => enemyEl.remove(), 450);
          }
          this.grid[ny][nx] = '.';
          this.spawnParticle(nx, ny, '💥 100 DANO!');
          this.showToast('⚔️ Golpe certeiro! O monstro foi derrotado.');
          break;
        }
      }

      if (!hit) {
        this.showToast('💨 O herói atacou o vento! Não havia monstros por perto.');
      }

    } else if (act.type === 'open_door') {
      const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
      let opened = false;

      for (const off of offsets) {
        const nx = this.heroPos.x + off.x;
        const ny = this.heroPos.y + off.y;
        if (this.isValidCell(nx, ny) && this.grid[ny][nx] === 'D') {
          if (this.inventory.keys > 0) {
            opened = true;
            this.inventory.keys--;
            this.grid[ny][nx] = '.';
            sound.playVictory();
            const doorEl = document.getElementById(`door-${nx}-${ny}`);
            if (doorEl) {
              doorEl.classList.add('open');
              setTimeout(() => doorEl.remove(), 400);
            }
            this.spawnParticle(nx, ny, '🔓 Porta Aberta!');
            this.updateInventoryUI();
          } else {
            sound.playBump();
            this.showToast('🔒 Você precisa de uma chave 🗝️ para abrir esta porta!');
          }
          break;
        }
      }
    }
  }

  // Verifica se a fase foi concluída com sucesso
  checkLevelCompletion(codeTotalLines) {
    const currentTile = this.grid[this.heroPos.y][this.heroPos.x];

    // Checa se ainda sobraram gemas obrigatórias no mapa
    const remainingGems = this.grid.flat().filter(t => t === 'G').length;
    const isAtPortal = currentTile === 'P';

    if (isAtPortal && remainingGems === 0) {
      sound.playVictory();
      const bodyInner = document.getElementById('hero-body-inner');
      if (bodyInner) bodyInner.className = 'hero-body victory';

      // Cálculo de Estrelas:
      // 1 Estrela: Chegou ao portal e pegou os cristais
      // 2 Estrelas: Não bateu em paredes nem tomou dano
      // 3 Estrelas: Código conciso / dentro do limite recomendado
      const star1 = true;
      const star2 = this.bumpsCount === 0;
      const star3 = (codeTotalLines <= this.currentLevel.maxLinesFor3Stars);

      let starsCount = 1;
      if (star2) starsCount++;
      if (star3) starsCount++;

      if (this.onLevelCompleted) {
        this.onLevelCompleted({
          levelId: this.currentLevel.id,
          stars: starsCount,
          starDetails: [
            { text: 'Chegou ao Portal Mágico com todas as gemas', achieved: star1 },
            { text: 'Caminho limpo: nenhuma colisão com paredes ou lava', achieved: star2 },
            { text: `Código Mágico Eficiente (máximo ${this.currentLevel.maxLinesFor3Stars} linhas)`, achieved: star3 }
          ],
          gemsEarned: this.inventory.gems,
          xpEarned: 50 + (starsCount * 25)
        });
      }
    } else if (isAtPortal && remainingGems > 0) {
      this.showToast('💎 Você chegou ao Portal, mas esqueceu de coletar os cristais mágicos!');
    } else {
      this.showToast('O herói parou antes do Portal. Continue seu código para chegar ao fim!');
    }
  }

  bumpHero() {
    const bodyInner = document.getElementById('hero-body-inner');
    if (bodyInner) {
      bodyInner.className = 'hero-body bumped';
      setTimeout(() => { bodyInner.className = 'hero-body idle'; }, 400);
    }
  }

  spawnParticle(x, y, text) {
    const particle = document.createElement('div');
    particle.className = 'collect-particle';
    particle.textContent = text;
    const tileWidth = 58 + 4;
    particle.style.left = `${10 + x * tileWidth + 8}px`;
    particle.style.top = `${10 + y * tileWidth - 10}px`;
    this.boardEl.appendChild(particle);
    setTimeout(() => particle.remove(), 700);
  }

  showToast(message) {
    if (this.onToastRequested) {
      this.onToastRequested(message);
    }
  }

  updateInventoryUI() {
    if (!this.invEl) return;
    this.invEl.innerHTML = '';

    if (this.inventory.gems === 0 && this.inventory.keys === 0) {
      this.invEl.innerHTML = '<span class="inv-empty-msg">Vazia</span>';
      return;
    }

    if (this.inventory.gems > 0) {
      const slot = document.createElement('span');
      slot.className = 'inv-item-slot';
      slot.innerHTML = `💎 ${this.inventory.gems}`;
      this.invEl.appendChild(slot);
    }

    if (this.inventory.keys > 0) {
      const slot = document.createElement('span');
      slot.className = 'inv-item-slot';
      slot.innerHTML = `🗝️ ${this.inventory.keys}`;
      this.invEl.appendChild(slot);
    }
  }

  resetHeroPosition() {
    this.isPlaying = false;
    this.heroPos = { ...this.currentLevel.startPos };
    this.heroDir = this.currentLevel.startDir || 'right';
    this.inventory = { gems: 0, keys: 0 };
    this.bumpsCount = 0;
    this.grid = this.currentLevel.map.map(row => [...row]);
    this.renderBoard();
    this.updateInventoryUI();
    const bodyInner = document.getElementById('hero-body-inner');
    if (bodyInner) bodyInner.className = 'hero-body idle';
  }
}
