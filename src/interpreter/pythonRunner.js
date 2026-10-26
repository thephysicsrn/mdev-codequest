// ==========================================================================
// PYTHON RUNNER & INTERPRETER - MDEV CODEQUEST
// Suporte bilíngue nativo: comandos em Português e em Inglês
// ==========================================================================

export class PythonRunner {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.logs = [];
    this.actions = [];
    this.maxIterations = 150;
  }

  execute(code) {
    this.logs = [];
    this.actions = [];

    const simState = this.game.cloneSimulationState();

    try {
      const cleanLines = this.preprocessCode(code);
      this.runSimulation(cleanLines, simState);
      return {
        success: true,
        actions: this.actions,
        logs: this.logs
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        line: err.lineNumber || 1,
        logs: this.logs
      };
    }
  }

  preprocessCode(code) {
    const rawLines = code.split('\n');
    const parsed = [];

    rawLines.forEach((text, idx) => {
      const lineNum = idx + 1;
      const trimmed = text.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const indentMatch = text.match(/^(\s*)/);
      const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 4) : 0;

      if ((trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else')) && !trimmed.endsWith(':')) {
        const err = new Error(`Faltou colocar ":" no final da linha ${lineNum}! Em Python: for i in range(...) ou if condition:`);
        err.lineNumber = lineNum;
        throw err;
      }

      parsed.push({
        raw: text,
        trimmed: trimmed,
        lineNum: lineNum,
        indent: indentLevel
      });
    });

    return parsed;
  }

  runSimulation(lines, sim) {
    const scope = {
      vars: {},
      hero: sim
    };

    let totalStepsCount = 0;

    const executeBlock = (startIdx, targetIndent) => {
      let i = startIdx;

      while (i < lines.length) {
        if (totalStepsCount++ > this.maxIterations) {
          throw new Error('Alerta de Feitiço Infinito! Seu loop rodou muitas vezes sem parar.');
        }

        const line = lines[i];

        if (line.indent < targetIndent) {
          return i;
        }

        if (line.indent > targetIndent) {
          i++;
          continue;
        }

        const text = line.trimmed;
        const lineNum = line.lineNum;

        // 1. LAÇO FOR
        if (text.startsWith('for ')) {
          const match = text.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\(([^)]+)\):$/);
          if (!match) {
            const err = new Error(`Sintaxe do laço for inválida na linha ${lineNum}. Exemplo: for i in range(3):`);
            err.lineNumber = lineNum;
            throw err;
          }

          const loopVar = match[1];
          const countExpr = match[2].trim();
          let count = parseInt(countExpr, 10);
          if (isNaN(count)) {
            count = scope.vars[countExpr] || 0;
          }

          const loopBodyLines = [];
          let nextIdx = i + 1;
          while (nextIdx < lines.length && lines[nextIdx].indent > line.indent) {
            loopBodyLines.push(lines[nextIdx]);
            nextIdx++;
          }

          for (let iter = 0; iter < count; iter++) {
            scope.vars[loopVar] = iter;
            executeBlock(i + 1, targetIndent + 1);
          }

          i = nextIdx;
          continue;
        }

        // 2. LAÇO WHILE
        if (text.startsWith('while ')) {
          const condMatch = text.match(/^while\s+(.+):$/);
          if (!condMatch) {
            const err = new Error(`Condição do while inválida na linha ${lineNum}.`);
            err.lineNumber = lineNum;
            throw err;
          }

          const conditionStr = condMatch[1].trim();

          let nextIdx = i + 1;
          while (nextIdx < lines.length && lines[nextIdx].indent > line.indent) {
            nextIdx++;
          }

          let safetyCounter = 0;
          while (this.evaluateCondition(conditionStr, scope, sim, lineNum)) {
            if (safetyCounter++ > 50) {
              const err = new Error(`Seu "while" continuou rodando para sempre! Cuidado com loop infinito.`);
              err.lineNumber = lineNum;
              throw err;
            }
            executeBlock(i + 1, targetIndent + 1);
          }

          i = nextIdx;
          continue;
        }

        // 3. CONDICIONAL IF
        if (text.startsWith('if ')) {
          const ifMatch = text.match(/^if\s+(.+):$/);
          if (!ifMatch) {
            const err = new Error(`Condição do if inválida na linha ${lineNum}.`);
            err.lineNumber = lineNum;
            throw err;
          }

          const conditionStr = ifMatch[1].trim();
          const condResult = this.evaluateCondition(conditionStr, scope, sim, lineNum);

          let nextIdx = i + 1;
          while (nextIdx < lines.length && lines[nextIdx].indent > line.indent) {
            nextIdx++;
          }

          let elseBranchTaken = false;

          if (condResult) {
            executeBlock(i + 1, targetIndent + 1);
            elseBranchTaken = true;
          }

          if (nextIdx < lines.length && lines[nextIdx].indent === line.indent && lines[nextIdx].trimmed.startsWith('else:')) {
            const elseIdx = nextIdx;
            nextIdx++;
            while (nextIdx < lines.length && lines[nextIdx].indent > line.indent) {
              nextIdx++;
            }

            if (!elseBranchTaken) {
              executeBlock(elseIdx + 1, targetIndent + 1);
            }
          }

          i = nextIdx;
          continue;
        }

        // 4. PRINT
        if (text.startsWith('print(')) {
          const match = text.match(/^print\((.*)\)$/);
          if (match) {
            const content = match[1].replace(/['"]/g, '');
            this.logs.push(`[Linha ${lineNum}] ${content}`);
            this.actions.push({
              type: 'print',
              message: content,
              line: lineNum
            });
          }
          i++;
          continue;
        }

        // 5. ATRIBUIÇÃO
        if (text.includes('=') && !text.includes('==') && !text.includes('(')) {
          const parts = text.split('=');
          const varName = parts[0].trim();
          const varVal = parseInt(parts[1].trim(), 10) || 0;
          scope.vars[varName] = varVal;
          i++;
          continue;
        }

        // 6. COMANDOS DO HERÓI (SUPORTE PT-BR E EN)
        this.parseHeroCommand(text, lineNum, sim);
        i++;
      }

      return i;
    };

    executeBlock(0, 0);
  }

  // Identificação e normalização bilíngue (Português / Inglês)
  parseHeroCommand(text, lineNum, sim) {
    // Normaliza eliminando espaços em branco internos
    const cleanCmd = text.replace(/\s+/g, '');

    // MOVIMENTO DIREITA
    if (cleanCmd === 'heroi.andar_direita()' || cleanCmd === 'hero.move_right()' || cleanCmd === 'hero.moveRight()') {
      this.actions.push({ type: 'move', dir: 'right', line: lineNum });
      sim.move('right');
      return;
    }

    // MOVIMENTO ESQUERDA
    if (cleanCmd === 'heroi.andar_esquerda()' || cleanCmd === 'hero.move_left()' || cleanCmd === 'hero.moveLeft()') {
      this.actions.push({ type: 'move', dir: 'left', line: lineNum });
      sim.move('left');
      return;
    }

    // MOVIMENTO CIMA
    if (cleanCmd === 'heroi.andar_cima()' || cleanCmd === 'hero.move_up()' || cleanCmd === 'hero.moveUp()') {
      this.actions.push({ type: 'move', dir: 'up', line: lineNum });
      sim.move('up');
      return;
    }

    // MOVIMENTO BAIXO
    if (cleanCmd === 'heroi.andar_baixo()' || cleanCmd === 'hero.move_down()' || cleanCmd === 'hero.moveDown()') {
      this.actions.push({ type: 'move', dir: 'down', line: lineNum });
      sim.move('down');
      return;
    }

    // COLETAR ITENS
    if (cleanCmd === 'heroi.coletar()' || cleanCmd === 'hero.collect()' || cleanCmd === 'hero.pick()') {
      this.actions.push({ type: 'collect', line: lineNum });
      sim.collect();
      return;
    }

    // ATACAR
    if (cleanCmd === 'heroi.atacar()' || cleanCmd === 'hero.attack()' || cleanCmd === 'hero.hit()') {
      this.actions.push({ type: 'attack', line: lineNum });
      sim.attack();
      return;
    }

    // ABRIR PORTA
    if (cleanCmd === 'heroi.abrir_porta()' || cleanCmd === 'hero.open_door()' || cleanCmd === 'hero.openDoor()') {
      this.actions.push({ type: 'open_door', line: lineNum });
      sim.openDoor();
      return;
    }

    // Diagnóstico amigável bilíngue de erro
    if (text.includes('andar') || text.includes('move')) {
      const err = new Error(`Comando de movimento desconhecido na linha ${lineNum}. Use: heroi.andar_direita() ou hero.move_right()`);
      err.lineNumber = lineNum;
      throw err;
    } else if (text.startsWith('heroi.') || text.startsWith('hero.')) {
      const err = new Error(`O herói não conhece o comando "${text}" na linha ${lineNum}. Verifique a lista de feitiços!`);
      err.lineNumber = lineNum;
      throw err;
    } else {
      const err = new Error(`Comando não reconhecido na linha ${lineNum}: "${text}".`);
      err.lineNumber = lineNum;
      throw err;
    }
  }

  // Avaliação de condições bilíngues
  evaluateCondition(cond, scope, sim, lineNum) {
    cond = cond.replace(/\s+/g, '');

    // CAMINHO LIVRE
    if (cond === 'heroi.caminho_livre()' || cond === 'hero.is_path_clear()' || cond === 'hero.isPathClear()' || cond === 'hero.path_clear()') {
      return sim.isPathAheadFree();
    }

    // TEM INIMIGO
    if (cond === 'heroi.tem_inimigo()' || cond === 'hero.has_enemy()' || cond === 'hero.hasEnemy()') {
      return sim.hasEnemyAhead();
    }

    // TEM CHAVE
    if (cond === 'heroi.tem_chave()' || cond === 'hero.has_key()' || cond === 'hero.hasKey()') {
      return sim.hasKeyInInventory();
    }

    // TEM GEMA
    if (cond === 'heroi.tem_joia()' || cond === 'heroi.tem_cristal()' || cond === 'hero.has_gem()' || cond === 'hero.hasGem()') {
      return sim.isCurrentTileGem();
    }

    // CHEGOU AO PORTAL
    if (cond === 'heroi.chegou_ao_tesouro()' || cond === 'heroi.chegou_ao_portal()' || cond === 'hero.reached_goal()' || cond === 'hero.reachedGoal()') {
      return sim.isCurrentTilePortal();
    }

    // NEGAÇÃO (not ...)
    if (cond.startsWith('not')) {
      const sub = cond.replace(/^not/, '');
      return !this.evaluateCondition(sub, scope, sim, lineNum);
    }

    // Comparações simples (x < 5, i < 3)
    if (cond.includes('<')) {
      const [a, b] = cond.split('<');
      const va = scope.vars[a] !== undefined ? scope.vars[a] : Number(a);
      const vb = scope.vars[b] !== undefined ? scope.vars[b] : Number(b);
      return va < vb;
    }
    if (cond.includes('>')) {
      const [a, b] = cond.split('>');
      const va = scope.vars[a] !== undefined ? scope.vars[a] : Number(a);
      const vb = scope.vars[b] !== undefined ? scope.vars[b] : Number(b);
      return va > vb;
    }
    if (cond.includes('==')) {
      const [a, b] = cond.split('==');
      const va = scope.vars[a] !== undefined ? scope.vars[a] : a;
      const vb = scope.vars[b] !== undefined ? scope.vars[b] : b;
      return va === vb;
    }

    return false;
  }
}
