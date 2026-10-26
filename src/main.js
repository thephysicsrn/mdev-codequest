// ==========================================================================
// MDEV CODEQUEST - MAIN ENTRY POINT & CONTROLLER (3D + 2D)
// Integração completa de Three.js 3D, Game Engine, Python Runner e Gamificação
// ==========================================================================

import { LEVELS } from './game/levels.js';
import { sound } from './game/sound.js';
import { DungeonEngine } from './game/engine.js';
import { ThreeDungeonEngine } from './game/threeEngine.js';
import { PythonRunner } from './interpreter/pythonRunner.js';
import { EditorComponent } from './ui/editorComponent.js';
import { GamificationManager } from './ui/gamification.js';
import { ModalController } from './ui/modals.js';

class CodeQuestApp {
  constructor() {
    this.currentLevelIndex = 0;
    this.is3D = true;
    this.codeLang = "pt"; // "pt" ou "en" // Modo 3D ativo por padrão!
    this.gm = new GamificationManager();

    // Elementos DOM
    this.dom = {
      // Seletores de Idioma
      btnLangPt: document.getElementById("btn-lang-pt"),
      btnLangEn: document.getElementById("btn-lang-en"),
      landingLangPt: document.getElementById("landing-lang-pt"),
      landingLangEn: document.getElementById("landing-lang-en"),

      // Landing Page
      landingPage: document.getElementById("landing-page"),
      gameApp: document.getElementById("game-app") || document.getElementById("app"),
      landingPlayerName: document.getElementById("landing-player-name"),
      landingHeroPicker: document.getElementById("landing-hero-picker"),
      startGameMainBtn: document.getElementById("start-game-main-btn"),
      navStartBtn: document.getElementById("nav-start-btn"),
      bottomStartBtn: document.getElementById("bottom-start-btn"),
      backToLandingBtn: document.getElementById("back-to-landing-btn"),

      // Header
      logoBtn: document.getElementById('logo-btn'),
      openMapBtn: document.getElementById('open-map-btn'),
      headerLevelTag: document.getElementById('header-level-tag'),
      avatarBtn: document.getElementById('avatar-btn'),
      avatarIcon: document.getElementById('player-avatar-icon'),
      levelBadge: document.getElementById('player-level-badge'),
      playerName: document.getElementById('player-name-display'),
      xpText: document.getElementById('xp-counter-text'),
      xpFill: document.getElementById('xp-progress-fill'),
      gemsDisplay: document.getElementById('gems-count-display'),
      starsDisplay: document.getElementById('stars-count-display'),
      streakDisplay: document.getElementById('streak-count-display'),
      openTrophiesBtn: document.getElementById('open-trophies-btn'),
      soundToggleBtn: document.getElementById('sound-toggle-btn'),
      openGuideBtn: document.getElementById('open-guide-btn'),

      // Game Section & 3D
      levelTitle: document.getElementById('current-level-title'),
      levelSubtitle: document.getElementById('current-level-subtitle'),
      toggle3dBtn: document.getElementById('toggle-3d-mode-btn'),
      resetCameraBtn: document.getElementById('reset-camera-btn'),
      topdownCameraBtn: document.getElementById('topdown-camera-btn'),
      toggleSpeedBtn: document.getElementById('toggle-speed-btn'),
      speedLabel: document.getElementById('speed-label'),
      canvasContainer: document.getElementById('canvas-container'),
      threeCanvas: document.getElementById('three-canvas'),
      dungeonBoard: document.getElementById('dungeon-board'),
      cameraHint: document.getElementById('camera-hint'),
      toastOverlay: document.getElementById('game-toast-overlay'),
      toastMessage: document.getElementById('toast-message'),
      runBtn: document.getElementById('run-code-btn'),
      stepBtn: document.getElementById('step-code-btn'),
      resetBtn: document.getElementById('reset-board-btn'),
      inventoryBar: document.getElementById('inventory-items-container'),

      // Editor Section
      clearCodeBtn: document.getElementById('clear-code-btn'),
      copyCodeBtn: document.getElementById('copy-code-btn'),
      spellPalette: document.getElementById('spell-palette-container'),
      codeTextarea: document.getElementById('code-input'),
      codeHighlight: document.getElementById('code-highlight'),
      lineNumbers: document.getElementById('editor-line-numbers'),
      activeMarker: document.getElementById('active-line-marker'),

      // Console
      tabMerlin: document.getElementById('tab-merlin'),
      tabOutput: document.getElementById('tab-output'),
      merlinContent: document.getElementById('merlin-content'),
      outputContent: document.getElementById('output-content'),
      merlinMessage: document.getElementById('merlin-message'),
      requestHintBtn: document.getElementById('request-hint-btn'),
      terminalLogs: document.getElementById('terminal-logs'),
      outputBadgeCount: document.getElementById('output-badge-count')
    };

    // Inicialização dos Motores com Fallback Resiliente
    try {
      this.threeEngine = new ThreeDungeonEngine(this.dom.threeCanvas, this.dom.canvasContainer);
    } catch (err3d) {
      console.error("Falha ao inicializar ThreeDungeonEngine 3D:", err3d);
      this.threeEngine = null;
      this.is3D = false;
    }

    try {
      this.engine2D = new DungeonEngine(this.dom.dungeonBoard, this.dom.inventoryBar);
    } catch (err2d) {
      console.error("Falha ao inicializar DungeonEngine 2D:", err2d);
      this.engine2D = null;
    }

    this.activeEngine = (this.is3D && this.threeEngine) ? this.threeEngine : this.engine2D;
    this.python = new PythonRunner(this.activeEngine);

    this.editor = new EditorComponent(
      this.dom.codeTextarea,
      this.dom.codeHighlight,
      this.dom.lineNumbers,
      this.dom.activeMarker,
      this.dom.spellPalette
    );

    this.modals = new ModalController(
      this.gm,
      (lvlId) => this.loadLevelById(lvlId),
      (hero) => this.onHeroChanged(hero)
    );

    this.initCallbacks();
    this.initEventListeners();
    this.updateHeaderUI();

    // Carrega a última fase jogada ou a fase 1
    const lastUnlocked = (Array.isArray(this.gm?.state?.unlockedLevels) && this.gm.state.unlockedLevels.length > 0)
      ? Math.max(...this.gm.state.unlockedLevels)
      : 1;
    this.loadLevelById(lastUnlocked || 1);
  }

  initCallbacks() {
    const handleVictory = (result) => {
      const currentLvl = LEVELS[this.currentLevelIndex];
      const newBadge = this.gm.recordLevelCompletion(
        result.levelId,
        result.stars,
        result.gemsEarned,
        result.xpEarned
      );

      result.newBadge = newBadge;
      this.updateHeaderUI();

      setTimeout(() => {
        this.modals.showVictory(
          currentLvl,
          result,
          () => this.nextLevel(),
          () => this.reloadCurrentLevel()
        );
      }, 500);
    };

    const handleActiveLine = (lineNum) => {
      this.editor.setActiveLine(lineNum);
    };

    const handleToast = (msg) => {
      this.showToast(msg);
    };

    // Callbacks do motor 3D
    if (this.threeEngine) {
      this.threeEngine.onLevelCompleted = handleVictory;
      this.threeEngine.onActiveLineChanged = handleActiveLine;
      this.threeEngine.onToastRequested = handleToast;
      this.threeEngine.onInventoryChanged = (inv) => this.updateInventoryUI(inv);
    }

    // Callbacks do motor 2D
    if (this.engine2D) {
      this.engine2D.onLevelCompleted = handleVictory;
      this.engine2D.onActiveLineChanged = handleActiveLine;
      this.engine2D.onToastRequested = handleToast;
    }
  }

  initEventListeners() {
    // Transição da Landing Page para o Jogo
    
    const launchGame = () => {
      sound.playVictory();
      const enteredName = this.dom.landingPlayerName ? this.dom.landingPlayerName.value.trim() : "";
      if (enteredName) {
        this.gm.state.playerName = enteredName;
      }
      this.gm.saveState();
      this.updateHeaderUI();

      if (this.dom.landingPage) {
        this.dom.landingPage.classList.add("hidden");
        this.dom.landingPage.style.display = "none";
      }
      if (this.dom.gameApp) {
        this.dom.gameApp.classList.remove("hidden");
      }

      setTimeout(() => {
        if (this.threeEngine) {
          this.threeEngine.onResize();
          this.threeEngine.resetCamera();
        }
      }, 60);
      setTimeout(() => {
        if (this.threeEngine) {
          this.threeEngine.onResize();
        }
      }, 250);

      this.showToast("⚔️ Bem-vindo à Masmorra do Código! Leia os objetivos e lance seu primeiro feitiço.");
    };

    window.launchGameNow = launchGame;
    window.setPlatformLanguage = (lang) => this.setLanguage(lang);


    if (this.dom.btnLangPt) this.dom.btnLangPt.addEventListener("click", () => { sound.playClick(); this.setLanguage("pt"); });
    if (this.dom.btnLangEn) this.dom.btnLangEn.addEventListener("click", () => { sound.playClick(); this.setLanguage("en"); });
    if (this.dom.landingLangPt) this.dom.landingLangPt.addEventListener("click", () => { sound.playClick(); this.setLanguage("pt"); });
    if (this.dom.landingLangEn) this.dom.landingLangEn.addEventListener("click", () => { sound.playClick(); this.setLanguage("en"); });

    if (this.dom.startGameMainBtn) this.dom.startGameMainBtn.addEventListener("click", launchGame);
    if (this.dom.navStartBtn) this.dom.navStartBtn.addEventListener("click", launchGame);
    if (this.dom.bottomStartBtn) this.dom.bottomStartBtn.addEventListener("click", launchGame);

    // Voltar da Masmorra para a Landing Page / Guia
    if (this.dom.backToLandingBtn) {
      this.dom.backToLandingBtn.addEventListener("click", () => {
        sound.playClick();
        if (this.dom.landingPage) {
          this.dom.landingPage.style.display = "";
          this.dom.landingPage.classList.remove("hidden");
          this.dom.landingPage.scrollTop = 0;
        }
      });
    }

    // Seletor de Heróis na Landing Page
    if (this.dom.landingHeroPicker) {
      const cards = this.dom.landingHeroPicker.querySelectorAll(".hero-option-card");
      cards.forEach(card => {
        card.addEventListener("click", () => {
          sound.playClick();
          cards.forEach(c => c.classList.remove("active"));
          card.classList.add("active");
          const heroId = card.dataset.hero;
          this.gm.setHero(heroId);
          this.onHeroChanged({ emoji: this.gm.state.heroEmoji, name: card.querySelector(".hero-option-name").textContent });
        });
      });
    }

    // Executar Feitiço (Rodar Código)
    this.dom.runBtn.addEventListener('click', () => {
      this.runCode();
    });

    // Passo a Passo
    this.dom.stepBtn.addEventListener('click', () => {
      this.stepCode();
    });

    // Reiniciar Posição
    this.dom.resetBtn.addEventListener('click', () => {
      sound.playClick();
      this.activeEngine.resetHeroPosition();
      this.editor.setActiveLine(null);
      this.setMerlinMessage('Posição reiniciada! Pode lançar seu feitiço novamente.', 'normal');
    });

    // Alternar Modo 3D / 2D
    this.dom.toggle3dBtn.addEventListener('click', () => {
      sound.playClick();
      this.is3D = !this.is3D;
      this.activeEngine = this.is3D ? this.threeEngine : this.engine2D;
      this.python.game = this.activeEngine;

      if (this.is3D) {
        this.dom.threeCanvas.classList.remove('hidden');
        this.dom.dungeonBoard.classList.add('hidden');
        this.dom.cameraHint.classList.remove('hidden');
        this.dom.resetCameraBtn.classList.remove('hidden');
        this.dom.toggle3dBtn.classList.add('active');
        this.dom.toggle3dBtn.innerHTML = '<span>🎮 3D Ativo</span>';
        this.threeEngine.onResize();
        this.threeEngine.resetCamera();
        this.showToast('✨ Modo 3D Imersivo ativado! Arraste com o mouse para girar o cenário.');
      } else {
        this.dom.threeCanvas.classList.add('hidden');
        this.dom.dungeonBoard.classList.remove('hidden');
        this.dom.cameraHint.classList.add('hidden');
        this.dom.resetCameraBtn.classList.add('hidden');
        this.dom.toggle3dBtn.classList.remove('active');
        this.dom.toggle3dBtn.innerHTML = '<span>🗺️ Modo 2D</span>';
        this.showToast('🗺️ Modo 2D Clássico ativado.');
      }
    });

    // Visão Top-Down
    if (this.dom.topdownCameraBtn) {
      this.dom.topdownCameraBtn.addEventListener("click", () => {
        sound.playClick();
        this.threeEngine.setTopDownCamera();
        this.showToast("👁️ Visão Top-Down (Tática) ativada!");
      });
    }

    // Centralizar Câmera 3D
    this.dom.resetCameraBtn.addEventListener('click', () => {
      sound.playClick();
      this.threeEngine.resetCamera();
      this.showToast('🎥 Câmera 3D recentralizada!');
    });

    // Atalho de Teclado: Ctrl + Enter ou Cmd + Enter para Rodar
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.runCode();
      }
    });

    // Botão de Som
    this.dom.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.dom.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      this.dom.soundToggleBtn.title = isMuted ? 'Ativar Som' : 'Desativar Som';
    });

    // Botões de Mapa, Troféus, Guia e Avatar
    this.dom.openMapBtn.addEventListener('click', () => {
      sound.playClick();
      this.modals.showMap(LEVELS[this.currentLevelIndex].id);
    });

    this.dom.openTrophiesBtn.addEventListener('click', () => {
      sound.playClick();
      this.modals.showTrophies();
    });

    this.dom.openGuideBtn.addEventListener('click', () => {
      sound.playClick();
      this.modals.showGuide();
    });

    this.dom.avatarBtn.addEventListener('click', () => {
      sound.playClick();
      this.modals.showCharacterPicker();
    });

    // Alternar Velocidade
    this.dom.toggleSpeedBtn.addEventListener('click', () => {
      sound.playClick();
      const speed = this.activeEngine.cycleSpeed();
      this.dom.speedLabel.textContent = `⚡ ${speed}x`;
    });

    // Limpar / Restaurar Código da Fase
    this.dom.clearCodeBtn.addEventListener('click', () => {
      sound.playClick();
      const currentLvl = LEVELS[this.currentLevelIndex];
      this.editor.setCode(currentLvl.initialCode);
      this.setMerlinMessage('O código inicial desta fase foi restaurado!', 'normal');
    });

    // Copiar Código
    this.dom.copyCodeBtn.addEventListener('click', () => {
      sound.playClick();
      navigator.clipboard.writeText(this.editor.getCode());
      this.showToast('📋 Código copiado para a área de transferência!');
    });

    // Botão de Dica do Merlin
    this.dom.requestHintBtn.addEventListener('click', () => {
      sound.playClick();
      const currentLvl = LEVELS[this.currentLevelIndex];
      this.setMerlinMessage(`💡 <strong>Dica do Merlin:</strong> ${currentLvl.hint}`, 'hint');
    });

    // Alternar Abas do Console (Merlin vs Terminal)
    this.dom.tabMerlin.addEventListener('click', () => {
      this.switchConsoleTab('merlin');
    });

    this.dom.tabOutput.addEventListener('click', () => {
      this.switchConsoleTab('output');
    });
  }

  // Executa o código Python
  async runCode() {
    if (this.activeEngine.isPlaying) return;

    sound.playClick();
    this.activeEngine.resetHeroPosition();
    this.editor.setActiveLine(null);

    const code = this.editor.getCode();
    const effectiveLines = this.editor.getEffectiveLineCount();

    // Interpreta o código Python
    this.python.game = this.activeEngine;
    const result = this.python.execute(code);

    // Atualiza logs do terminal
    this.updateTerminalLogs(result.logs);

    if (!result.success) {
      sound.playBump();
      this.editor.setActiveLine(result.line);
      this.setMerlinMessage(`🧙‍♂️ <strong>Ops! Erro no Feitiço (Linha ${result.line}):</strong> ${result.error}`, 'error');
      this.switchConsoleTab('merlin');
      return;
    }

    if (result.actions.length === 0) {
      this.setMerlinMessage('O seu feitiço não contém nenhuma ação para o herói realizar. Tente usar comandos como heroi.andar_direita()!', 'warn');
      return;
    }

    // Altera botão para estado de execução
    this.dom.runBtn.classList.add('running');
    this.dom.runBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-label">Executando em 3D...</span>';

    this.setMerlinMessage('🌟 Feitiço lançado! Observe o herói navegando pelo mundo 3D...', 'normal');

    // Executa a fila de ações animadas
    await this.activeEngine.playActionQueue(result.actions, effectiveLines);

    this.dom.runBtn.classList.remove('running');
    this.dom.runBtn.innerHTML = '<span class="btn-icon">▶</span><span class="btn-label">Lançar Código!</span>';
  }

  // Execução de um único passo
  async stepCode() {
    const code = this.editor.getCode();
    this.python.game = this.activeEngine;
    const result = this.python.execute(code);
    if (!result.success) {
      this.editor.setActiveLine(result.line);
      this.setMerlinMessage(`Ops! Verifique seu código antes: ${result.error}`, 'error');
      return;
    }
    if (result.actions.length > 0) {
      const act = result.actions[0];
      if (act.line) this.editor.setActiveLine(act.line);
      await this.activeEngine.executeSingleAction(act);
    }
  }

  // Carrega uma fase específica pelo ID
  
  setLanguage(lang) {
    this.codeLang = lang;
    const isEn = lang === "en";

    // Atualiza botões no editor
    if (this.dom.btnLangPt) this.dom.btnLangPt.classList.toggle("active", !isEn);
    if (this.dom.btnLangEn) this.dom.btnLangEn.classList.toggle("active", isEn);
    if (this.dom.landingLangPt) this.dom.landingLangPt.classList.toggle("active", !isEn);
    if (this.dom.landingLangEn) this.dom.landingLangEn.classList.toggle("active", isEn);

    // Atualiza paleta de feitiços da fase atual
    const lvl = LEVELS[this.currentLevelIndex];
    if (lvl) {
      const spells = isEn ? (lvl.spellsEn || lvl.spells) : lvl.spells;
      this.editor.renderSpellsPalette(spells);

      // Atualiza código padrão se ainda for o inicial
      const currentCode = this.editor.getCode().trim();
      if (currentCode === lvl.initialCode.trim() || currentCode === lvl.initialCodeEn.trim()) {
        this.editor.setCode(isEn ? lvl.initialCodeEn : lvl.initialCode);
      }
    }

    // Atualiza comandos exibidos na Landing Page
    this.updateLandingCommands(isEn);

    this.showToast(isEn ? "🇺🇸 Modo de comandos em Inglês ativado! (hero.move_right(), hero.attack())" : "🇧🇷 Modo de comandos em Português ativado! (heroi.andar_direita())");
  }

  updateLandingCommands(isEn) {
    const section = document.getElementById("comandos-section");
    if (!section) return;

    if (isEn) {
      section.querySelector(".command-category-card:nth-child(1) .command-items-list").innerHTML = `
        <div class="command-row">
          <code class="code-syntax">hero.move_right()</code>
          <span class="command-explanation">Takes 1 step to the right.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">hero.move_left()</code>
          <span class="command-explanation">Takes 1 step to the left.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">hero.move_up()</code>
          <span class="command-explanation">Steps 1 block upward.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">hero.move_down()</code>
          <span class="command-explanation">Steps 1 block downward.</span>
        </div>
      `;

      section.querySelector(".command-category-card:nth-child(2) .command-items-list").innerHTML = `
        <div class="command-row">
          <code class="code-syntax">hero.collect()</code>
          <span class="command-explanation">Picks up mana crystals or golden keys.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">hero.attack()</code>
          <span class="command-explanation">Strikes monsters or slimes with magical staff!</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">hero.open_door()</code>
          <span class="command-explanation">Opens locked door if hero carries a key.</span>
        </div>
      `;
    } else {
      section.querySelector(".command-category-card:nth-child(1) .command-items-list").innerHTML = `
        <div class="command-row">
          <code class="code-syntax">heroi.andar_direita()</code>
          <span class="command-explanation">Dá 1 passo para a direita no tabuleiro.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">heroi.andar_esquerda()</code>
          <span class="command-explanation">Dá 1 passo para a esquerda no tabuleiro.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">heroi.andar_cima()</code>
          <span class="command-explanation">Sobe 1 bloco em direção ao norte.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">heroi.andar_baixo()</code>
          <span class="command-explanation">Desce 1 bloco em direção ao sul.</span>
        </div>
      `;

      section.querySelector(".command-category-card:nth-child(2) .command-items-list").innerHTML = `
        <div class="command-row">
          <code class="code-syntax">heroi.coletar()</code>
          <span class="command-explanation">Pega cristais de mana 💎 ou chaves douradas 🗝️ do chão.</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">heroi.atacar()</code>
          <span class="command-explanation">Desfere um golpe mágico com o cajado para derrotar Slimes ou monstros!</span>
        </div>
        <div class="command-row">
          <code class="code-syntax">heroi.abrir_porta()</code>
          <span class="command-explanation">Abre uma porta trancada se você já tiver coletado a chave.</span>
        </div>
      `;
    }
  }

  loadLevelById(levelId) {
    const idx = LEVELS.findIndex(l => l.id === levelId);
    if (idx === -1) return;

    this.currentLevelIndex = idx;
    const lvl = LEVELS[idx];

    if (this.dom.headerLevelTag) this.dom.headerLevelTag.textContent = `Fase ${lvl.id}`;
    if (this.dom.levelTitle) this.dom.levelTitle.textContent = lvl.title;
    if (this.dom.levelSubtitle) this.dom.levelSubtitle.textContent = lvl.subtitle;

    // Carrega em ambos os motores com proteção contra falhas individuais
    if (this.threeEngine) {
      try {
        this.threeEngine.loadLevel(lvl, this.gm?.state?.heroEmoji || '🧙‍♂️');
      } catch (err3d) {
        console.error("Erro ao carregar no ThreeDungeonEngine:", err3d);
      }
    }
    if (this.engine2D) {
      try {
        this.engine2D.loadLevel(lvl, this.gm?.state?.heroEmoji || '🧙‍♂️');
      } catch (err2d) {
        console.error("Erro ao carregar no DungeonEngine 2D:", err2d);
      }
    }

    // Carrega código e botões mágicos
    const isEn = this.codeLang === "en";
    if (this.editor) {
      this.editor.setCode(isEn ? (lvl.initialCodeEn || lvl.initialCode) : lvl.initialCode);
      this.editor.renderSpellsPalette(isEn ? (lvl.spellsEn || lvl.spells) : lvl.spells);
    }

    // Mensagem de boas-vindas do Merlin
    this.setMerlinMessage(`Olá, nobre aventureiro! Na <strong>${lvl.title}</strong>, seu objetivo é aprender sobre <strong>${lvl.pedagogy}</strong>. Lance seu código em 3D!`, 'normal');

    this.switchConsoleTab('merlin');
    this.updateHeaderUI();
  }

  reloadCurrentLevel() {
    this.loadLevelById(LEVELS[this.currentLevelIndex].id);
  }

  nextLevel() {
    const nextIdx = this.currentLevelIndex + 1;
    if (nextIdx < LEVELS.length) {
      this.loadLevelById(LEVELS[nextIdx].id);
    } else {
      this.modals.showMap(LEVELS[this.currentLevelIndex].id);
    }
  }

  onHeroChanged(hero) {
    this.dom.avatarIcon.textContent = hero.emoji;
    this.threeEngine.create3DHero();
    this.engine2D.heroChar = hero.emoji;
    this.engine2D.createHeroElement();
    this.showToast(`✨ Herói alterado para ${hero.name}!`);
  }

  updateHeaderUI() {
    const lvlInfo = this.gm.getLevelInfo();
    this.dom.playerName.textContent = lvlInfo.title;
    this.dom.levelBadge.textContent = `Nv. ${lvlInfo.level}`;
    this.dom.xpText.textContent = `${lvlInfo.currentXP} / ${lvlInfo.nextLevelXP} XP`;
    this.dom.xpFill.style.width = `${lvlInfo.progressPercent}%`;

    this.dom.avatarIcon.textContent = this.gm.state.heroEmoji;
    this.dom.gemsDisplay.textContent = this.gm.state.gems;
    this.dom.starsDisplay.textContent = `${this.gm.getTotalStars()}/${LEVELS.length * 3}`;
    this.dom.streakDisplay.textContent = `${this.gm.state.streak} ${this.gm.state.streak === 1 ? 'dia' : 'dias'}`;
  }

  updateInventoryUI(inv) {
    if (!this.dom.inventoryBar) return;
    this.dom.inventoryBar.innerHTML = '';

    if (inv.gems === 0 && inv.keys === 0) {
      this.dom.inventoryBar.innerHTML = '<span class="inv-empty-msg">Vazia</span>';
      return;
    }

    if (inv.gems > 0) {
      const slot = document.createElement('span');
      slot.className = 'inv-item-slot';
      slot.innerHTML = `💎 ${inv.gems}`;
      this.dom.inventoryBar.appendChild(slot);
    }

    if (inv.keys > 0) {
      const slot = document.createElement('span');
      slot.className = 'inv-item-slot';
      slot.innerHTML = `🗝️ ${inv.keys}`;
      this.dom.inventoryBar.appendChild(slot);
    }
  }

  setMerlinMessage(msg, type = 'normal') {
    this.dom.merlinMessage.innerHTML = msg;
  }

  updateTerminalLogs(logs) {
    this.dom.terminalLogs.innerHTML = '';
    this.dom.outputBadgeCount.textContent = logs.length;

    if (logs.length === 0) {
      this.dom.terminalLogs.innerHTML = '<span class="log-info">> Nenhum texto impresso pelo feitiço. Use print("Olá") para ver saídas aqui!</span>';
      return;
    }

    logs.forEach(log => {
      const row = document.createElement('div');
      row.className = 'log-print';
      row.textContent = `> ${log}`;
      this.dom.terminalLogs.appendChild(row);
    });
  }

  switchConsoleTab(tab) {
    if (tab === 'merlin') {
      this.dom.tabMerlin.classList.add('active');
      this.dom.tabOutput.classList.remove('active');
      this.dom.merlinContent.classList.remove('hidden');
      this.dom.outputContent.classList.add('hidden');
    } else {
      this.dom.tabMerlin.classList.remove('active');
      this.dom.tabOutput.classList.add('active');
      this.dom.merlinContent.classList.add('hidden');
      this.dom.outputContent.classList.remove('hidden');
    }
  }

  showToast(msg) {
    this.dom.toastMessage.innerHTML = msg;
    this.dom.toastOverlay.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.dom.toastOverlay.classList.add('hidden');
    }, 2800);
  }
}


function initApp() {
  if (!window.codeQuestApp) {
    try {
      window.codeQuestApp = new CodeQuestApp();
      window.app = window.codeQuestApp;
      console.log("MDev CodeQuest inicializado com sucesso!", window.codeQuestApp);
    } catch (err) {
      console.error("Erro fatal ao inicializar CodeQuestApp:", err);
      const errBanner = document.createElement('div');
      errBanner.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#b91c1c;color:#fff;padding:16px;border-radius:8px;z-index:999999;font-family:monospace;font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,0.8);white-space:pre-wrap;';
      errBanner.innerHTML = `<strong>⚠️ Erro ao inicializar CodeQuestApp:</strong><br>${err.message}<br><small style="color:#fca5a5">${err.stack || ''}</small>`;
      (document.body || document.documentElement).appendChild(errBanner);
    }
  }
}
window.initApp = initApp;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

