// ==========================================================================
// MODAL CONTROLLER - MDEV CODEQUEST
// Modais de Vitória, Mapa de Fases, Conquistas, Guia e Escolha de Personagem
// ==========================================================================

import confetti from 'canvas-confetti';
import { LEVELS, TROPHIES, HERO_CHARACTERS } from '../game/levels.js';
import { sound } from '../game/sound.js';

export class ModalController {
  constructor(gamificationManager, onSelectLevelCallback, onSelectHeroCallback) {
    this.gm = gamificationManager;
    this.onSelectLevel = onSelectLevelCallback;
    this.onSelectHero = onSelectHeroCallback;

    this.victoryModal = document.getElementById('victory-modal');
    this.mapModal = document.getElementById('map-modal');
    this.trophiesModal = document.getElementById('trophies-modal');
    this.guideModal = document.getElementById('guide-modal');
    this.characterModal = document.getElementById('character-modal');

    this.initEvents();
  }

  initEvents() {
    // Fechar modais ao clicar no botão X ou fora do card
    const closeButtons = [
      { btn: 'close-map-btn', modal: this.mapModal },
      { btn: 'close-trophies-btn', modal: this.trophiesModal },
      { btn: 'close-guide-btn', modal: this.guideModal },
      { btn: 'guide-ok-btn', modal: this.guideModal },
      { btn: 'close-character-btn', modal: this.characterModal }
    ];

    closeButtons.forEach(({ btn, modal }) => {
      const el = document.getElementById(btn);
      if (el) {
        el.addEventListener('click', () => {
          sound.playClick();
          this.closeModal(modal);
        });
      }
    });

    // Fechar ao clicar no backdrop (fora do card)
    [this.victoryModal, this.mapModal, this.trophiesModal, this.guideModal, this.characterModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal && modal !== this.victoryModal) {
            this.closeModal(modal);
          }
        });
      }
    });
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
  }

  // ==========================================================================
  // MODAL DE VITÓRIA
  // ==========================================================================
  showVictory(levelData, result, onNextLevel, onReplay) {
    document.getElementById('victory-level-name').textContent = levelData.title;
    document.getElementById('victory-xp-earned').textContent = `+${result.xpEarned} XP`;
    document.getElementById('victory-gems-earned').textContent = `+${result.gemsEarned}`;

    // Estrelas
    const starsBox = document.getElementById('victory-stars-box');
    const starWrappers = starsBox.querySelectorAll('.star-wrapper');
    starWrappers.forEach((sw, idx) => {
      if (idx < result.stars) {
        sw.classList.add('earned');
      } else {
        sw.classList.remove('earned');
      }
    });

    // Critérios das estrelas
    const criteriaList = document.getElementById('star-criteria-list');
    criteriaList.innerHTML = '';
    result.starDetails.forEach(crit => {
      const item = document.createElement('div');
      item.className = `criterion-item ${crit.achieved ? 'achieved' : ''}`;
      item.innerHTML = `<span>${crit.achieved ? '✅' : '⚪'}</span> <span>${crit.text}</span>`;
      criteriaList.appendChild(item);
    });

    // Badge desbloqueada (se houver)
    const badgeUnlockBox = document.getElementById('victory-badge-unlock');
    if (result.newBadge) {
      badgeUnlockBox.classList.remove('hidden');
      document.getElementById('unlocked-badge-icon').textContent = result.newBadge.icon;
      document.getElementById('unlocked-badge-title').textContent = result.newBadge.title;
    } else {
      badgeUnlockBox.classList.add('hidden');
    }

    // Ações dos botões
    const nextBtn = document.getElementById('victory-next-btn');
    const replayBtn = document.getElementById('victory-replay-btn');

    nextBtn.onclick = () => {
      sound.playClick();
      this.closeModal(this.victoryModal);
      if (onNextLevel) onNextLevel();
    };

    replayBtn.onclick = () => {
      sound.playClick();
      this.closeModal(this.victoryModal);
      if (onReplay) onReplay();
    };

    this.openModal(this.victoryModal);

    // Explosão épica de confetes!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    } catch (e) {}
  }

  // ==========================================================================
  // MODAL DO MAPA DE FASES
  // ==========================================================================
  showMap(currentLevelId) {
    const listContainer = document.getElementById('map-levels-list');
    listContainer.innerHTML = '';

    // Agrupa fases por mundo
    const worlds = [
      { id: 1, name: 'Mundo 1: Masmorra dos Primeiros Passos' },
      { id: 2, name: 'Mundo 2: Floresta dos Laços (Loops)' },
      { id: 3, name: 'Mundo 3: Templo das Decisões (If/Else)' }
    ];

    worlds.forEach(w => {
      const worldGroup = document.createElement('div');
      worldGroup.className = 'world-group';

      const worldTitle = document.createElement('h3');
      worldTitle.className = 'world-title';
      worldTitle.textContent = w.name;
      worldGroup.appendChild(worldTitle);

      const grid = document.createElement('div');
      grid.className = 'levels-grid';

      const worldLevels = LEVELS.filter(l => l.world === w.id);
      worldLevels.forEach(lvl => {
        const isUnlocked = this.gm.state.unlockedLevels.includes(lvl.id);
        const isActive = lvl.id === currentLevelId;
        const stars = this.gm.state.levelStars[lvl.id] || 0;

        const card = document.createElement('div');
        card.className = `level-card-item ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}`;

        // Renderiza estrelas conquistadas
        let starsHtml = '';
        for (let s = 1; s <= 3; s++) {
          starsHtml += s <= stars ? '⭐' : '⚪';
        }

        card.innerHTML = `
          <div class="level-num-badge">${lvl.id}</div>
          <span class="level-name-label">${lvl.title.split(':')[1] || lvl.title}</span>
          <div class="level-stars-display">${isUnlocked ? starsHtml : '🔒 Bloqueada'}</div>
        `;

        if (isUnlocked) {
          card.onclick = () => {
            sound.playClick();
            this.closeModal(this.mapModal);
            if (this.onSelectLevel) this.onSelectLevel(lvl.id);
          };
        }

        grid.appendChild(card);
      });

      worldGroup.appendChild(grid);
      listContainer.appendChild(worldGroup);
    });

    this.openModal(this.mapModal);
  }

  // ==========================================================================
  // MODAL DE CONQUISTAS
  // ==========================================================================
  showTrophies() {
    const grid = document.getElementById('trophies-grid-container');
    grid.innerHTML = '';

    TROPHIES.forEach(trophy => {
      const isUnlocked = this.gm.state.unlockedBadges.includes(trophy.id);
      const item = document.createElement('div');
      item.className = `trophy-item ${isUnlocked ? 'unlocked' : 'locked'}`;

      item.innerHTML = `
        <div class="trophy-icon">${trophy.icon}</div>
        <div class="trophy-info">
          <h4>${trophy.title}</h4>
          <p>${trophy.desc}</p>
        </div>
      `;

      grid.appendChild(item);
    });

    this.openModal(this.trophiesModal);
  }

  // ==========================================================================
  // MODAL DO GUIA
  // ==========================================================================
  showGuide() {
    this.openModal(this.guideModal);
  }

  // ==========================================================================
  // MODAL DE PERSONAGENS
  // ==========================================================================
  showCharacterPicker() {
    const grid = document.getElementById('characters-selector-grid');
    grid.innerHTML = '';

    HERO_CHARACTERS.forEach(char => {
      const isSelected = this.gm.state.heroId === char.id;
      const card = document.createElement('div');
      card.className = `char-choice-card ${isSelected ? 'selected' : ''}`;

      card.innerHTML = `
        <span class="char-emoji-big">${char.emoji}</span>
        <span class="char-title">${char.name}</span>
      `;

      card.onclick = () => {
        sound.playClick();
        this.gm.setHero(char.id);
        if (this.onSelectHero) this.onSelectHero(char);
        this.closeModal(this.characterModal);
      };

      grid.appendChild(card);
    });

    this.openModal(this.characterModal);
  }
}
