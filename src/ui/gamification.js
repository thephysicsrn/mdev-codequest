// ==========================================================================
// GAMIFICATION MANAGER - MDEV CODEQUEST
// Progresso, XP, Níveis, Estrelas, Conquistas e Persistência no LocalStorage
// ==========================================================================

import { TROPHIES, HERO_CHARACTERS } from '../game/levels.js';
import { sound } from '../game/sound.js';

const STORAGE_KEY = 'mdev_codequest_save_v1';

export class GamificationManager {
  constructor() {
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      playerName: 'Mago Aprendiz',
      heroId: 'wizard',
      heroEmoji: '🧙‍♂️',
      xp: 0,
      gems: 0,
      streak: 1,
      lastPlayDate: new Date().toDateString(),
      unlockedLevels: [1],
      levelStars: {}, // { 1: 3, 2: 2, ... }
      unlockedBadges: [] // ['first_spell', ...]
    };
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Atualiza streak se for um novo dia
        const today = new Date().toDateString();
        if (parsed.lastPlayDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          if (parsed.lastPlayDate === yesterday) {
            parsed.streak = (parsed.streak || 1) + 1;
          }
          parsed.lastPlayDate = today;
        }
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (e) {
      console.warn('Erro ao carregar progresso:', e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Erro ao salvar progresso:', e);
    }
  }

  // Níveis de Mago calculados por XP
  getLevelInfo() {
    const xp = this.state.xp;
    const thresholds = [
      { level: 1, minXP: 0, maxXP: 100, title: 'Aprendiz da Masmorra' },
      { level: 2, minXP: 100, maxXP: 250, title: 'Iniciado em Python' },
      { level: 3, minXP: 250, maxXP: 450, title: 'Feiticeiro dos Laços' },
      { level: 4, minXP: 450, maxXP: 700, title: 'Mago dos Algoritmos' },
      { level: 5, minXP: 700, maxXP: 1000, title: 'Arquimago Lendário' }
    ];

    for (let i = 0; i < thresholds.length; i++) {
      const t = thresholds[i];
      if (xp < t.maxXP || i === thresholds.length - 1) {
        const levelXP = xp - t.minXP;
        const totalNeeded = t.maxXP - t.minXP;
        const percent = Math.min(100, Math.max(0, (levelXP / totalNeeded) * 100));
        return {
          level: t.level,
          title: t.title,
          currentXP: xp,
          nextLevelXP: t.maxXP,
          progressPercent: percent
        };
      }
    }

    return {
      level: 5,
      title: 'Arquimago Lendário',
      currentXP: xp,
      nextLevelXP: xp,
      progressPercent: 100
    };
  }

  // Adiciona XP e checa se subiu de nível
  addXP(amount) {
    const oldLevel = this.getLevelInfo().level;
    this.state.xp += amount;
    const newLevel = this.getLevelInfo().level;

    if (newLevel > oldLevel) {
      sound.playVictory();
    }

    this.saveState();
    return { newLevel, leveledUp: newLevel > oldLevel };
  }

  // Adiciona Gemas
  addGems(amount) {
    this.state.gems += amount;
    this.checkBadges();
    this.saveState();
  }

  // Registra conclusão de fase
  recordLevelCompletion(levelId, stars, gemsEarned, xpEarned) {
    // Atualiza estrelas se for recorde pessoal
    const oldStars = this.state.levelStars[levelId] || 0;
    if (stars > oldStars) {
      this.state.levelStars[levelId] = stars;
    }

    // Desbloqueia a próxima fase
    const nextLevelId = levelId + 1;
    if (!this.state.unlockedLevels.includes(nextLevelId) && nextLevelId <= 8) {
      this.state.unlockedLevels.push(nextLevelId);
    }

    this.addGems(gemsEarned);
    this.addXP(xpEarned);

    // Checa novas badges
    const newBadge = this.checkBadges(levelId, stars);
    this.saveState();

    return newBadge;
  }

  // Total de estrelas conquistadas
  getTotalStars() {
    return Object.values(this.state.levelStars).reduce((acc, curr) => acc + curr, 0);
  }

  // Verifica e concede conquistas
  checkBadges(lastLevelCompleted = null, starsEarned = 0) {
    let newlyUnlocked = null;

    const unlock = (badgeId) => {
      if (!this.state.unlockedBadges.includes(badgeId)) {
        this.state.unlockedBadges.push(badgeId);
        const badgeObj = TROPHIES.find(t => t.id === badgeId);
        newlyUnlocked = badgeObj;
      }
    };

    if (lastLevelCompleted === 1) unlock('first_spell');
    if (lastLevelCompleted === 2) unlock('lava_walker');
    if (lastLevelCompleted === 3) unlock('key_master');
    if (lastLevelCompleted === 4) unlock('loop_master');
    if (lastLevelCompleted === 7) unlock('slayer');
    if (lastLevelCompleted === 8) unlock('grand_master');

    if (this.state.gems >= 5) unlock('crystal_collector');
    if (starsEarned === 3) unlock('perfectionist');

    return newlyUnlocked;
  }

  // Troca de personagem
  setHero(heroId) {
    const hero = HERO_CHARACTERS.find(h => h.id === heroId);
    if (hero) {
      this.state.heroId = hero.id;
      this.state.heroEmoji = hero.emoji;
      this.saveState();
      return hero;
    }
    return null;
  }
}
